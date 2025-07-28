const express = require('express');
const router = express.Router();
const reactionController = require('../controllers/reactionController');
const { authenticateToken } = require('../middleware/auth');
const { validateReaction, validatePostId, validatePagination } = require('../middleware/validation');

// POST /api/posts/:postId/react
router.post('/:postId/react', authenticateToken, validatePostId, validateReaction, reactionController.reactToPost);

// DELETE /api/posts/:postId/react
router.delete('/:postId/react', authenticateToken, validatePostId, reactionController.removeReaction);

// GET /api/posts/:postId/reactions
router.get('/:postId/reactions', validatePostId, validatePagination, reactionController.getPostReactions);

module.exports = router; 