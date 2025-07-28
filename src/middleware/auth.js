const { verifyToken } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Access token is required'
        });
    }

    try {
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        req.user = { id: decoded.userId };
        next();
    } catch (error) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = verifyToken(token);
            if (decoded) {
                req.user = { id: decoded.userId };
            }
        } catch (error) {
            // Token is invalid, but we don't fail the request
        }
    }

    next();
};

module.exports = {
    authenticateToken,
    optionalAuth
}; 