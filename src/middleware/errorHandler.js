const { HTTP_STATUS } = require('../utils/constants');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Multer errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(HTTP_STATUS.PAYLOAD_TOO_LARGE).json({
                success: false,
                message: 'File too large'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(HTTP_STATUS.PAYLOAD_TOO_LARGE).json({
                success: false,
                message: 'Too many files'
            });
        }
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Validation error',
            errors: err.errors
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Token expired'
        });
    }

    // Database errors
    if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(HTTP_STATUS.CONFLICT).json({
            success: false,
            message: 'Resource already exists'
        });
    }

    // Default error
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Internal server error'
    });
};

// 404 handler
const notFound = (req, res) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Route not found'
    });
};

module.exports = {
    errorHandler,
    notFound
}; 