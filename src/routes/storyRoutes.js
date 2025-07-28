const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { authenticateToken } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');

// POST /api/stories
router.post('/', authenticateToken, storyController.createStory);

// GET /api/stories/feed
router.get('/feed', authenticateToken, storyController.getStoriesFeed);

// GET /api/stories/:storyId/views
router.get('/:storyId/views', authenticateToken, validateId, storyController.getStoryViews);

// POST /api/stories/:storyId/view
router.post('/:storyId/view', authenticateToken, validateId, storyController.viewStory);

module.exports = router;