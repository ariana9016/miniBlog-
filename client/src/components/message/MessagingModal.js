import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import io from 'socket.io-client';
import './MessagingModal.css';

const MessagingModal = ({ isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchConnectedUsers();
      initializeSocket();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSocket = () => {
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('connect', () => {
      socketRef.current.emit('join', user._id);
    });

    socketRef.current.on('receive_message', (data) => {
      if (selectedUser && data.senderId === selectedUser._id) {
        setMessages(prev => [...prev, {
          _id: Date.now(),
          sender: data.senderId,
          content: data.message,
          createdAt: data.timestamp
        }]);
      }
    });
  };

  const fetchConnectedUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/follow/connected-users');
      setConnectedUsers(response.data.data);
      setFilteredUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching connected users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(connectedUsers);
    } else {
      const filtered = connectedUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, connectedUsers]);

  const fetchMessages = async (userId) => {
    try {
      const response = await axios.get(`/api/messages/${userId}`);
      setMessages(response.data.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const handleUserSelect = (selectedUser) => {
    setSelectedUser(selectedUser);
    fetchMessages(selectedUser._id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || sending) return;

    setSending(true);
    try {
      const response = await axios.post('/api/messages/send', {
        receiverId: selectedUser._id,
        content: newMessage.trim()
      });

      const sentMessage = response.data.data;
      setMessages(prev => [...prev, sentMessage]);
      
      // Emit to socket for real-time delivery
      if (socketRef.current) {
        socketRef.current.emit('send_message', {
          receiverId: selectedUser._id,
          message: newMessage.trim()
        });
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="messaging-modal-overlay" onClick={onClose}>
      <div className="messaging-modal" onClick={(e) => e.stopPropagation()}>
        <div className="messaging-header">
          <h3>Messages</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="messaging-content">
          {/* User List */}
          <div className="users-panel">
            <h4>Connected Users</h4>
            
            {/* Search Input */}
            <div className="search-container">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            
            {loading ? (
              <div className="loading">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state">
                {searchQuery ? 'No users found' : 'No connected users'}
              </div>
            ) : (
              <div className="users-list">
                {filteredUsers.map(connectedUser => (
                  <div
                    key={connectedUser._id}
                    className={`user-item ${selectedUser?._id === connectedUser._id ? 'active' : ''}`}
                    onClick={() => handleUserSelect(connectedUser)}
                  >
                    <Avatar 
                      src={connectedUser.avatarUrl} 
                      name={connectedUser.name} 
                      size={40}
                      className="user-avatar"
                    />
                    <div className="user-info">
                      <h5>{connectedUser.name}</h5>
                      <p>@{connectedUser.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Panel */}
          <div className="chat-panel">
            {selectedUser ? (
              <>
                <div className="chat-header">
                  <img
                    src={selectedUser.avatarUrl || '/default-avatar.png'}
                    alt={selectedUser.name}
                    className="chat-avatar"
                  />
                  <div>
                    <h4>{selectedUser.name}</h4>
                    <p>@{selectedUser.username}</p>
                  </div>
                </div>
                
                <div className="messages-container">
                  {messages.length === 0 ? (
                    <div className="empty-chat">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map(message => {
                      // More robust sender detection
                      const messageSenderId = message.sender?._id || message.sender;
                      const currentUserId = user?._id || user?.id;
                      const isSentByCurrentUser = messageSenderId === currentUserId;
                      
                      return (
                        <div
                          key={message._id}
                          className={`message ${isSentByCurrentUser ? 'sent' : 'received'}`}
                        >
                          <div className="message-bubble">
                            {message.isOneTime && (
                              <div className="one-time-indicator">
                                🔒 One-time message
                              </div>
                            )}
                            <p>{message.content}</p>
                            <span className="message-time">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form className="message-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                  />
                  <button type="submit" disabled={sending || !newMessage.trim()}>
                    {sending ? '...' : '→'}
                  </button>
                </form>
              </>
            ) : (
              <div className="no-chat-selected">
                <p>Select a user to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingModal;
