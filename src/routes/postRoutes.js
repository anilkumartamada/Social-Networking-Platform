const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validatePostCreation, validateId, validatePagination } = require('../middleware/validation');

// POST /api/posts
router.post('/', authenticateToken, validatePostCreation, postController.createPost);

// GET /api/posts/feed
router.get('/feed', authenticateToken, validatePagination, postController.getFeed);

// GET /api/posts/:postId
router.get('/:postId', validateId, optionalAuth, postController.getPost);

// PUT /api/posts/:postId
router.put('/:postId', authenticateToken, validateId, validatePostCreation, postController.updatePost);

// DELETE /api/posts/:postId
router.delete('/:postId', authenticateToken, validateId, postController.deletePost);

module.exports = router; 