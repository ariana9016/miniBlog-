import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import FriendSuggestions from '../../components/user/FriendSuggestions';
import FriendRequests from '../../components/user/FriendRequests';
import FriendsFeed from '../../components/post/FriendsFeed';
import './FriendsPage.css';

const FriendsPage = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('feed');

  const tabs = [
    { id: 'feed', label: 'Friends Feed', icon: '📰' },
    { id: 'suggestions', label: 'Suggestions', icon: '👥' },
    { id: 'requests', label: 'Requests', icon: '📨' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <FriendsFeed />;
      case 'suggestions':
        return <FriendSuggestions />;
      case 'requests':
        return <FriendRequests />;
      default:
        return <FriendsFeed />;
    }
  };

  return (
    <div className="friends-page">
      <div className="friends-page-container">
        <div className="friends-header">
          <h1>Friends & Social</h1>
          <p>Connect with friends and discover new people</p>
        </div>

        <div className="friends-navigation">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="friends-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
