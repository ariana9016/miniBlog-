import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Messaging from '../../components/message/Messaging';
import './MessagingPage.css';

const MessagingPage = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="messaging-page">
      <div className="messaging-page-container">
        <div className="messaging-header">
          <h1>Messages</h1>
          <p>Chat with your friends securely with end-to-end encryption</p>
        </div>

        <div className="messaging-wrapper">
          <Messaging currentUser={user} />
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;
