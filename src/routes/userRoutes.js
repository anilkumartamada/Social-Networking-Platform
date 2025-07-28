const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { validateUserId, validatePagination } = require('../middleware/validation');

// GET /api/users/search
router.get('/search', authenticateToken, userController.searchUsers);

// GET /api/users/:userId
router.get('/:userId', validateUserId, userController.getUserProfile);

// PUT /api/users/profile
router.put('/profile', authenticateToken, userController.updateProfile);

// GET /api/users/:userId/friends
router.get('/:userId/friends', validateUserId, validatePagination, userController.getUserFriends);

module.exports = router; 