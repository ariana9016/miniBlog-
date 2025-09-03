import React, { useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import AllUsers from '../user/AllUsers';
import FollowRequests from '../user/FollowRequests';
import Avatar from '../common/Avatar';
import './LeftSidebar.css';

const LeftSidebar = () => {
  const { user } = useContext(AuthContext);
  const allUsersRef = useRef();

  const handleUserConnectionChange = () => {
    // Refresh AllUsers suggestions when follow/unfollow actions occur
    if (allUsersRef.current?.refreshUsers) {
      setTimeout(() => {
        allUsersRef.current.refreshUsers();
      }, 500);
    }
  };

  // Listen for refresh events from RightSidebar components
  useEffect(() => {
    const handleRefreshEvent = () => {
      handleUserConnectionChange();
    };

    window.addEventListener('refreshAllUsers', handleRefreshEvent);
    return () => {
      window.removeEventListener('refreshAllUsers', handleRefreshEvent);
    };
  }, []);

  return (
    <div className="left-sidebar">
      {user && (
        <div className="sidebar-profile">
          <Avatar 
            src={user.avatarUrl} 
            name={user.name} 
            size={40}
            className="small"
          />
          <span>{user.name}</span>
        </div>
      )}

      {/* Show follow system components for regular users */}
      {user?.role !== 'admin' && (
        <>
          {/* All Users */}
          <AllUsers ref={allUsersRef} onUserFollowed={handleUserConnectionChange} />
          
          {/* Follow Requests */}
          <FollowRequests allUsersRef={allUsersRef} onUserConnectionChange={handleUserConnectionChange} />
        </>
      )}
    </div>
  );
};

export default LeftSidebar;
