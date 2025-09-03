const mongoose = require('mongoose');

const followRequestSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
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

// Ensure unique follow request between two users
followRequestSchema.index({ follower: 1, following: 1 }, { unique: true });

// Prevent self-following requests
followRequestSchema.pre('save', function(next) {
  if (this.follower.equals(this.following)) {
    const error = new Error('Users cannot follow themselves');
    return next(error);
  }
  next();
});

// Populate follower and following information when querying
followRequestSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'follower',
    select: 'name username avatarUrl'
  }).populate({
    path: 'following',
    select: 'name username avatarUrl'
  });
  next();
});

module.exports = mongoose.model('FollowRequest', followRequestSchema);
