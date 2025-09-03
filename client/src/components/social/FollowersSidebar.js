import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/FollowersSidebar.css';

const FollowersSidebar = () => {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followRequests, setFollowRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('followers');

  useEffect(() => {
    fetchFollowData();
  }, []);

  const fetchFollowData = async () => {
    try {
      const [followersRes, followingRes, requestsRes] = await Promise.all([
        api.get('/follow/followers'),
        api.get('/follow/connected-users'),
        api.get('/follow/requests/received')
      ]);

      setFollowers(followersRes.data.data);
      setFollowing(followingRes.data.data);
      setFollowRequests(requestsRes.data.data);
    } catch (error) {
      console.error('Error fetching follow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (followerId) => {
    try {
      await api.put(`/follow/accept/${followerId}`);
      
      // Move user from requests to followers
      const acceptedUser = followRequests.find(user => user._id === followerId);
      if (acceptedUser) {
        setFollowRequests(prev => prev.filter(user => user._id !== followerId));
        setFollowers(prev => [...prev, acceptedUser]);
      }
    } catch (error) {
      console.error('Error accepting follow request:', error);
    }
  };

  const handleRejectRequest = async (followerId) => {
    try {
      await api.put(`/follow/reject/${followerId}`);
      setFollowRequests(prev => prev.filter(user => user._id !== followerId));
    } catch (error) {
      console.error('Error rejecting follow request:', error);
    }
  };

  const handleFollowBack = async (userId) => {
    try {
      await api.post(`/follow/follow-back/${userId}`);
      
      // Move user from followers to following (mutual follow)
      const userToFollow = followers.find(user => user._id === userId);
      if (userToFollow) {
        setFollowing(prev => [...prev, userToFollow]);
      }
    } catch (error) {
      console.error('Error following back:', error);
    }
  };

  const isFollowingBack = (userId) => {
    return following.some(user => user._id === userId);
  };

  const renderUserCard = (user, showActions = false, actionType = '') => (
    <div key={user._id} className="follower-card">
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
        {user.followersCount !== undefined && (
          <p className="followers-count">{user.followersCount} followers</p>
        )}
      </div>
      {showActions && (
        <div className="user-actions">
          {actionType === 'request' && (
            <>
              <button
                className="accept-btn"
                onClick={() => handleAcceptRequest(user._id)}
              >
                Accept
              </button>
              <button
                className="reject-btn"
                onClick={() => handleRejectRequest(user._id)}
              >
                Reject
              </button>
            </>
          )}
          {actionType === 'followBack' && !isFollowingBack(user._id) && (
            <button
              className="follow-back-btn"
              onClick={() => handleFollowBack(user._id)}
            >
              Follow Back
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="followers-sidebar">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="followers-sidebar">
      <div className="sidebar-tabs">
        <button
          className={`tab ${activeTab === 'followers' ? 'active' : ''}`}
          onClick={() => setActiveTab('followers')}
        >
          Followers ({followers.length})
        </button>
        <button
          className={`tab ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => setActiveTab('following')}
        >
          Following ({following.length})
        </button>
        {followRequests.length > 0 && (
          <button
            className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Requests ({followRequests.length})
          </button>
        )}
      </div>

      <div className="sidebar-content">
        {activeTab === 'followers' && (
          <div className="followers-section">
            <h3>Your Followers</h3>
            {followers.length === 0 ? (
              <p className="no-data">No followers yet.</p>
            ) : (
              <div className="users-list">
                {followers.map(user => renderUserCard(user, true, 'followBack'))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div className="following-section">
            <h3>Following</h3>
            {following.length === 0 ? (
              <p className="no-data">Not following anyone yet.</p>
            ) : (
              <div className="users-list">
                {following.map(user => renderUserCard(user))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="requests-section">
            <h3>Follow Requests</h3>
            {followRequests.length === 0 ? (
              <p className="no-data">No pending requests.</p>
            ) : (
              <div className="users-list">
                {followRequests.map(user => renderUserCard(user, true, 'request'))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowersSidebar;
