const mongoose = require('mongoose');

const oneTimeMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure unique message between two users (one message per sender-receiver pair)
oneTimeMessageSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

// Prevent self-messaging
oneTimeMessageSchema.pre('save', function(next) {
  if (this.senderId.equals(this.receiverId)) {
    const error = new Error('Users cannot send messages to themselves');
    return next(error);
  }
  next();
});

// Populate sender and receiver information when querying
oneTimeMessageSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'senderId',
    select: 'name username avatarUrl'
  }).populate({
    path: 'receiverId',
    select: 'name username avatarUrl'
  });
  next();
});

module.exports = mongoose.model('OneTimeMessage', oneTimeMessageSchema);
