const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { validateId, validatePagination } = require('../middleware/validation');

// GET /api/users/:userId
router.get('/:userId', validateId, userController.getUserProfile);

// PUT /api/users/profile
router.put('/profile', authenticateToken, userController.updateProfile);

// GET /api/users/:userId/friends
router.get('/:userId/friends', validateId, validatePagination, userController.getUserFriends);

// GET /api/users/search
router.get('/search', authenticateToken, userController.searchUsers);

module.exports = router; 