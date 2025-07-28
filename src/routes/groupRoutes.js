const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticateToken } = require('../middleware/auth');
const { validateGroupId, validatePagination } = require('../middleware/validation');

// POST /api/groups
router.post('/', authenticateToken, groupController.createGroup);

// GET /api/groups/:groupId
router.get('/:groupId', validateGroupId, authenticateToken, groupController.getGroup);

// POST /api/groups/:groupId/join
router.post('/:groupId/join', authenticateToken, validateGroupId, groupController.joinGroup);

// GET /api/groups/:groupId/members
router.get('/:groupId/members', validateGroupId, validatePagination, groupController.getGroupMembers);

// PUT /api/groups/:groupId/members/:userId/role
router.put('/:groupId/members/:userId/role', authenticateToken, validateGroupId, groupController.updateMemberRole);

// POST /api/groups/:groupId/posts
router.post('/:groupId/posts', authenticateToken, validateGroupId, groupController.createGroupPost);

module.exports = router;