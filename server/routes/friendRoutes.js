const express = require('express');
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getReceivedRequests,
  getSentRequests,
  getFriends,
  removeFriend,
  getPeopleSuggestions
} = require('../controllers/friendController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Friend request routes
router.post('/request', sendFriendRequest);
router.put('/accept/:requestId', acceptFriendRequest);
router.put('/reject/:requestId', rejectFriendRequest);

// Get friend requests
router.get('/requests/received', getReceivedRequests);
router.get('/requests/sent', getSentRequests);

// Friends management
router.get('/', getFriends);
router.delete('/:friendId', removeFriend);

// People suggestions
router.get('/suggestions', getPeopleSuggestions);

module.exports = router;
