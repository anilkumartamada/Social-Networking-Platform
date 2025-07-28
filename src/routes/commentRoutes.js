const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');
const { validateCommentCreation, validateId, validatePagination } = require('../middleware/validation');

// POST /api/posts/:postId/comments
router.post('/:postId/comments', authenticateToken, validateId, validateCommentCreation, commentController.createComment);

// GET /api/posts/:postId/comments
router.get('/:postId/comments', validateId, validatePagination, commentController.getPostComments);

// PUT /api/comments/:commentId
router.put('/:commentId', authenticateToken, validateId, validateCommentCreation, commentController.updateComment);

// DELETE /api/comments/:commentId
router.delete('/:commentId', authenticateToken, validateId, commentController.deleteComment);

module.exports = router; 