import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import './Messaging.css';

const Messaging = ({ currentUser }) => {
  const [socket, setSocket] = useState(null);
  const [friends, setFriends] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Encryption key (in production, this should be derived from user credentials)
  const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'miniblog-secret-key-2024';

  useEffect(() => {
    initializeSocket();
    fetchFriends();
    fetchConversations();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSocket = () => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('join', currentUser.id);
    });

    newSocket.on('receive_message', (data) => {
      const decryptedMessage = decryptMessage(data.message.messageTextEncrypted, data.message.encryptionIV);
      const messageWithDecrypted = {
        ...data.message,
        messageText: decryptedMessage
      };
      
      if (selectedFriend && data.senderId === selectedFriend._id) {
        setMessages(prev => [...prev, messageWithDecrypted]);
      }
      
      // Update conversations list
      updateConversationsList(data.senderId, messageWithDecrypted);
    });

    newSocket.on('user_typing', (data) => {
      if (selectedFriend && data.senderId === selectedFriend._id) {
        setTypingUsers(prev => new Set([...prev, data.senderId]));
      }
    });

    newSocket.on('user_stop_typing', (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.senderId);
        return newSet;
      });
    });

    setSocket(newSocket);
  };

  const encryptMessage = (text) => {
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    const iv = CryptoJS.lib.WordArray.random(16).toString();
    return { encryptedText: encrypted, iv };
  };

  const decryptMessage = (encryptedText, iv) => {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      return '[Message could not be decrypted]';
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get('/api/friends');
      setFriends(response.data.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/messages/conversations');
      setConversations(response.data.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (friendId) => {
    try {
      const response = await axios.get(`/api/messages/conversation/${friendId}`);
      setMessages(response.data.data);
      
      // Mark messages as read
      await axios.put(`/api/messages/read/${friendId}`);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend || sendingMessage) return;

    setSendingMessage(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const { encryptedText, iv } = encryptMessage(messageText);
      
      const response = await axios.post('/api/messages', {
        receiverId: selectedFriend._id,
        messageText: messageText
      });

      // Add message to local state
      setMessages(prev => [...prev, response.data.data]);
      
      // Emit real-time message
      if (socket) {
        socket.emit('send_message', {
          receiverId: selectedFriend._id,
          message: response.data.data
        });
      }
      
      // Update conversations list
      updateConversationsList(selectedFriend._id, response.data.data);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTyping = () => {
    if (!isTyping && socket && selectedFriend) {
      setIsTyping(true);
      socket.emit('typing', { receiverId: selectedFriend._id });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket && selectedFriend) {
        socket.emit('stop_typing', { receiverId: selectedFriend._id });
      }
    }, 1000);
  };

  const updateConversationsList = (friendId, message) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.otherUser._id === friendId) {
          return {
            ...conv,
            lastMessage: {
              ...message,
              createdAt: new Date().toISOString()
            }
          };
        }
        return conv;
      });
      
      // Sort by latest message
      return updated.sort((a, b) => 
        new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
      );
    });
  };

  const selectFriend = (friend) => {
    setSelectedFriend(friend);
    fetchMessages(friend._id);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="messaging-container">
        <div className="loading">Loading messaging...</div>
      </div>
    );
  }

  return (
    <div className="messaging-container">
      <div className="messaging-sidebar">
        <h3>Messages</h3>
        <div className="friends-list">
          {friends.map(friend => (
            <div
              key={friend._id}
              className={`friend-item ${selectedFriend?._id === friend._id ? 'active' : ''}`}
              onClick={() => selectFriend(friend)}
            >
              <img
                src={friend.avatarUrl || '/default-avatar.png'}
                alt={friend.name}
                className="friend-avatar"
              />
              <div className="friend-info">
                <h4>{friend.name}</h4>
                <p>@{friend.username}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-area">
        {selectedFriend ? (
          <>
            <div className="chat-header">
              <img
                src={selectedFriend.avatarUrl || '/default-avatar.png'}
                alt={selectedFriend.name}
                className="chat-avatar"
              />
              <div className="chat-info">
                <h3>{selectedFriend.name}</h3>
                <p>@{selectedFriend.username}</p>
              </div>
            </div>

            <div className="messages-container">
              {messages.map(message => (
                <div
                  key={message._id}
                  className={`message ${message.sender._id === currentUser.id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <p>{message.messageText}</p>
                    <span className="message-time">
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
              
              {typingUsers.size > 0 && (
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p>{selectedFriend.name} is typing...</p>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="message-input"
                disabled={sendingMessage}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                className="send-button"
              >
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <h3>Select a friend to start messaging</h3>
            <p>Choose a friend from the sidebar to begin your conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messaging;
