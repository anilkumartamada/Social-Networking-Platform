const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { runQuery } = require('../config/database');

// Password hashing
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

// Password verification
const verifyPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

// JWT token generation
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// JWT token verification
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    } catch (error) {
        return null;
    }
};

// Generate unique filename
const generateUniqueFilename = (originalName) => {
    const ext = originalName.split('.').pop();
    return `${uuidv4()}.${ext}`;
};

// Format date for display
const formatDate = (date) => {
    return moment(date).fromNow();
};

// Calculate mutual friends count
const getMutualFriendsCount = async (db, userId1, userId2) => {
    const sql = `
        SELECT COUNT(*) as count
        FROM friendships f1
        JOIN friendships f2 ON f1.friend_id = f2.friend_id
        WHERE f1.user_id = ? AND f2.user_id = ? 
        AND f1.status = 'accepted' AND f2.status = 'accepted'
    `;
    const result = await db.getRow(sql, [userId1, userId2]);
    return result ? result.count : 0;
};

// Check if users are friends
const areFriends = async (db, userId1, userId2) => {
    const sql = `
        SELECT id FROM friendships 
        WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
        AND status = 'accepted'
    `;
    const result = await db.getRow(sql, [userId1, userId2, userId2, userId1]);
    return !!result;
};

// Check if user can view post based on privacy
const canViewPost = async (db, post, viewerId) => {
    if (!post) return false;
    
    // Post owner can always view
    if (post.user_id === viewerId) return true;
    
    // Public posts can be viewed by anyone
    if (post.privacy === 'public') return true;
    
    // Only me posts can only be viewed by owner
    if (post.privacy === 'only_me') return false;
    
    // Friends posts can be viewed by friends
    if (post.privacy === 'friends') {
        return await areFriends(db, post.user_id, viewerId);
    }
    
    return false;
};

// Sanitize user input
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
        .replace(/[<>]/g, '')
        .trim();
};

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Generate pagination info
const getPaginationInfo = (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    return { offset, limit: parseInt(limit) };
};

// Create notification
const createNotification = async (userId, type, title, message, actorId = null, targetType = null, targetId = null, actionUrl = null) => {
    const sql = `
        INSERT INTO notifications (user_id, type, title, message, actor_id, target_type, target_id, action_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return await runQuery(sql, [userId, type, title, message, actorId, targetType, targetId, actionUrl]);
};

module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
    generateUniqueFilename,
    formatDate,
    getMutualFriendsCount,
    areFriends,
    canViewPost,
    sanitizeInput,
    isValidEmail,
    getPaginationInfo,
    createNotification
};