const { runQuery, getRow } = require('../config/database');
const { hashPassword, verifyPassword, generateToken } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');

// Register a new user
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Check if email exists
        const existingUser = await getRow('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password and create user
        const passwordHash = await hashPassword(password);
        const result = await runQuery(
            'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)',
            [firstName, lastName, email, passwordHash]
        );

        const token = generateToken(result.id);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Registration successful',
            userId: result.id,
            token
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Registration failed'
        });
    }
};

// User login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await getRow(
            'SELECT id, first_name, last_name, password_hash, profile_picture FROM users WHERE email = ?',
            [email]
        );

        if (!user || !(await verifyPassword(password, user.password_hash))) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = generateToken(user.id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            token,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                profilePicture: user.profile_picture
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Login failed'
        });
    }
};

// Logout
const logout = async (req, res) => {
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Logout successful'
    });
};

module.exports = {
    register,
    login,
    logout
}; 