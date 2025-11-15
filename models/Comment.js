const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  // Make author optional for anonymous comments
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Changed to false
  },
  // Add fields for guest/anonymous comments
  guestAuthor: {
    name: {
      type: String,
      required: function() {
        return !this.author; // Required if no author (guest comment)
      },
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: false,
      match: [/.+\@.+\..+/, 'Please enter a valid email'],
      maxlength: [100, 'Email cannot exceed 100 characters']
    }
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogPost',
    required: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  edited: {
    type: Boolean,
    default: false
  },
  // Add field to track comment type
  isGuestComment: {
    type: Boolean,
    default: false
  },
  // Add moderation fields
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // or 'pending' if you want moderation
  }
}, {
  timestamps: true
});

// Virtual for likes count
commentSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment'
});

// Virtual to get author name (works for both user and guest)
commentSchema.virtual('authorName').get(function() {
  if (this.author && this.author.name) {
    return this.author.name;
  }
  return this.guestAuthor?.name || 'Anonymous';
});

// Virtual to check if comment is from verified user
commentSchema.virtual('isVerifiedAuthor').get(function() {
  return !!this.author; // True if comment is from registered user
});

// Ensure virtual fields are serialized
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

// Pre-save middleware to set isGuestComment
commentSchema.pre('save', function(next) {
  this.isGuestComment = !this.author;
  next();
});

module.exports = mongoose.model('Comment', commentSchema);