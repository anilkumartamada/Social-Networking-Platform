const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validatePostCreation, validatePostId, validatePagination } = require('../middleware/validation');

// POST /api/posts
router.post('/', authenticateToken, validatePostCreation, postController.createPost);

// GET /api/posts/feed
router.get('/feed', authenticateToken, validatePagination, postController.getFeed);

// GET /api/posts/:postId
router.get('/:postId', validatePostId, optionalAuth, postController.getPost);

// PUT /api/posts/:postId
router.put('/:postId', authenticateToken, validatePostId, validatePostCreation, postController.updatePost);

// DELETE /api/posts/:postId
router.delete('/:postId', authenticateToken, validatePostId, postController.deletePost);

module.exports = router; 