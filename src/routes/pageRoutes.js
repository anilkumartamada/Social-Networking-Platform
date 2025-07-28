const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');

// POST /api/pages
router.post('/', authenticateToken, pageController.createPage);

// GET /api/pages/:pageId
router.get('/:pageId', validateId, optionalAuth, pageController.getPage);

// POST /api/pages/:pageId/like
router.post('/:pageId/like', authenticateToken, validateId, pageController.togglePageLike);

// GET /api/pages/:pageId/insights
router.get('/:pageId/insights', authenticateToken, validateId, pageController.getPageInsights);

module.exports = router;