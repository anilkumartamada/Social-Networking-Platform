const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');
const { validateId, validatePagination, validateConversationId, validateMessageId } = require('../middleware/validation');

// POST /api/messages/send
router.post('/send', authenticateToken, messageController.sendMessage);

// GET /api/messages/conversations
router.get('/conversations', authenticateToken, validatePagination, messageController.getConversations);

// GET /api/messages/conversation/:conversationId
router.get('/conversation/:conversationId', authenticateToken, validateConversationId, validatePagination, messageController.getConversationMessages);

// PUT /api/messages/:messageId/read
router.put('/:messageId/read', authenticateToken, validateMessageId, messageController.markAsRead);

module.exports = router;