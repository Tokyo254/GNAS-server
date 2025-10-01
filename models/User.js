const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic info
  firstName: { type: String, required: true, trim: true, maxlength: 50 },
  surname: { type: String, required: true, trim: true, maxlength: 50 },
  lastName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  
  // Authentication
  password: { 
    type: String, 
    required: function() { return this.registrationMethod === 'email'; },
    minlength: 6
  },
  
  // Role and registration
  role: { 
    type: String, 
    enum: ['journalist', 'comms', 'admin'], 
    required: true 
  },
  registrationMethod: { 
    type: String, 
    enum: ['email', 'endorsement', 'invite'], 
    default: 'email' 
  },
  
  // Journalist specific fields
  publication: { 
    type: String, 
    required: function() { return this.role === 'journalist'; } 
  },
  licenseFile: {
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    url: String
  },
  
  // Comms professional specific fields
  orgName: { 
    type: String, 
    required: function() { return this.role === 'comms'; } 
  },
  position: { type: String, default: '', maxlength: 100 },
  bio: { type: String, default: '', maxlength: 500 },
  
  // Common fields
  phoneNumber: { 
    type: String, 
    default: '',
    match: [/^\+?[\d\s\-()]{10,}$/, 'Please provide a valid phone number']
  },
  country: { type: String, default: '', maxlength: 50 },
  interests: [{ type: String, maxlength: 50 }],
  
  // Email verification
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Account status
  status: { 
    type: String, 
    enum: ['pending', 'active', 'suspended', 'rejected'], 
    default: 'pending' 
  },
  
  // Timestamps
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0, max: 5 },
  lockUntil: Date
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive fields when converting to JSON
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

// Virtuals
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.surname} ${this.lastName}`.trim();
});

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ 'emailVerificationExpires': 1 }, { expireAfterSeconds: 0 });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

module.exports = mongoose.model('User', userSchema);