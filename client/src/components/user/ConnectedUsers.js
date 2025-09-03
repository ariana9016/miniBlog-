import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import OneTimeMessageButton from './OneTimeMessageButton';
import ConfirmationModal from '../common/ConfirmationModal';
import Avatar from '../common/Avatar';
import './ConnectedUsers.css';

const ConnectedUsers = ({ currentUserId, onUserUnfollowed }) => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToUnfollow, setUserToUnfollow] = useState(null);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      fetchFollowing();
    } else {
      setLoading(false);
      setFollowing([]);
    }
  }, [user]);

  const fetchFollowing = async () => {
    try {
      const response = await axios.get('/api/follow/connected-users');
      setFollowing(response.data.data || []);
    } catch (error) {
      console.error('Error fetching following:', error);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageUser = (userId) => {
    // navigate('/messages', { state: { selectedUserId: userId } });
  };

  const handleUnfollowClick = (user) => {
    setUserToUnfollow(user);
    setShowConfirmModal(true);
  };

  const handleConfirmUnfollow = async () => {
    if (!userToUnfollow) return;
    
    try {
      await axios.delete(`/api/follow/${userToUnfollow._id}`);
      setFollowing(prev => prev.filter(user => user._id !== userToUnfollow._id));
      
      // Notify parent component if callback provided
      if (onUserUnfollowed) {
        onUserUnfollowed(userToUnfollow._id);
      }
      
      setShowConfirmModal(false);
      setUserToUnfollow(null);
    } catch (error) {
      console.error('Error unfollowing user:', error);
      setShowConfirmModal(false);
      setUserToUnfollow(null);
    }
  };

  if (loading) {
    return (
      <div className="connected-users">
        <h3>Following</h3>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <div className="connected-users">
        <h3>Following</h3>
        <p className="no-following">You're not following anyone yet.</p>
      </div>
    );
  }

  return (
    <div className="connected-users">
      <h3>Following</h3>
      
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmUnfollow}
        title="Unfollow User"
        message={`Are you sure you want to unfollow ${userToUnfollow?.name}? You will no longer see their posts in your feed.`}
        confirmText="Unfollow"
        confirmButtonClass="btn-delete"
      />
      
      <div className="users-grid">
        {following.slice(0, 6).map(user => (
          <div key={user._id} className="following-card">
            <div className="user-info">
              <Avatar 
                src={user.avatarUrl} 
                name={user.name} 
                size={50}
                className="user-avatar"
              />
              <div className="user-details">
                <h4>{user.name}</h4>
                <p className="username">@{user.username}</p>
              </div>
            </div>
            <div className="user-actions">
              <OneTimeMessageButton 
                userId={user._id}
                userName={user.name}
              />
              <button
                onClick={() => handleUnfollowClick(user)}
                className="unfollow-btn"
                title="Unfollow"
              >
                ✗
              </button>
            </div>
          </div>
        ))}
        {following.length > 6 && (
          <div className="view-more-following">
            <p>+{following.length - 6} more</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectedUsers;
