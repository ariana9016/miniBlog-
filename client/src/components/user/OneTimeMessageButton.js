import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OneTimeMessageButton.css';

const OneTimeMessageButton = ({ userId, userName }) => {
  const [messageSent, setMessageSent] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkMessageStatus();
  }, [userId]);

  const checkMessageStatus = async () => {
    try {
      const response = await axios.get(`/api/follow/one-time-message-status/${userId}`);
      setMessageSent(response.data.data.messageSent);
    } catch (error) {
      console.error('Error checking message status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      await axios.post(`/api/follow/one-time-message/${userId}`, {
        message: message.trim()
      });
      
      setMessageSent(true);
      setShowModal(false);
      setMessage('');
    } catch (error) {
      console.error('Error sending one-time message:', error);
      alert(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="message-btn loading">...</div>;
  }

  if (messageSent) {
    return (
      <button className="message-btn sent" disabled title="Message already sent">
        ✓ Sent
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="message-btn"
        title="Send one-time message"
      >
        💬
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="one-time-message-modal" onClick={e => e.stopPropagation()}>
            <h3>Send Message to {userName}</h3>
            <p className="modal-description">
              You can send one short message to {userName}. This is a one-time opportunity.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              maxLength={200}
              className="message-textarea"
              rows={4}
            />
            <div className="character-count">
              {message.length}/200
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowModal(false)}
                className="btn-cancel"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                className="btn-send"
                disabled={sending || !message.trim()}
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OneTimeMessageButton;
