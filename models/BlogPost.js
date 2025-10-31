const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  headline: {
    type: String,
    required: [true, 'Headline is required'],
    maxlength: [200, 'Headline cannot exceed 200 characters']
  },
  summary: {
    type: String,
    required: [true, 'Summary is required'],
    maxlength: [500, 'Summary cannot exceed 500 characters']
  },
  fullContent: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [10000, 'Content cannot exceed 10000 characters']
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  categories: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  featuredImage: {
    url: String,
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number
  },
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    mimetype: String,
    size: Number
  }],
  readTime: {
    type: String,
    default: '5 min read'
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  shares: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Virtual for likes count
blogPostSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for author details
blogPostSchema.virtual('authorDetails', {
  ref: 'User',
  localField: 'author',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
blogPostSchema.set('toJSON', { virtuals: true });
blogPostSchema.set('toObject', { virtuals: true });

// Pre-save middleware to generate slug
blogPostSchema.pre('save', function(next) {
  if (this.headline && this.isModified('headline')) {
    this.slug = this.headline
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }
  next();
});

// Calculate read time
blogPostSchema.methods.calculateReadTime = function() {
  const wordsPerMinute = 200;
  const wordCount = this.fullContent.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  this.readTime = `${minutes} min read`;
};

module.exports = mongoose.model('BlogPost', blogPostSchema);