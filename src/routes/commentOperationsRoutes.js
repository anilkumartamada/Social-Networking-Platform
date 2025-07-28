const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticateToken } = require('../middleware/auth');
const { validateCommentCreation, validateCommentId } = require('../middleware/validation');

// PUT /api/comments/:commentId
router.put('/:commentId', authenticateToken, validateCommentId, validateCommentCreation, commentController.updateComment);

// DELETE /api/comments/:commentId
router.delete('/:commentId', authenticateToken, validateCommentId, commentController.deleteComment);

module.exports = router; 