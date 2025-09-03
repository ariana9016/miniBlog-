import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FriendRequests.css';

const FriendRequests = () => {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('received');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const [receivedResponse, sentResponse] = await Promise.all([
        axios.get('/api/friends/requests/received'),
        axios.get('/api/friends/requests/sent')
      ]);
      
      setReceivedRequests(receivedResponse.data.data);
      setSentRequests(sentResponse.data.data);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setProcessing(prev => ({ ...prev, [requestId]: 'accepting' }));
    try {
      await axios.put(`/api/friends/accept/${requestId}`);
      setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleRejectRequest = async (requestId) => {
    setProcessing(prev => ({ ...prev, [requestId]: 'rejecting' }));
    try {
      await axios.put(`/api/friends/reject/${requestId}`);
      setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
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
      <div className="friend-requests">
        <h3>Friend Requests</h3>
        <div className="loading">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="friend-requests">
      <h3>Friend Requests</h3>
      
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          Received ({receivedRequests.length})
        </button>
        <button
          className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Sent ({sentRequests.length})
        </button>
      </div>

      <div className="requests-content">
        {activeTab === 'received' && (
          <div className="received-requests">
            {receivedRequests.length === 0 ? (
              <p className="no-requests">No pending friend requests.</p>
            ) : (
              receivedRequests.map(request => (
                <div key={request._id} className="request-card">
                  <div className="request-info">
                    <img
                      src={request.sender.avatarUrl || '/default-avatar.png'}
                      alt={request.sender.name}
                      className="avatar"
                    />
                    <div className="request-details">
                      <h4>{request.sender.name}</h4>
                      <p className="username">@{request.sender.username}</p>
                      {request.message && (
                        <p className="message">"{request.message}"</p>
                      )}
                      <span className="date">{formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button
                      onClick={() => handleAcceptRequest(request._id)}
                      disabled={processing[request._id]}
                      className="accept-btn"
                    >
                      {processing[request._id] === 'accepting' ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request._id)}
                      disabled={processing[request._id]}
                      className="reject-btn"
                    >
                      {processing[request._id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'sent' && (
          <div className="sent-requests">
            {sentRequests.length === 0 ? (
              <p className="no-requests">No pending sent requests.</p>
            ) : (
              sentRequests.map(request => (
                <div key={request._id} className="request-card">
                  <div className="request-info">
                    <img
                      src={request.receiver.avatarUrl || '/default-avatar.png'}
                      alt={request.receiver.name}
                      className="avatar"
                    />
                    <div className="request-details">
                      <h4>{request.receiver.name}</h4>
                      <p className="username">@{request.receiver.username}</p>
                      {request.message && (
                        <p className="message">"{request.message}"</p>
                      )}
                      <span className="date">Sent {formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                  <div className="request-status">
                    <span className="pending-status">Pending</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;
