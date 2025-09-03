import React, { useState } from 'react';
import api from '../../services/api';
import '../../styles/OneTimeMessageModal.css';

const OneTimeMessageModal = ({ user, onClose, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError('');

    try {
      await api.post('/messages/one-time', {
        receiverId: user._id,
        message: message.trim()
      });
      
      onMessageSent(user._id);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Send Message to {user.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="user-info">
            <div className="user-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} />
              ) : (
                <div className="avatar-placeholder">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h4>{user.name}</h4>
              {user.username && <p>@{user.username}</p>}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="message">One-time message (max 200 characters):</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a short message..."
                maxLength={200}
                rows={4}
                disabled={sending}
              />
              <div className="char-count">
                {message.length}/200
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="send-btn"
                disabled={sending || !message.trim()}
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OneTimeMessageModal;
