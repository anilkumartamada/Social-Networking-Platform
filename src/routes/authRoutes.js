const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');

// POST /api/auth/register
router.post('/register', validateRegistration, authController.register);

// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// POST /api/auth/logout
router.post('/logout', authController.logout);

module.exports = router; 