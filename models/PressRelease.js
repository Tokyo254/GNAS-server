const mongoose = require('mongoose');

const pressReleaseSchema = new mongoose.Schema({
  headline: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  summary: {
    type: String,
    required: true,
    maxlength: 500
  },
  fullContent: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  featuredImage: {
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    url: String
  },
  publicationDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Under Review', 'Published', 'Rejected'],
    default: 'Draft'
  },
  views: {
    type: Number,
    default: 0
  },
  mediaPickups: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for author details
pressReleaseSchema.virtual('authorDetails', {
  ref: 'User',
  localField: 'author',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
pressReleaseSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('PressRelease', pressReleaseSchema);