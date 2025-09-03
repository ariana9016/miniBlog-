const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
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
  // Plain text content (for simplified messaging)
  content: {
    type: String,
    required: function() {
      return !this.messageTextEncrypted;
    }
  },
  // Encrypted content (optional)
  messageTextEncrypted: {
    type: String,
    required: function() {
      return !this.content;
    }
  },
  // Store encryption metadata (IV for AES)
  encryptionIV: {
    type: String,
    required: function() {
      return !!this.messageTextEncrypted;
    }
  },
  // Message status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  // Message type for future extensions
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'one-time'],
    default: 'text'
  },
  // Flag for one-time messages
  isOneTime: {
    type: Boolean,
    default: false
  },
  // For file/image messages
  attachmentUrl: {
    type: String
  },
  attachmentName: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying of conversations
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });

// Populate sender and receiver information when querying
messageSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'sender',
    select: 'name username avatarUrl'
  }).populate({
    path: 'receiver',
    select: 'name username avatarUrl'
  });
  next();
});

module.exports = mongoose.model('Message', messageSchema);
