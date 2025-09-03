import React, { useState, useEffect, forwardRef, useImperativeHandle, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import FollowButton from './FollowButton';
import Avatar from '../common/Avatar';
import './AllUsers.css';

const AllUsers = forwardRef(({ onUserFollowed }, ref) => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState({});

  // Expose refresh function to parent components
  useImperativeHandle(ref, () => ({
    refreshUsers: fetchAllUsers,
    removeUser: (userId) => {
      setUsers(prev => prev.filter(user => user._id !== userId));
    }
  }));

  useEffect(() => {
    if (user) {
      fetchAllUsers();
    } else {
      setLoading(false);
      setUsers([]);
    }
  }, [user]);

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('/api/follow/all-users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFollowRequest = async (userId) => {
    setSendingRequest(prev => ({ ...prev, [userId]: true }));
    try {
      await axios.post(`/api/follow/request/${userId}`, {
        message: 'Hi! I would like to follow you.'
      });
      
      // Remove from users list after sending request
      setUsers(prev => prev.filter(user => user._id !== userId));
      
      // Notify parent component if callback provided
      if (onUserFollowed) {
        onUserFollowed(userId);
      }
    } catch (error) {
      console.error('Error sending follow request:', error);
    } finally {
      setSendingRequest(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="all-users">
        <h3>People You May Know</h3>
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="all-users">
        <h3>People You May Know</h3>
        <p className="no-users">No new people to discover at the moment.</p>
      </div>
    );
  }

  return (
    <div className="all-users">
      <h3>People You May Know</h3>
      <div className="users-list">
        {users.slice(0, 8).map(user => (
          <div key={user._id} className="user-card">
            <Avatar 
              src={user.avatarUrl} 
              name={user.name} 
              size={50}
              className="user-avatar"
            />
            <div className="user-details">
              <h4>{user.name}</h4>
              <p className="username">@{user.username}</p>
              {user.bio && <p className="bio">{user.bio}</p>}
              <span className="followers">{user.followersCount} followers</span>
            </div>
            <button
              onClick={() => sendFollowRequest(user._id)}
              disabled={sendingRequest[user._id]}
              className="follow-btn"
            >
              {sendingRequest[user._id] ? 'Sending...' : 'Follow'}
            </button>
          </div>
        ))}
        {users.length > 8 && (
          <div className="view-more">
            <p>+{users.length - 8} more people</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default AllUsers;
