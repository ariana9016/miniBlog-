const express = require('express');
const {
  sendMessage,
  getConversation,
  getConversations,
  markMessagesAsRead,
  getUnreadCount,
  sendOneTimeMessage,
  getReceivedOneTimeMessages,
  getSentOneTimeMessages,
  markOneTimeMessageAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Message routes
router.post('/send', sendMessage);
router.get('/conversations', getConversations);
router.get('/unread-count', getUnreadCount);
router.get('/:userId', getConversation);
router.put('/read/:conversationUserId', markMessagesAsRead);

// One-time message routes
router.post('/one-time', sendOneTimeMessage);
router.get('/one-time/received', getReceivedOneTimeMessages);
router.get('/one-time/sent', getSentOneTimeMessages);
router.put('/one-time/:messageId/read', markOneTimeMessageAsRead);

module.exports = router;
