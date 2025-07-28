const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');
const { validateId, validatePagination } = require('../middleware/validation');

// POST /api/messages/send
router.post('/send', authenticateToken, messageController.sendMessage);

// GET /api/messages/conversations
router.get('/conversations', authenticateToken, validatePagination, messageController.getConversations);

// GET /api/messages/conversation/:conversationId
router.get('/conversation/:conversationId', authenticateToken, validateId, validatePagination, messageController.getConversationMessages);

// PUT /api/messages/:messageId/read
router.put('/:messageId/read', authenticateToken, validateId, messageController.markAsRead);

module.exports = router;