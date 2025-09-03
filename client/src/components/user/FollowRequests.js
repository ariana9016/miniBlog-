import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import './FollowRequests.css';

const FollowRequests = ({ allUsersRef, onUserConnectionChange }) => {
  const { user } = useContext(AuthContext);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    if (user) {
      fetchFollowRequests();
    } else {
      setLoading(false);
      setReceivedRequests([]);
    }
  }, [user]);

  const fetchFollowRequests = async () => {
    try {
      const response = await axios.get('/api/follow/requests/received');
      setReceivedRequests(response.data.data);
    } catch (error) {
      console.error('Error fetching follow requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setProcessing(prev => ({ ...prev, [requestId]: 'accepting' }));
    try {
      await axios.put(`/api/follow/accept/${requestId}`);
      const acceptedRequest = receivedRequests.find(req => req._id === requestId);
      // Normalize to always have { follower: user }
      const followerUser = acceptedRequest?.follower || acceptedRequest || {};
      setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
      setAcceptedRequests(prev => [
        ...prev,
        { _id: requestId, follower: followerUser, justAccepted: true }
      ]);
      // Remove from accepted list after 10 seconds
      setTimeout(() => {
        setAcceptedRequests(prev => prev.filter(req => req._id !== requestId));
      }, 10000);
    } catch (error) {
      console.error('Error accepting follow request:', error);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleRejectRequest = async (requestId) => {
    setProcessing(prev => ({ ...prev, [requestId]: 'rejecting' }));
    try {
      await axios.put(`/api/follow/reject/${requestId}`);
      setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (error) {
      console.error('Error rejecting follow request:', error);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleFollowBack = async (userId) => {
    setProcessing(prev => ({ ...prev, [userId]: 'following' }));
    try {
      await axios.post(`/api/follow/follow-back/${userId}`);
      setAcceptedRequests(prev => prev.filter(req => req.follower._id !== userId));
      
      // Remove user from AllUsers suggestions if ref is available
      if (allUsersRef?.current?.removeUser) {
        allUsersRef.current.removeUser(userId);
      }
      
      // Notify parent about connection change
      if (onUserConnectionChange) {
        onUserConnectionChange();
      }
    } catch (error) {
      console.error('Error following back:', error);
    } finally {
      setProcessing(prev => ({ ...prev, [userId]: false }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="follow-requests">
        <h3>Follow Requests</h3>
        <div className="loading">Loading requests...</div>
      </div>
    );
  }

  if (receivedRequests.length === 0 && acceptedRequests.length === 0) {
    return null; // Don't show the section if no requests
  }

  return (
    <div className="follow-requests">
      <h3>Follow Requests</h3>
      
      {/* Accepted Requests with Follow Back Option */}
      {acceptedRequests.length > 0 && (
        <div className="accepted-requests">
          {acceptedRequests.map(request => {
            const f = request?.follower || {};
            const fid = f?._id;
            const normalizedFollower = f || {};
            return (
              <div key={request._id} className="request-card accepted">
                <div className="request-info">
                  <Avatar 
                    src={normalizedFollower.avatarUrl} 
                    name={normalizedFollower.name} 
                    size={40}
                    className="request-avatar"
                  />
                  <div className="request-details">
                    <h4>{normalizedFollower.name || 'Unknown User'}</h4>
                    <p className="username">@{f?.username || 'unknown'}</p>
                    <span className="accepted-text">Request accepted!</span>
                  </div>
                </div>
                <div className="request-actions">
                  <button
                    onClick={() => fid && handleFollowBack(fid)}
                    disabled={!!processing[fid]}
                    className="follow-back-btn"
                  >
                    {processing[fid] === 'following' ? 'Following...' : 'Follow Back'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Pending Requests */}
      {receivedRequests.length > 0 && (
        <div className="requests-list">
        {receivedRequests.slice(0, 3).map(request => {
          const f = request?.follower || request || {};
          return (
            <div key={request._id} className="request-card">
              <div className="request-info">
                <img
                  src={f?.avatarUrl || '/default-avatar.png'}
                  alt={f?.name || 'User'}
                  className="request-avatar"
                />
                <div className="request-details">
                  <h4>{f?.name || 'Unknown User'}</h4>
                  <p className="username">@{f?.username || 'unknown'}</p>
                  {request?.createdAt && (
                    <span className="date">{formatDate(request.createdAt)}</span>
                  )}
                </div>
              </div>
              <div className="request-actions">
                <button
                  onClick={() => handleAcceptRequest(request._id)}
                  disabled={processing[request._id]}
                  className="accept-btn"
                >
                  {processing[request._id] === 'accepting' ? '✓' : '✓'}
                </button>
                <button
                  onClick={() => handleRejectRequest(request._id)}
                  disabled={processing[request._id]}
                  className="reject-btn"
                >
                  {processing[request._id] === 'rejecting' ? '✗' : '✗'}
                </button>
              </div>
            </div>
          );
        })}
          {receivedRequests.length > 3 && (
            <div className="view-more-requests">
              <p>+{receivedRequests.length - 3} more requests</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FollowRequests;
