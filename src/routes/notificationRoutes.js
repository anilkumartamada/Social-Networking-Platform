const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

// GET /api/notifications
router.get('/', authenticateToken, validatePagination, notificationController.getNotifications);

// PUT /api/notifications/read
router.put('/read', authenticateToken, notificationController.markAsRead);

// GET /api/notifications/settings
router.get('/settings', authenticateToken, notificationController.getNotificationSettings);

// PUT /api/notifications/settings
router.put('/settings', authenticateToken, notificationController.updateNotificationSettings);

module.exports = router;