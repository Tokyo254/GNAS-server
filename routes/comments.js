// routes/comments.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/post/:postId', commentController.getCommentsByPostId);
router.post('/guest', commentController.createGuestComment);

// Protected routes (require authentication)
router.post('/', protect, commentController.createUserComment);
router.put('/:commentId', protect, commentController.updateComment);
router.delete('/:commentId', protect, commentController.deleteComment);
router.post('/:commentId/like', protect, commentController.likeComment);

module.exports = router;