const Follow = require('../models/Follow');
const FollowRequest = require('../models/FollowRequest');
const User = require('../models/User');
const Message = require('../models/Message');
const asyncHandler = require('express-async-handler');

// @desc    Send follow request
// @route   POST /api/follow/request/:userId
// @access  Private
const sendFollowRequest = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { message } = req.body;
  const followerId = req.user.id;
  const mongoose = require('mongoose');

  if (userId === followerId) {
    return res.status(400).json({
      success: false,
      message: 'You cannot follow yourself'
    });
  }

  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(followerId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID'
    });
  }

  // Check if user exists
  const userToFollow = await User.findById(userId);
  if (!userToFollow) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if already following
  const existingFollow = await Follow.findOne({
    follower: followerId,
    following: userId
  });

  if (existingFollow) {
    return res.status(400).json({
      success: false,
      message: 'Already following this user'
    });
  }

  // Check if request already sent
  const existingRequest = await FollowRequest.findOne({
    follower: followerId,
    following: userId,
    status: 'pending'
  });

  if (existingRequest) {
    return res.status(400).json({
      success: false,
      message: 'Follow request already sent'
    });
  }

  // Create follow request
  const followRequest = await FollowRequest.create({
    follower: followerId,
    following: userId,
    message: message || 'Hi! I would like to follow you.',
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    message: 'Follow request sent successfully',
    data: followRequest
  });
});

// @desc    Accept follow request
// @route   PUT /api/follow/accept/:requestId
// @access  Private
const acceptFollowRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user.id;
  const mongoose = require('mongoose');

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request ID'
    });
  }

  // Find the follow request
  const followRequest = await FollowRequest.findById(requestId);
  if (!followRequest) {
    return res.status(404).json({
      success: false,
      message: 'Follow request not found'
    });
  }

  // Check if the request is for the current user
  const followingId = followRequest.following._id || followRequest.following;
  if (followingId.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to accept this request'
    });
  }

  // Check if request is still pending
  if (followRequest.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Request has already been processed'
    });
  }

  // Update request status
  followRequest.status = 'accepted';
  await followRequest.save();

  // Get proper IDs
  const followerId = followRequest.follower._id || followRequest.follower;
  const followingUserId = followRequest.following._id || followRequest.following;

  // Create follow relationship
  await Follow.create({
    follower: followerId,
    following: followingUserId
  });

  // Update user following/followers arrays and counts
  await User.findByIdAndUpdate(followerId, { 
    $addToSet: { following: followingUserId },
    $inc: { followingCount: 1 } 
  });
  await User.findByIdAndUpdate(followingUserId, { 
    $addToSet: { followers: followerId },
    $inc: { followersCount: 1 } 
  });

  res.json({
    success: true,
    message: 'Follow request accepted',
    data: {
      follower: followRequest.follower,
      following: followRequest.following
    }
  });
});

// @desc    Reject follow request
// @route   PUT /api/follow/reject/:requestId
// @access  Private
const rejectFollowRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user.id;
  const mongoose = require('mongoose');

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request ID'
    });
  }

  // Find the follow request
  const followRequest = await FollowRequest.findById(requestId);
  if (!followRequest) {
    return res.status(404).json({
      success: false,
      message: 'Follow request not found'
    });
  }

  // Check if the request is for the current user
  if (followRequest.following.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to reject this request'
    });
  }

  // Check if request is still pending
  if (followRequest.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Request has already been processed'
    });
  }

  // Update request status
  followRequest.status = 'rejected';
  await followRequest.save();

  res.json({
    success: true,
    message: 'Follow request rejected'
  });
});

// @desc    Get received follow requests
// @route   GET /api/follow/requests/received
// @access  Private
const getReceivedFollowRequests = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Find follow requests sent to current user
  const followRequests = await FollowRequest.find({
    following: userId,
    status: 'pending'
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: followRequests.length,
    data: followRequests
  });
});

// @desc    Get sent follow requests
// @route   GET /api/follow/requests/sent
// @access  Private
const getSentFollowRequests = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user.id)
    .select('pendingRequests')
    .populate('pendingRequests', 'name username avatarUrl bio followersCount');

  res.json({
    success: true,
    count: currentUser.pendingRequests ? currentUser.pendingRequests.length : 0,
    data: currentUser.pendingRequests || []
  });
});

// @desc    Get people you may know (all users excluding connections)
// @route   GET /api/follow/people-you-may-know
// @access  Private
const getPeopleYouMayKnow = asyncHandler(async (req, res) => {
  const mongoose = require('mongoose');
  const currentUserId = req.user.id;
  
  // Get current user following/followers from User model
  const currentUser = await User.findById(currentUserId).select('following followers');
  if (!currentUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const followingIds = (currentUser.following || [])
    .filter(id => id && mongoose.Types.ObjectId.isValid(id))
    .map(id => id.toString());
  const followerIds = (currentUser.followers || [])
    .filter(id => id && mongoose.Types.ObjectId.isValid(id))
    .map(id => id.toString());
  
  // Get users that current user is following (using Follow model)
  const followRelations = await Follow.find({ follower: currentUserId }).select('following');
  const followRelationIds = followRelations
    .filter(f => f.following && mongoose.Types.ObjectId.isValid(f.following))
    .map(f => f.following.toString());
  
  // Get users that are following current user (using Follow model)
  const followerRelations = await Follow.find({ following: currentUserId }).select('follower');
  const followerRelationIds = followerRelations
    .filter(f => f.follower && mongoose.Types.ObjectId.isValid(f.follower))
    .map(f => f.follower.toString());
  
  // Get pending follow requests (both sent and received)
  const sentRequests = await FollowRequest.find({ 
    follower: currentUserId, 
    status: 'pending' 
  }).select('following');
  const sentRequestIds = sentRequests.map(r => {
    const followingId = r.following._id || r.following;
    return followingId.toString();
  }).filter(id => id && mongoose.Types.ObjectId.isValid(id));
  
  const receivedRequests = await FollowRequest.find({ 
    following: currentUserId, 
    status: 'pending' 
  }).select('follower');
  const receivedRequestIds = receivedRequests.map(r => {
    const followerId = r.follower._id || r.follower;
    return followerId.toString();
  }).filter(id => id && mongoose.Types.ObjectId.isValid(id));
  
  // Get accepted follow requests (both directions)
  const acceptedSentRequests = await FollowRequest.find({ 
    follower: currentUserId, 
    status: 'accepted' 
  }).select('following');
  const acceptedSentIds = acceptedSentRequests.map(r => {
    const followingId = r.following._id || r.following;
    return followingId.toString();
  }).filter(id => id && mongoose.Types.ObjectId.isValid(id));
  
  const acceptedReceivedRequests = await FollowRequest.find({ 
    following: currentUserId, 
    status: 'accepted' 
  }).select('follower');
  const acceptedReceivedIds = acceptedReceivedRequests.map(r => {
    const followerId = r.follower._id || r.follower;
    return followerId.toString();
  }).filter(id => id && mongoose.Types.ObjectId.isValid(id));

  // Combine all IDs to exclude and ensure they are valid ObjectIds
  const excludeIds = [
    ...followingIds,
    ...followerIds,
    ...followRelationIds,
    ...followerRelationIds,
    ...sentRequestIds,
    ...receivedRequestIds,
    ...acceptedSentIds,
    ...acceptedReceivedIds,
    currentUserId
  ]
  .filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicates
  .filter(id => id && mongoose.Types.ObjectId.isValid(id)); // Only valid ObjectIds
  
  const users = await User.find({
    _id: { $nin: excludeIds },
    role: 'user'
  })
  .select('name username avatarUrl bio followersCount')
  .sort({ createdAt: -1 })
  .limit(50);

  res.json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get all users for follow suggestions (legacy endpoint)
// @route   GET /api/follow/all-users
// @access  Private
const getAllUsers = asyncHandler(async (req, res) => {
  // Redirect to new endpoint
  return getPeopleYouMayKnow(req, res);
});

// @desc    Unfollow a user
// @route   DELETE /api/follow/:userId
// @access  Private
const unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    // Admin shouldn't have follow relations, but allow idempotent response
    if (req.user.role === 'admin') {
      return res.status(200).json({ success: true, message: 'Nothing to unfollow' });
    }

    const follow = await Follow.findOneAndDelete({
      follower: followerId,
      following: userId
    });

    if (!follow) {
      return res.status(404).json({
        success: false,
        message: 'Not following this user'
      });
    }

    // Update user following/followers arrays and counts
    await User.findByIdAndUpdate(followerId, { 
      $pull: { following: userId },
      $inc: { followingCount: -1 } 
    });
    await User.findByIdAndUpdate(userId, { 
      $pull: { followers: followerId },
      $inc: { followersCount: -1 } 
    });

    res.status(200).json({
      success: true,
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's followers
// @route   GET /api/follow/:userId/followers
// @access  Public
const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const followers = await Follow.find({ following: userId })
      .populate('follower', 'name username avatarUrl')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Follow.countDocuments({ following: userId });

    res.status(200).json({
      success: true,
      count: followers.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: followers.map(f => f.follower)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's following
// @route   GET /api/follow/:userId/following
// @access  Public
const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const following = await Follow.find({ follower: userId })
      .populate('following', 'name username avatarUrl')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Follow.countDocuments({ follower: userId });

    res.status(200).json({
      success: true,
      count: following.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: following.map(f => f.following)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if user is following another user
// @route   GET /api/follow/:userId/status
// @access  Private
const getFollowStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    const isFollowing = await Follow.exists({
      follower: followerId,
      following: userId
    });

    res.status(200).json({
      success: true,
      data: { isFollowing: !!isFollowing }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's followers
// @route   GET /api/follow/followers
// @access  Private
const getCurrentUserFollowers = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const followers = await Follow.find({ following: userId })
    .populate('follower', 'name username avatarUrl bio')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: followers.length,
    data: followers.map(f => f.follower)
  });
});

// @desc    Get connected users (mutual following for messaging)
// @route   GET /api/follow/connected-users
// @access  Private
const getConnectedUsers = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Get users that current user is following
  const following = await Follow.find({ follower: userId })
    .populate('following', 'name username avatarUrl')
    .select('following');
  
  const followingIds = following.map(f => f.following._id.toString());
  
  // Get users that are also following the current user back (mutual follows)
  const mutualFollows = await Follow.find({ 
    follower: { $in: followingIds },
    following: userId 
  }).populate('follower', 'name username avatarUrl');
  
  const connectedUsers = mutualFollows.map(f => f.follower);
  
  res.json({
    success: true,
    count: connectedUsers.length,
    data: connectedUsers
  });
});

// @desc    Follow back a user (direct follow for followers)
// @route   POST /api/follow/follow-back/:userId
// @access  Private
const followBack = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.id;
  const mongoose = require('mongoose');

  if (userId === followerId) {
    return res.status(400).json({
      success: false,
      message: 'You cannot follow yourself'
    });
  }

  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(followerId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID'
    });
  }

  // Check if user exists
  const userToFollow = await User.findById(userId);
  if (!userToFollow) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user is in current user's followers (they follow us)
  const currentUser = await User.findById(followerId);
  if (!currentUser.followers.includes(userId)) {
    return res.status(400).json({
      success: false,
      message: 'User is not following you'
    });
  }

  // Check if already following back
  if (currentUser.following.includes(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Already following this user'
    });
  }

  // Update user following/followers arrays and counts
  await User.findByIdAndUpdate(followerId, { 
    $addToSet: { following: userId },
    $inc: { followingCount: 1 } 
  });
  await User.findByIdAndUpdate(userId, { 
    $addToSet: { followers: followerId },
    $inc: { followersCount: 1 } 
  });

  res.status(201).json({
    success: true,
    message: 'Successfully followed back'
  });
});

// @desc    Send one-time message
// @route   POST /api/follow/one-time-message/:userId
// @access  Private
const sendOneTimeMessage = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { message } = req.body;
  const senderId = req.user.id;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message content is required'
    });
  }

  if (userId === senderId) {
    return res.status(400).json({
      success: false,
      message: 'Cannot send message to yourself'
    });
  }

  // Check if users are connected (at least one follows the other)
  const isFollowing = await Follow.findOne({
    follower: senderId,
    following: userId
  });

  const isFollowedBy = await Follow.findOne({
    follower: userId,
    following: senderId
  });

  if (!isFollowing && !isFollowedBy) {
    return res.status(403).json({
      success: false,
      message: 'You can only send one-time messages to users you have a connection with'
    });
  }

  // Check if one-time message already exists between these users
  const existingMessage = await Message.findOne({
    $or: [
      { sender: senderId, receiver: userId, isOneTime: true },
      { sender: userId, receiver: senderId, isOneTime: true }
    ]
  });

  if (existingMessage) {
    return res.status(400).json({
      success: false,
      message: 'A one-time message already exists between you and this user'
    });
  }

  try {
    const oneTimeMessage = await Message.create({
      sender: senderId,
      receiver: userId,
      content: message.trim(),
      messageType: 'one-time',
      isOneTime: true
    });

    res.status(201).json({
      success: true,
      message: 'One-time message sent successfully',
      data: oneTimeMessage
    });
  } catch (error) {
    throw error;
  }
});

// @desc    Get one-time messages for current user
// @route   GET /api/follow/one-time-messages
// @access  Private
const getOneTimeMessages = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const oneTimeMessages = await Message.find({
    $or: [
      { sender: userId, isOneTime: true },
      { receiver: userId, isOneTime: true }
    ]
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: oneTimeMessages
  });
});

// @desc    Check one-time message status between users
// @route   GET /api/follow/one-time-message-status/:userId
// @access  Private
const checkOneTimeMessageStatus = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const { userId } = req.params;
  const mongoose = require('mongoose');

  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(currentUserId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID'
    });
  }

  const existingMessage = await Message.findOne({
    $or: [
      { sender: currentUserId, receiver: userId, isOneTime: true },
      { sender: userId, receiver: currentUserId, isOneTime: true }
    ]
  });

  res.status(200).json({
    success: true,
    data: {
      canSend: !existingMessage,
      messageExists: !!existingMessage
    }
  });
});

module.exports = {
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
};
