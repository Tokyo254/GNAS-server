const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const blogController = require('../controllers/blogController');
const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');

// Public routes - get blog posts
router.get('/posts', blogController.getPublishedPosts);
router.get('/posts/:id', blogController.getPostById);

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

// Get posts by slug
router.get('/posts/slug/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug })
      .populate('author', 'firstName lastName name title company avatar verified bio socialLinks')
      .populate('likes', 'firstName lastName avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Increment views
    post.views += 1;
    await post.save();

    // Transform post with like status
    const postObj = post.toObject();
    const userId = req.user?._id?.toString();
    
    let userLiked = false;
    let likesCount = 0;
    
    if (postObj.likes && Array.isArray(postObj.likes)) {
      likesCount = postObj.likes.length;
      if (userId) {
        userLiked = postObj.likes.some(like => 
          like && like._id && like._id.toString() === userId
        );
      }
    }

    const transformedPost = {
      _id: postObj._id,
      headline: postObj.headline,
      summary: postObj.summary,
      fullContent: postObj.fullContent,
      authorDetails: {
        _id: postObj.author?._id,
        name: postObj.author?.name || `${postObj.author?.firstName} ${postObj.author?.lastName}`,
        title: postObj.author?.title || '',
        company: postObj.author?.company || postObj.author?.orgName || '',
        avatar: postObj.author?.avatar || '',
        verified: postObj.author?.verified || false,
        bio: postObj.author?.bio || ''
      },
      publicationDate: postObj.publicationDate || postObj.createdAt,
      readTime: postObj.readTime || '5 min read',
      categories: postObj.categories || [],
      tags: postObj.tags || [],
      featuredImage: postObj.featuredImage?.url ? { url: postObj.featuredImage.url } : undefined,
      views: postObj.views || 0,
      likes: postObj.likes || [],
      likesCount: likesCount,
      userLiked: userLiked,
      shares: postObj.shares || 0,
      slug: postObj.slug || postObj._id.toString(),
      type: 'article'
    };

    res.json({
      success: true,
      data: transformedPost
    });

  } catch (error) {
    console.error('Get post by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching post'
    });
  }
});

// Get trending posts
router.get('/posts/trending/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const trendingPosts = await BlogPost.find({ status: 'published' })
      .populate('author', 'firstName lastName name title company avatar verified')
      .populate('likes', 'firstName lastName avatar')
      .sort({ 
        likesCount: -1, 
        views: -1, 
        createdAt: -1 
      })
      .limit(limit);

    const transformedPosts = trendingPosts.map(post => {
      const postObj = post.toObject();
      const userId = req.user?._id?.toString();
      
      let userLiked = false;
      let likesCount = 0;
      
      if (postObj.likes && Array.isArray(postObj.likes)) {
        likesCount = postObj.likes.length;
        if (userId) {
          userLiked = postObj.likes.some(like => 
            like && like._id && like._id.toString() === userId
          );
        }
      }

      return {
        _id: postObj._id,
        headline: postObj.headline,
        summary: postObj.summary,
        authorDetails: {
          _id: postObj.author?._id,
          name: postObj.author?.name || `${postObj.author?.firstName} ${postObj.author?.lastName}`,
          title: postObj.author?.title || '',
          company: postObj.author?.company || postObj.author?.orgName || '',
          avatar: postObj.author?.avatar || '',
          verified: postObj.author?.verified || false
        },
        publicationDate: postObj.publicationDate || postObj.createdAt,
        readTime: postObj.readTime || '5 min read',
        categories: postObj.categories || [],
        featuredImage: postObj.featuredImage?.url ? { url: postObj.featuredImage.url } : undefined,
        views: postObj.views || 0,
        likesCount: likesCount,
        userLiked: userLiked,
        shares: postObj.shares || 0,
        slug: postObj.slug || postObj._id.toString()
      };
    });

    res.json({
      success: true,
      data: transformedPosts
    });

  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending posts'
    });
  }
});

// Get posts by category
router.get('/posts/category/:category', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.params.category;

    const posts = await BlogPost.find({ 
      status: 'published',
      categories: { $in: [new RegExp(category, 'i')] }
    })
      .populate('author', 'firstName lastName name title company avatar verified')
      .populate('likes', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await BlogPost.countDocuments({ 
      status: 'published',
      categories: { $in: [new RegExp(category, 'i')] }
    });

    const transformedPosts = posts.map(post => {
      const postObj = post.toObject();
      const userId = req.user?._id?.toString();
      
      let userLiked = false;
      let likesCount = 0;
      
      if (postObj.likes && Array.isArray(postObj.likes)) {
        likesCount = postObj.likes.length;
        if (userId) {
          userLiked = postObj.likes.some(like => 
            like && like._id && like._id.toString() === userId
          );
        }
      }

      return {
        _id: postObj._id,
        headline: postObj.headline,
        summary: postObj.summary,
        authorDetails: {
          _id: postObj.author?._id,
          name: postObj.author?.name || `${postObj.author?.firstName} ${postObj.author?.lastName}`,
          title: postObj.author?.title || '',
          company: postObj.author?.company || postObj.author?.orgName || '',
          avatar: postObj.author?.avatar || '',
          verified: postObj.author?.verified || false
        },
        publicationDate: postObj.publicationDate || postObj.createdAt,
        readTime: postObj.readTime || '5 min read',
        categories: postObj.categories || [],
        featuredImage: postObj.featuredImage?.url ? { url: postObj.featuredImage.url } : undefined,
        views: postObj.views || 0,
        likesCount: likesCount,
        userLiked: userLiked,
        shares: postObj.shares || 0,
        slug: postObj.slug || postObj._id.toString()
      };
    });

    res.json({
      success: true,
      data: transformedPosts,
      pagination: {
        current: page,
        pages: Math.ceil(totalPosts / limit),
        total: totalPosts
      }
    });

  } catch (error) {
    console.error('Get posts by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts by category'
    });
  }
});

// Protected routes - require authentication
router.use(protect);

// Like/unlike a post - Production ready with proper error handling
router.post('/posts/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate post ID
    if (!id || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID'
      });
    }

    const post = await BlogPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already liked the post
    const hasLiked = post.likes.some(likeId => 
      likeId && likeId.toString() === userId.toString()
    );
    
    let update;
    if (hasLiked) {
      // Unlike - remove user from likes array
      update = { $pull: { likes: userId } };
    } else {
      // Like - add user to likes array
      update = { $addToSet: { likes: userId } };
    }

    // Update the post and get the updated document
    const updatedPost = await BlogPost.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName avatar')
     .populate('likes', 'firstName lastName avatar');

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found after update'
      });
    }

    // Calculate new likes count
    const newLikesCount = updatedPost.likes.length;
    const newUserLiked = !hasLiked;

    res.json({
      success: true,
      data: {
        likesCount: newLikesCount,
        userLiked: newUserLiked,
        post: {
          _id: updatedPost._id,
          likesCount: newLikesCount
        }
      }
    });

  } catch (error) {
    console.error('Like post error:', error);
    
    // More specific error messages
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating like',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    // Validate post exists
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
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

    // Validate post exists
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Here you would typically save the report to a database
    // For now, we'll just log and return success
    console.log('Post reported:', {
      postId: req.params.id,
      reason,
      details,
      reportedBy: req.user._id,
      timestamp: new Date().toISOString()
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

// Create new blog post (protected - authors/admins only)
router.post('/posts', protect, authorize('admin', 'journalist', 'comms'), async (req, res) => {
  try {
    const {
      headline,
      summary,
      fullContent,
      categories,
      tags,
      featuredImage,
      attachments,
      status = 'draft'
    } = req.body;

    // Validate required fields
    if (!headline || !summary || !fullContent) {
      return res.status(400).json({
        success: false,
        message: 'Headline, summary, and content are required'
      });
    }

    const postData = {
      headline,
      summary,
      fullContent,
      author: req.user._id,
      categories: Array.isArray(categories) ? categories : [categories].filter(Boolean),
      tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
      status
    };

    // Add optional fields if provided
    if (featuredImage) postData.featuredImage = featuredImage;
    if (attachments) postData.attachments = attachments;

    const post = new BlogPost(postData);
    await post.save();

    // Populate author details for response
    await post.populate('author', 'firstName lastName name title company avatar verified');

    res.status(201).json({
      success: true,
      data: post,
      message: status === 'draft' ? 'Post saved as draft' : 'Post published successfully'
    });

  } catch (error) {
    console.error('Create post error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating post'
    });
  }
});

// Update blog post
router.put('/posts/:id', protect, authorize('admin', 'journalist', 'comms'), async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is author or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    const updatedPost = await BlogPost.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName name title company avatar verified');

    res.json({
      success: true,
      data: updatedPost,
      message: 'Post updated successfully'
    });

  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating post'
    });
  }
});

// Delete blog post
router.delete('/posts/:id', protect, authorize('admin', 'journalist', 'comms'), async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is author or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    await BlogPost.findByIdAndDelete(req.params.id);

    // Also delete associated comments
    await Comment.deleteMany({ post: req.params.id });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting post'
    });
  }
});

module.exports = router;