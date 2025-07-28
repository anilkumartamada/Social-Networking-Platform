const express = require('express');
const router = express.Router();
const reactionController = require('../controllers/reactionController');
const { authenticateToken } = require('../middleware/auth');
const { validateReaction, validateId, validatePagination } = require('../middleware/validation');

// POST /api/posts/:postId/react
router.post('/:postId/react', authenticateToken, validateId, validateReaction, reactionController.reactToPost);

// DELETE /api/posts/:postId/react
router.delete('/:postId/react', authenticateToken, validateId, reactionController.removeReaction);

// GET /api/posts/:postId/reactions
router.get('/:postId/reactions', validateId, validatePagination, reactionController.getPostReactions);

module.exports = router; 