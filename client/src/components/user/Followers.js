import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import OneTimeMessageButton from './OneTimeMessageButton';
import ConfirmationModal from '../common/ConfirmationModal';
import Avatar from '../common/Avatar';
import './Followers.css';

const Followers = ({ onUserUnfollowed }) => {
  const { user } = useContext(AuthContext);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);

  useEffect(() => {
    if (user) {
      fetchFollowers();
      
      // Check if welcome message has been dismissed
      const welcomeMessageDismissed = localStorage.getItem('followersWelcomeMessageDismissed');
      if (!welcomeMessageDismissed) {
        setShowWelcomeMessage(true);
      }
    } else {
      setLoading(false);
      setFollowers([]);
    }
  }, [user]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/follow/followers');
      setFollowers(response.data.data);
    } catch (error) {
      console.error('Error fetching followers:', error);
      setError('Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = (userId) => {
    // This will be implemented when we add the messaging interface
    console.log('Message user:', userId);
  };

  const handleRemoveClick = (follower) => {
    setUserToRemove(follower);
    setShowConfirmModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!userToRemove) return;
    
    try {
      await axios.delete(`/api/follow/${userToRemove._id}`);
      setFollowers(prev => prev.filter(follower => follower._id !== userToRemove._id));
      
      // Notify parent component if callback provided
      if (onUserUnfollowed) {
        onUserUnfollowed(userToRemove._id);
      }
      
      setShowConfirmModal(false);
      setUserToRemove(null);
    } catch (error) {
      console.error('Error removing follower:', error);
      setShowConfirmModal(false);
      setUserToRemove(null);
    }
  };

  if (loading) {
    return (
      <div className="followers-section">
        <h4>Followers</h4>
        <div className="loading">Loading followers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="followers-section">
        <h4>Followers</h4>
        <div className="error">{error}</div>
      </div>
    );
  }

  if (followers.length === 0) {
    return (
      <div className="followers-section">
        <h4>Followers</h4>
        <div className="empty-state">No followers yet</div>
      </div>
    );
  }

  return (
    <div className="followers-section">
      <h4>Followers ({followers.length})</h4>
      
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmRemove}
        title="Remove Follower"
        message={`Are you sure you want to remove ${userToRemove?.name} from your followers? This will unfollow them.`}
        confirmText="Remove"
        confirmButtonClass="btn-delete"
      />
      
      {/* One-time welcome message */}
      {showWelcomeMessage && followers.length > 0 && (
        <div className="welcome-message">
          <p>👋 Great! You have followers. You can message them or manage your connections here.</p>
          <button 
            className="dismiss-btn"
            onClick={() => {
              setShowWelcomeMessage(false);
              localStorage.setItem('followersWelcomeMessageDismissed', 'true');
            }}
          >
            Got it!
          </button>
        </div>
      )}
      
      <div className="followers-list">
        {followers.slice(0, 5).map(follower => (
          <div key={follower._id} className="follower-item">
            <div className="follower-info">
              <Avatar 
                src={follower.avatarUrl} 
                name={follower.name} 
                size={50}
                className="user-avatar"
              />
              <div className="follower-details">
                <h5>{follower.name}</h5>
                <p className="username">@{follower.username}</p>
              </div>
            </div>
            <div className="follower-actions">
              <OneTimeMessageButton 
                userId={follower._id}
                userName={follower.name}
              />
              <button
                onClick={() => handleRemoveClick(follower)}
                className="unfollow-btn"
                title="Remove follower"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {followers.length > 5 && (
          <div className="view-more">
            <p>+{followers.length - 5} more followers</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Followers;
