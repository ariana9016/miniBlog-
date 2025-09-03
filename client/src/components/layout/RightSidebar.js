import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ConnectedUsers from '../user/ConnectedUsers';
import Followers from '../user/Followers';
import './RightSidebar.css';

// Function to trigger refresh of AllUsers suggestions
const triggerAllUsersRefresh = () => {
  // This will be called when unfollow actions occur
  // We can dispatch a custom event that LeftSidebar can listen to
  window.dispatchEvent(new CustomEvent('refreshAllUsers'));
};

const RightSidebar = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsError(null);
        setEventsLoading(true);
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        if (data.success) {
          setEvents(data.data);
        } else {
          throw new Error(data.message || 'Failed to fetch events');
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEventsError(error.message);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="right-sidebar">
      <div className="sidebar-section">
        <h4>Events</h4>
        {eventsLoading ? (
          <p>Loading events...</p>
        ) : eventsError ? (
          <p className="error-message">{eventsError}</p>
        ) : events.length > 0 ? (
          <ul className="event-list">
            {events.map((event) => (
              <li key={event._id} className="event-item">
                <div className="event-row">
                  <div>
                    <strong>{event.title}</strong>
                    <p>{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                  <Link className="btn btn--sm" to={`/events/${event._id}`}>View details</Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No events scheduled.</p>
        )}
      </div>
      {/* Connected Users Component */}
      <ConnectedUsers onUserUnfollowed={triggerAllUsersRefresh} />
      
      {/* Followers Component */}
      <Followers onUserUnfollowed={triggerAllUsersRefresh} />
    </div>
  );
};

export default RightSidebar;
