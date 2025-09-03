const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    maxlength: 200
  }
}, {
  timestamps: true
});

// Ensure unique friend request between two users
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// Populate sender and receiver information when querying
friendRequestSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'sender',
    select: 'name username avatarUrl'
  }).populate({
    path: 'receiver',
    select: 'name username avatarUrl'
  });
  next();
});

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
