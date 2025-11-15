// controllers/commentController.js
const Comment = require('../models/Comment');
const BlogPost = require('../models/BlogPost');

// Get comments for a post
exports.getCommentsByPostId = async (req, res) => {
  try {
    const { postId } = req.params;

    // Verify post exists
    const post = await BlogPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Get top-level comments (no parent) with replies populated
    const comments = await Comment.find({ 
      post: postId,
      parentComment: null 
    })
    .populate('author', 'name avatar verified title company')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'name avatar verified title company'
      },
      options: { sort: { createdAt: 1 } }
    })
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: comments
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
};

// Create a new comment (for authenticated users)
exports.createUserComment = async (req, res) => {
  try {
    const { content, postId, parentComment } = req.body;
    const userId = req.user.id;

    // Validation
    if (!content || !postId) {
      return res.status(400).json({
        success: false,
        message: 'Content and post ID are required'
      });
    }

    // Verify post exists
    const post = await BlogPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Verify parent comment exists if provided
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    // Create comment
    const comment = new Comment({
      content,
      author: userId,
      post: postId,
      parentComment: parentComment || null
    });

    await comment.save();
    
    // Populate author info for response
    await comment.populate('author', 'name avatar verified title company');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating comment'
    });
  }
};

// Create a guest comment (no authentication required)
exports.createGuestComment = async (req, res) => {
  try {
    const { content, postId, parentComment, guestName, guestEmail } = req.body;

    // Validation
    if (!content || !postId || !guestName) {
      return res.status(400).json({
        success: false,
        message: 'Content, post ID, and name are required'
      });
    }

    // Verify post exists
    const post = await BlogPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Verify parent comment exists if provided
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }

    // Create guest comment
    const comment = new Comment({
      content,
      post: postId,
      parentComment: parentComment || null,
      guestAuthor: {
        name: guestName,
        email: guestEmail || ''
      },
      isGuestComment: true
    });

    await comment.save();
    
    // Populate guest author info for response
    await comment.populate('guestAuthor');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment
    });

  } catch (error) {
    console.error('Error creating guest comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating comment'
    });
  }
};

// Like/unlike a comment
exports.likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const isLiked = comment.likes.includes(userId);
    
    if (isLiked) {
      // Unlike
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    } else {
      // Like
      comment.likes.push(userId);
    }

    await comment.save();

    res.json({
      success: true,
      data: {
        likesCount: comment.likes.length,
        userLiked: !isLiked
      }
    });

  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking comment'
    });
  }
};

// Update a comment
exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership (user comment)
    if (comment.author && comment.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this comment'
      });
    }

    // Guest comments cannot be edited (no way to verify ownership)
    if (comment.isGuestComment) {
      return res.status(403).json({
        success: false,
        message: 'Guest comments cannot be edited'
      });
    }

    comment.content = content;
    comment.edited = true;
    await comment.save();

    await comment.populate('author', 'name avatar verified title company');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating comment'
    });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership (user comment)
    if (comment.author && comment.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Guest comments cannot be deleted (no way to verify ownership)
    if (comment.isGuestComment) {
      return res.status(403).json({
        success: false,
        message: 'Guest comments cannot be deleted'
      });
    }

    // Also delete all replies
    await Comment.deleteMany({ parentComment: commentId });
    await Comment.findByIdAndDelete(commentId);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment'
    });
  }
};