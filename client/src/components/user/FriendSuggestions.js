import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FriendSuggestions.css';

const FriendSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState({});

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get('/api/friends/suggestions');
      setSuggestions(response.data.data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    setSendingRequest(prev => ({ ...prev, [userId]: true }));
    try {
      await axios.post('/api/friends/request', {
        receiverId: userId,
        message: 'Hi! I would like to connect with you.'
      });
      
      // Remove from suggestions after sending request
      setSuggestions(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setSendingRequest(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="friend-suggestions">
        <h3>People You May Know</h3>
        <div className="loading">Loading suggestions...</div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="friend-suggestions">
        <h3>People You May Know</h3>
        <p className="no-suggestions">No suggestions available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="friend-suggestions">
      <h3>People You May Know</h3>
      <div className="suggestions-list">
        {suggestions.map(user => (
          <div key={user._id} className="suggestion-card">
            <div className="user-info">
              <img 
                src={user.avatarUrl || '/default-avatar.png'} 
                alt={user.name}
                className="avatar"
              />
              <div className="user-details">
                <h4>{user.name}</h4>
                <p className="username">@{user.username}</p>
                {user.bio && <p className="bio">{user.bio}</p>}
                <span className="followers">{user.followersCount} followers</span>
              </div>
            </div>
            <button
              onClick={() => sendFriendRequest(user._id)}
              disabled={sendingRequest[user._id]}
              className="add-friend-btn"
            >
              {sendingRequest[user._id] ? 'Sending...' : 'Add Friend'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendSuggestions;
