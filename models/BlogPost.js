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
    maxlength: [20000, 'Content cannot exceed 20000 characters']
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
  // Enhanced featured image structure
  featuredImage: {
    url: {
      type: String,
      default: ''
    },
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    altText: {
      type: String,
      default: ''
    },
    caption: {
      type: String,
      default: ''
    },
    dimensions: {
      width: Number,
      height: Number
    }
  },
  // Additional images for the blog post
  galleryImages: [{
    url: String,
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    altText: String,
    caption: String,
    dimensions: {
      width: Number,
      height: Number
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    mimetype: String,
    size: Number,
    type: {
      type: String,
      enum: ['document', 'image', 'video', 'audio', 'other'],
      default: 'document'
    }
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
  },
  // SEO fields
  metaTitle: {
    type: String,
    maxlength: 200
  },
  metaDescription: {
    type: String,
    maxlength: 500
  },
  keywords: [String],
  // Social media fields
  socialMediaImage: {
    url: String,
    altText: String
  },
  // Analytics
  lastViewed: Date,
  popularScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for likes count
blogPostSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for comments count
blogPostSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  count: true
});

// Indexes for better performance
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ status: 1, createdAt: -1 });
blogPostSchema.index({ author: 1, createdAt: -1 });
blogPostSchema.index({ 'likes': 1 });
blogPostSchema.index({ categories: 1 });
blogPostSchema.index({ popularScore: -1, createdAt: -1 });

// Pre-save middleware to generate slug and calculate read time
blogPostSchema.pre('save', function(next) {
  // Generate slug from headline
  if (this.headline && (this.isModified('headline') || this.isNew)) {
    this.slug = this.headline
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }

  // Calculate read time
  if (this.fullContent && this.isModified('fullContent')) {
    const wordsPerMinute = 200;
    const wordCount = this.fullContent.trim().split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    this.readTime = `${minutes} min read`;
  }

  // Generate meta description if not provided
  if (!this.metaDescription && this.summary) {
    this.metaDescription = this.summary.substring(0, 160);
  }

  // Generate meta title if not provided
  if (!this.metaTitle && this.headline) {
    this.metaTitle = this.headline.substring(0, 60);
  }

  next();
});

// Update popular score based on engagement
blogPostSchema.methods.updatePopularScore = function() {
  const likesWeight = 2;
  const sharesWeight = 3;
  const viewsWeight = 0.1;
  
  this.popularScore = 
    (this.likesCount * likesWeight) + 
    (this.shares * sharesWeight) + 
    (this.views * viewsWeight);
  
  return this.save();
};

module.exports = mongoose.model('BlogPost', blogPostSchema);