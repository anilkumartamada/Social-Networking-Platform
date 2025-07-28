const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');
const { validateCommentCreation, validatePostId, validateCommentId, validatePagination } = require('../middleware/validation');

// POST /api/posts/:postId/comments
router.post('/:postId/comments', authenticateToken, validatePostId, validateCommentCreation, commentController.createComment);

// GET /api/posts/:postId/comments
router.get('/:postId/comments', validatePostId, validatePagination, commentController.getPostComments);

module.exports = router; 