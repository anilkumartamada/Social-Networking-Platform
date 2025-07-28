const { body, param, query, validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../utils/constants');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// User registration validation
const validateRegistration = [
    body('firstName').trim().isLength({ min: 2, max: 50 }),
    body('lastName').trim().isLength({ min: 2, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    handleValidationErrors
];

// User login validation
const validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    handleValidationErrors
];

// Post creation validation
const validatePostCreation = [
    body('content').optional().trim().isLength({ max: 5000 }),
    body('privacy').optional().isIn(['public', 'friends', 'only_me']),
    handleValidationErrors
];

// Comment creation validation
const validateCommentCreation = [
    body('content').trim().isLength({ min: 1, max: 1000 }),
    handleValidationErrors
];

// Reaction validation
const validateReaction = [
    body('reaction').isIn(['like', 'love', 'haha', 'wow', 'sad', 'angry']),
    handleValidationErrors
];

// Pagination validation
const validatePagination = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    handleValidationErrors
];

// ID parameter validation
const validateId = [
    param('id').isInt({ min: 1 }),
    handleValidationErrors
];

// User ID parameter validation
const validateUserId = [
    param('userId').isInt({ min: 1 }),
    handleValidationErrors
];

// Post ID parameter validation
const validatePostId = [
    param('postId').isInt({ min: 1 }),
    handleValidationErrors
];

// Comment ID parameter validation
const validateCommentId = [
    param('commentId').isInt({ min: 1 }),
    handleValidationErrors
];

// Story ID parameter validation
const validateStoryId = [
    param('storyId').isInt({ min: 1 }),
    handleValidationErrors
];

// Group ID parameter validation
const validateGroupId = [
    param('groupId').isInt({ min: 1 }),
    handleValidationErrors
];

// Request ID parameter validation
const validateRequestId = [
    param('requestId').isInt({ min: 1 }),
    handleValidationErrors
];

// Friend ID parameter validation
const validateFriendId = [
    param('friendId').isInt({ min: 1 }),
    handleValidationErrors
];

// Conversation ID parameter validation
const validateConversationId = [
    param('conversationId').isInt({ min: 1 }),
    handleValidationErrors
];

// Message ID parameter validation
const validateMessageId = [
    param('messageId').isInt({ min: 1 }),
    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validatePostCreation,
    validateCommentCreation,
    validateReaction,
    validatePagination,
    validateId,
    validateUserId,
    validatePostId,
    validateCommentId,
    validateStoryId,
    validateGroupId,
    validateRequestId,
    validateFriendId,
    validateConversationId,
    validateMessageId,
    handleValidationErrors
};