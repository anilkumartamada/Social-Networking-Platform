const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const { authenticateToken } = require('../middleware/auth');
const { validateId, validatePagination } = require('../middleware/validation');

// POST /api/friends/request
router.post('/request', authenticateToken, friendController.sendFriendRequest);

// GET /api/friends/requests
router.get('/requests', authenticateToken, friendController.getFriendRequests);

// PUT /api/friends/request/:requestId
router.put('/request/:requestId', authenticateToken, validateId, friendController.respondToFriendRequest);

// DELETE /api/friends/:friendId
router.delete('/:friendId', authenticateToken, validateId, friendController.unfriend);

// GET /api/friends/suggestions
router.get('/suggestions', authenticateToken, validatePagination, friendController.getFriendSuggestions);

module.exports = router; 