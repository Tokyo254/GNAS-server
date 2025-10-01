const mongoose = require('mongoose');

const inviteCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usedAt: Date,
  expiresAt: {
    type: Date,
    required: true
  },
  maxUses: {
    type: Number,
    default: 1
  },
  currentUses: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['journalist', 'comms'],
    default: 'journalist'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for expiration
inviteCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate a new invite code
inviteCodeSchema.statics.generateCode = function() {
  return Math.random().toString(36).substring(2, 10).toUpperCase() + 
         Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Method to check if code is valid
inviteCodeSchema.methods.isValid = function() {
  return this.isActive && 
         this.currentUses < this.maxUses && 
         this.expiresAt > new Date();
};

module.exports = mongoose.model('InviteCode', inviteCodeSchema);