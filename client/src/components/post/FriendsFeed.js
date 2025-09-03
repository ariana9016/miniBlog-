import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PostCard from './PostCard';
import './FriendsFeed.css';

const FriendsFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchFriendsPosts();
  }, []);

  const fetchFriendsPosts = async (pageNum = 1, reset = true) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await axios.get(`/api/posts/friends-feed?page=${pageNum}&limit=10`);
      const newPosts = response.data.data;

      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setHasMore(newPosts.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching friends feed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchFriendsPosts(page + 1, false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  const handlePostDelete = (deletedPostId) => {
    setPosts(prev => prev.filter(post => post._id !== deletedPostId));
  };

  if (loading) {
    return (
      <div className="friends-feed">
        <div className="feed-header">
          <h2>Friends Feed</h2>
          <p>Posts from your friends</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading friends' posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="friends-feed">
      <div className="feed-header">
        <h2>Friends Feed</h2>
        <p>Posts from your friends</p>
      </div>

      {posts.length === 0 ? (
        <div className="empty-feed">
          <div className="empty-icon">👥</div>
          <h3>No posts from friends yet</h3>
          <p>When your friends share posts, they'll appear here.</p>
          <p>Start by adding some friends to see their posts!</p>
        </div>
      ) : (
        <>
          <div className="posts-container">
            {posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                onUpdate={handlePostUpdate}
                onDelete={handlePostDelete}
              />
            ))}
          </div>

          {hasMore && (
            <div className="load-more-container">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="load-more-btn"
              >
                {loadingMore ? (
                  <>
                    <div className="loading-spinner small"></div>
                    Loading more...
                  </>
                ) : (
                  'Load More Posts'
                )}
              </button>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="end-of-feed">
              <p>You've reached the end of your friends' posts!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FriendsFeed;
