const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

// GET /api/search
router.get('/', optionalAuth, validatePagination, searchController.globalSearch);

module.exports = router;