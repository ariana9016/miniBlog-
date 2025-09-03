const express = require('express');
const {
  sendFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  getReceivedFollowRequests,
  getSentFollowRequests,
  getAllUsers,
  getPeopleYouMayKnow,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
  getCurrentUserFollowers,
  getConnectedUsers,
  followBack,
  sendOneTimeMessage,
  getOneTimeMessages,
  checkOneTimeMessageStatus
} = require('../controllers/followController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Follow request routes
router.post('/request/:userId', protect, sendFollowRequest);
router.put('/accept/:requestId', protect, acceptFollowRequest);
router.put('/reject/:requestId', protect, rejectFollowRequest);

// Get follow requests
router.get('/requests/received', protect, getReceivedFollowRequests);
router.get('/requests/sent', protect, getSentFollowRequests);

// Get all users for follow suggestions
router.get('/all-users', protect, getAllUsers);
router.get('/people-you-may-know', protect, getPeopleYouMayKnow);

// Get current user's followers and connected users
router.get('/followers', protect, getCurrentUserFollowers);
router.get('/connected-users', protect, getConnectedUsers);

// Follow back route
router.post('/follow-back/:userId', protect, followBack);

// One-time message routes
router.post('/one-time-message/:userId', protect, sendOneTimeMessage);
router.get('/one-time-messages', protect, getOneTimeMessages);
router.get('/one-time-message-status/:userId', protect, checkOneTimeMessageStatus);

// Unfollow route
router.delete('/:userId', protect, unfollowUser);

// Get followers and following
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.get('/:userId/status', protect, getFollowStatus);

module.exports = router;
