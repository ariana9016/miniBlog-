import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import OneTimeMessageModal from './OneTimeMessageModal';
import '../../styles/PeopleYouMayKnow.css';

const PeopleYouMayKnow = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sentMessages, setSentMessages] = useState(new Set());

  useEffect(() => {
    fetchPeopleYouMayKnow();
    fetchSentMessages();
  }, []);

  const fetchPeopleYouMayKnow = async () => {
    try {
      const response = await api.get('/follow/people-you-may-know');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching people you may know:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentMessages = async () => {
    try {
      const response = await api.get('/messages/one-time/sent');
      const sentUserIds = new Set(response.data.data.map(msg => msg.receiverId._id));
      setSentMessages(sentUserIds);
    } catch (error) {
      console.error('Error fetching sent messages:', error);
    }
  };

  const handleFollow = async (userId) => {
    try {
      setFollowingUsers(prev => new Set([...prev, userId]));
      await api.post(`/follow/request/${userId}`);
      
      // Remove user from suggestions after following
      setUsers(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error sending follow request:', error);
      setFollowingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleSendMessage = (user) => {
    setSelectedUser(user);
    setShowMessageModal(true);
  };

  const handleMessageSent = (userId) => {
    setSentMessages(prev => new Set([...prev, userId]));
    setShowMessageModal(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="people-you-may-know">
        <h3>People You May Know</h3>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="people-you-may-know">
        <h3>People You May Know</h3>
        <p className="no-suggestions">No new people to suggest right now.</p>
      </div>
    );
  }

  return (
    <div className="people-you-may-know">
      <h3>People You May Know</h3>
      <div className="users-grid">
        {users.map(user => (
          <div key={user._id} className="user-card">
            <div className="user-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} />
              ) : (
                <div className="avatar-placeholder">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="user-info">
              <h4>{user.name}</h4>
              {user.username && <p className="username">@{user.username}</p>}
              {user.bio && <p className="bio">{user.bio}</p>}
              <p className="followers-count">{user.followersCount} followers</p>
            </div>
            <div className="user-actions">
              <button
                className={`follow-btn ${followingUsers.has(user._id) ? 'following' : ''}`}
                onClick={() => handleFollow(user._id)}
                disabled={followingUsers.has(user._id)}
              >
                {followingUsers.has(user._id) ? 'Request Sent' : 'Follow'}
              </button>
              <button
                className={`message-btn ${sentMessages.has(user._id) ? 'sent' : ''}`}
                onClick={() => handleSendMessage(user)}
                disabled={sentMessages.has(user._id)}
              >
                {sentMessages.has(user._id) ? 'Message Sent' : 'Send Message'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showMessageModal && (
        <OneTimeMessageModal
          user={selectedUser}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedUser(null);
          }}
          onMessageSent={handleMessageSent}
        />
      )}
    </div>
  );
};

export default PeopleYouMayKnow;
