const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const User = require('../models/User');

// Public routes - get blog posts
router.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;

    let query = { status: 'published' };
    
    if (category) {
      query.categories = { $in: [category] };
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const posts = await BlogPost.find(query)
      .populate('author', 'firstName lastName fullName avatar verified title company')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BlogPost.countDocuments(query);

    res.json({
      success: true,
      data: posts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog posts'
    });
  }
});

// Get single blog post
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id)
      .populate('author', 'firstName lastName fullName avatar verified title company bio socialLinks');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment views
    post.views += 1;
    await post.save();

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog post'
    });
  }
});

// Get comments for a post
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ 
      post: req.params.id,
      parentComment: null 
    })
      .populate('author', 'firstName lastName fullName avatar verified')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'firstName lastName fullName avatar verified'
        }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
});

// Protected routes - require authentication
router.use(protect);

// Like/unlike a post
router.post('/posts/:id/like', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const hasLiked = post.likes.includes(req.user._id);
    
    if (hasLiked) {
      // Unlike
      post.likes = post.likes.filter(like => !like.equals(req.user._id));
    } else {
      // Like
      post.likes.push(req.user._id);
    }

    await post.save();

    res.json({
      success: true,
      data: {
        likes: post.likesCount,
        userLiked: !hasLiked
      }
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating like'
    });
  }
});

// Add comment
router.post('/posts/:id/comments', async (req, res) => {
  try {
    const { content, parentComment } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const commentData = {
      content: content.trim(),
      author: req.user._id,
      post: req.params.id
    };

    if (parentComment) {
      commentData.parentComment = parentComment;
    }

    const comment = await Comment.create(commentData);
    await comment.populate('author', 'firstName lastName fullName avatar verified');

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
});

// Like/unlike a comment
router.post('/comments/:id/like', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const hasLiked = comment.likes.includes(req.user._id);
    
    if (hasLiked) {
      // Unlike
      comment.likes = comment.likes.filter(like => !like.equals(req.user._id));
    } else {
      // Like
      comment.likes.push(req.user._id);
    }

    await comment.save();

    res.json({
      success: true,
      data: {
        likes: comment.likesCount,
        userLiked: !hasLiked
      }
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating comment like'
    });
  }
});

// Share a post
router.post('/posts/:id/share', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    post.shares += 1;
    await post.save();

    res.json({
      success: true,
      data: {
        shares: post.shares
      }
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing post'
    });
  }
});

// Report a post
router.post('/posts/:id/report', async (req, res) => {
  try {
    const { reason, details } = req.body;

    if (!reason || !details) {
      return res.status(400).json({
        success: false,
        message: 'Reason and details are required'
      });
    }

    // Here you would typically save the report to a database
    // For now, we'll just return success
    console.log('Post reported:', {
      postId: req.params.id,
      reason,
      details,
      reportedBy: req.user._id
    });

    res.json({
      success: true,
      message: 'Report submitted successfully'
    });
  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting report'
    });
  }
});

module.exports = router;