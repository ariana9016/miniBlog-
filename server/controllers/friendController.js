const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Send friend request
// @route   POST /api/friends/request
// @access  Private
const sendFriendRequest = asyncHandler(async (req, res) => {
  const { receiverId, message } = req.body;
  const senderId = req.user.id;

  // Check if receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Check if users are already friends
  const sender = await User.findById(senderId);
  if (sender.friends.includes(receiverId)) {
    return res.status(400).json({ message: 'You are already friends with this user' });
  }

  // Check if friend request already exists
  const existingRequest = await FriendRequest.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId }
    ]
  });

  if (existingRequest) {
    return res.status(400).json({ message: 'Friend request already exists' });
  }

  // Create friend request
  const friendRequest = await FriendRequest.create({
    sender: senderId,
    receiver: receiverId,
    message
  });

  res.status(201).json({
    success: true,
    data: friendRequest
  });
});

// @desc    Accept friend request
// @route   PUT /api/friends/accept/:requestId
// @access  Private
const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user.id;

  const friendRequest = await FriendRequest.findById(requestId);
  if (!friendRequest) {
    return res.status(404).json({ message: 'Friend request not found' });
  }

  // Check if user is the receiver
  if (friendRequest.receiver._id.toString() !== userId) {
    return res.status(403).json({ message: 'Not authorized to accept this request' });
  }

  // Update friend request status
  friendRequest.status = 'accepted';
  await friendRequest.save();

  // Add each user to the other's friends list
  await User.findByIdAndUpdate(friendRequest.sender._id, {
    $addToSet: { friends: friendRequest.receiver._id },
    $inc: { friendsCount: 1 }
  });

  await User.findByIdAndUpdate(friendRequest.receiver._id, {
    $addToSet: { friends: friendRequest.sender._id },
    $inc: { friendsCount: 1 }
  });

  res.json({
    success: true,
    message: 'Friend request accepted',
    data: friendRequest
  });
});

// @desc    Reject friend request
// @route   PUT /api/friends/reject/:requestId
// @access  Private
const rejectFriendRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user.id;

  const friendRequest = await FriendRequest.findById(requestId);
  if (!friendRequest) {
    return res.status(404).json({ message: 'Friend request not found' });
  }

  // Check if user is the receiver
  if (friendRequest.receiver._id.toString() !== userId) {
    return res.status(403).json({ message: 'Not authorized to reject this request' });
  }

  // Update friend request status
  friendRequest.status = 'rejected';
  await friendRequest.save();

  res.json({
    success: true,
    message: 'Friend request rejected',
    data: friendRequest
  });
});

// @desc    Get pending friend requests (received)
// @route   GET /api/friends/requests/received
// @access  Private
const getReceivedRequests = asyncHandler(async (req, res) => {
  const requests = await FriendRequest.find({
    receiver: req.user.id,
    status: 'pending'
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: requests.length,
    data: requests
  });
});

// @desc    Get sent friend requests
// @route   GET /api/friends/requests/sent
// @access  Private
const getSentRequests = asyncHandler(async (req, res) => {
  const requests = await FriendRequest.find({
    sender: req.user.id,
    status: 'pending'
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: requests.length,
    data: requests
  });
});

// @desc    Get user's friends list
// @route   GET /api/friends
// @access  Private
const getFriends = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: 'friends',
    select: 'name username avatarUrl bio location'
  });

  res.json({
    success: true,
    count: user.friends.length,
    data: user.friends
  });
});

// @desc    Remove friend
// @route   DELETE /api/friends/:friendId
// @access  Private
const removeFriend = asyncHandler(async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user.id;

  // Remove friend from both users' friends lists
  await User.findByIdAndUpdate(userId, {
    $pull: { friends: friendId },
    $inc: { friendsCount: -1 }
  });

  await User.findByIdAndUpdate(friendId, {
    $pull: { friends: userId },
    $inc: { friendsCount: -1 }
  });

  res.json({
    success: true,
    message: 'Friend removed successfully'
  });
});

// @desc    Get people suggestions
// @route   GET /api/friends/suggestions
// @access  Private
const getPeopleSuggestions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId);

  // Get users who are not friends and not the current user
  const suggestions = await User.find({
    _id: { 
      $nin: [...user.friends, userId] 
    },
    isActive: true,
    isBanned: false
  })
  .select('name username avatarUrl bio location followersCount')
  .limit(10)
  .sort({ followersCount: -1, createdAt: -1 });

  res.json({
    success: true,
    count: suggestions.length,
    data: suggestions
  });
});

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getReceivedRequests,
  getSentRequests,
  getFriends,
  removeFriend,
  getPeopleSuggestions
};
