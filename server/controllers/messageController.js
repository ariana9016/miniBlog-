const Message = require('../models/Message');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');

// Encryption configuration
const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY || crypto.randomBytes(32);
const ALGORITHM = 'aes-256-cbc';

// Helper function to encrypt message
const encryptMessage = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encryptedText: encrypted,
    iv: iv.toString('hex')
  };
};

// Helper function to decrypt message
const decryptMessage = (encryptedText, iv) => {
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// @desc    Send message
// @route   POST /api/messages/send
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user.id;

  // Check if receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return res.status(404).json({ 
      success: false,
      message: 'User not found' 
    });
  }

  // For now, allow messaging between any users (can be restricted later)
  // TODO: Add friend check if needed
  // if (!sender.friends.includes(receiverId)) {
  //   return res.status(403).json({ message: 'You can only message friends' });
  // }

  // Create message (without encryption for now to simplify)
  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content: content,
    createdAt: new Date()
  });

  // Populate sender info
  await message.populate('sender', 'name username avatarUrl');

  res.status(201).json({
    success: true,
    data: message
  });
});

// @desc    Get conversation between two users
// @route   GET /api/messages/:userId
// @access  Private
const getConversation = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, receiver: userId },
      { sender: userId, receiver: currentUserId }
    ]
  })
  .populate('sender', 'name username avatarUrl')
  .sort({ createdAt: 1 })
  .skip(skip)
  .limit(limit);

  res.json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Get all conversations for user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get latest message for each conversation
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', userId] },
            '$receiver',
            '$sender'
          ]
        },
        lastMessage: { $first: '$$ROOT' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'otherUser'
      }
    },
    {
      $unwind: '$otherUser'
    },
    {
      $project: {
        otherUser: {
          _id: 1,
          name: 1,
          username: 1,
          avatarUrl: 1
        },
        lastMessage: {
          _id: 1,
          sender: 1,
          receiver: 1,
          createdAt: 1,
          isRead: 1
        }
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);

  res.json({
    success: true,
    count: conversations.length,
    data: conversations
  });
});

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:conversationUserId
// @access  Private
const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { conversationUserId } = req.params;
  const userId = req.user.id;

  await Message.updateMany(
    {
      sender: conversationUserId,
      receiver: userId,
      isRead: false
    },
    {
      isRead: true,
      readAt: new Date()
    }
  );

  res.json({
    success: true,
    message: 'Messages marked as read'
  });
});

// @desc    Get unread messages count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const unreadCount = await Message.countDocuments({
    receiver: userId,
    isRead: false
  });

  res.json({
    success: true,
    data: { unreadCount }
  });
});

// @desc    Send one-time message
// @route   POST /api/messages/one-time
// @access  Private
const sendOneTimeMessage = asyncHandler(async (req, res) => {
  const OneTimeMessage = require('../models/OneTimeMessage');
  const { receiverId, message } = req.body;
  const senderId = req.user.id;
  const mongoose = require('mongoose');

  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(receiverId) || !mongoose.Types.ObjectId.isValid(senderId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID'
    });
  }

  if (receiverId === senderId) {
    return res.status(400).json({
      success: false,
      message: 'You cannot send a message to yourself'
    });
  }

  // Check if receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return res.status(404).json({ 
      success: false,
      message: 'User not found' 
    });
  }

  // Check if message already sent between these users
  const existingMessage = await OneTimeMessage.findOne({
    senderId,
    receiverId
  });

  if (existingMessage) {
    return res.status(400).json({
      success: false,
      message: 'You have already sent a one-time message to this user'
    });
  }

  // Create one-time message
  const oneTimeMessage = await OneTimeMessage.create({
    senderId,
    receiverId,
    message: message.trim()
  });

  await oneTimeMessage.populate('senderId', 'name username avatarUrl');
  await oneTimeMessage.populate('receiverId', 'name username avatarUrl');

  res.status(201).json({
    success: true,
    message: 'One-time message sent successfully',
    data: oneTimeMessage
  });
});

// @desc    Get received one-time messages
// @route   GET /api/messages/one-time/received
// @access  Private
const getReceivedOneTimeMessages = asyncHandler(async (req, res) => {
  const OneTimeMessage = require('../models/OneTimeMessage');
  const receiverId = req.user.id;

  const messages = await OneTimeMessage.find({ receiverId })
    .populate('senderId', 'name username avatarUrl')
    .sort({ sentAt: -1 });

  res.json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Get sent one-time messages
// @route   GET /api/messages/one-time/sent
// @access  Private
const getSentOneTimeMessages = asyncHandler(async (req, res) => {
  const OneTimeMessage = require('../models/OneTimeMessage');
  const senderId = req.user.id;

  const messages = await OneTimeMessage.find({ senderId })
    .populate('receiverId', 'name username avatarUrl')
    .sort({ sentAt: -1 });

  res.json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Mark one-time message as read
// @route   PUT /api/messages/one-time/:messageId/read
// @access  Private
const markOneTimeMessageAsRead = asyncHandler(async (req, res) => {
  const OneTimeMessage = require('../models/OneTimeMessage');
  const { messageId } = req.params;
  const userId = req.user.id;

  const message = await OneTimeMessage.findById(messageId);
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found'
    });
  }

  // Check if user is the receiver
  if (message.receiverId.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to mark this message as read'
    });
  }

  message.isRead = true;
  await message.save();

  res.json({
    success: true,
    message: 'Message marked as read'
  });
});

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  markMessagesAsRead,
  getUnreadCount,
  sendOneTimeMessage,
  getReceivedOneTimeMessages,
  getSentOneTimeMessages,
  markOneTimeMessageAsRead
};
