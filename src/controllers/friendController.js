const { runQuery, getRow, getAll } = require('../config/database');
const { createNotification } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');

// Send friend request
const sendFriendRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { userId: friendId, message } = req.body;

        // Check if target user exists
        const targetUser = await getRow('SELECT id FROM users WHERE id = ?', [friendId]);
        if (!targetUser) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already friends or request exists
        const existingFriendship = await getRow(`
            SELECT id, status FROM friendships 
            WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        `, [userId, friendId, friendId, userId]);

        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                return res.status(HTTP_STATUS.CONFLICT).json({
                    success: false,
                    message: 'Already friends'
                });
            } else if (existingFriendship.status === 'pending') {
                return res.status(HTTP_STATUS.CONFLICT).json({
                    success: false,
                    message: 'Friend request already sent'
                });
            }
        }

        // Create friend request
        await runQuery(`
            INSERT INTO friendships (user_id, friend_id, request_message)
            VALUES (?, ?, ?)
        `, [userId, friendId, message]);

        // Create notification
        // 🔁 Fetch sender's name using schema fields
        const sender = await getRow(
            'SELECT first_name, last_name FROM users WHERE id = ?',
            [userId]
        );

        // 🛡️ Fallback in case user is missing
        const senderName = sender
            ? `${sender.first_name} ${sender.last_name}`
            : 'Someone';

        // 🔔 Send clean notification
        await createNotification(
            friendId,
            'friend_request',
            'New Friend Request',
            `${senderName} sent you a friend request`,
            userId,
            'user',
            userId
        );


        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Friend request sent successfully'
        });
    } catch (error) {
        console.error('Send friend request error:', error); // Add error logging
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to send friend request',
            error: error.message // Return error message for debugging
        });
    }
};

// Get friend requests
const getFriendRequests = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get received requests
        const receivedRequests = await getAll(`
            SELECT f.id, f.request_message, f.created_at,
                   u.id as user_id, u.first_name, u.last_name, u.profile_picture
            FROM friendships f
            JOIN users u ON f.user_id = u.id
            WHERE f.friend_id = ? AND f.status = 'pending'
            ORDER BY f.created_at DESC
        `, [userId]);

        // Get sent requests
        const sentRequests = await getAll(`
            SELECT f.id, f.request_message, f.created_at,
                   u.id as user_id, u.first_name, u.last_name, u.profile_picture
            FROM friendships f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = ? AND f.status = 'pending'
            ORDER BY f.created_at DESC
        `, [userId]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            requests: {
                received: receivedRequests.map(req => ({
                    id: req.id,
                    from: {
                        id: req.user_id,
                        name: `${req.first_name} ${req.last_name}`,
                        profilePicture: req.profile_picture
                    },
                    message: req.request_message,
                    sentAt: req.created_at
                })),
                sent: sentRequests.map(req => ({
                    id: req.id,
                    to: {
                        id: req.user_id,
                        name: `${req.first_name} ${req.last_name}`,
                        profilePicture: req.profile_picture
                    },
                    message: req.request_message,
                    sentAt: req.created_at
                }))
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get friend requests'
        });
    }
};

// Accept/reject friend request
const respondToFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action } = req.body; // 'accept' or 'reject'
        const userId = req.user.id;

        // Get the friend request
        const friendRequest = await getRow(`
            SELECT f.*, u.first_name, u.last_name
            FROM friendships f
            JOIN users u ON f.user_id = u.id
            WHERE f.id = ? AND f.friend_id = ? AND f.status = 'pending'
        `, [requestId, userId]);

        if (!friendRequest) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Friend request not found'
            });
        }

        if (action === 'accept') {
            // Accept the request
            await runQuery(`
                UPDATE friendships SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [requestId]);

            // Create notification for the requester
            await createNotification(
                friendRequest.user_id,
                'friend_accepted',
                'Friend Request Accepted',
                `${req.user.firstName} ${req.user.lastName} accepted your friend request`,
                userId,
                'user',
                userId
            );

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Friend request accepted'
            });
        } else if (action === 'reject') {
            // Reject the request
            await runQuery(`
                UPDATE friendships SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [requestId]);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Friend request rejected'
            });
        } else {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid action. Use "accept" or "reject"'
            });
        }
    } catch (error) {
        console.error('Respond to friend request error:', error); // Add error logging
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to respond to friend request',
            error: error.message // Return error message for debugging
        });
    }
};

// Unfriend
const unfriend = async (req, res) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.params;

        // Delete friendship
        await runQuery(`
            DELETE FROM friendships 
            WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        `, [userId, friendId, friendId, userId]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Unfriended successfully'
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to unfriend'
        });
    }
};

// Get friend suggestions
const getFriendSuggestions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10 } = req.query;

        // Get users who are friends of friends but not friends with current user
        const suggestions = await getAll(`
            SELECT DISTINCT u.id, u.first_name, u.last_name, u.profile_picture, u.bio,
                   COUNT(DISTINCT f2.friend_id) as mutual_friends
            FROM users u
            JOIN friendships f1 ON (f1.user_id = u.id OR f1.friend_id = u.id)
            JOIN friendships f2 ON (f2.user_id = ? OR f2.friend_id = ?)
            WHERE u.id != ?
            AND u.account_status = 'active'
            AND f1.status = 'accepted'
            AND f2.status = 'accepted'
            AND u.id NOT IN (
                SELECT CASE 
                    WHEN user_id = ? THEN friend_id 
                    ELSE user_id 
                END
                FROM friendships 
                WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'
            )
            GROUP BY u.id
            ORDER BY mutual_friends DESC
            LIMIT ?
        `, [userId, userId, userId, userId, userId, userId, limit]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            suggestions: suggestions.map(user => ({
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                profilePicture: user.profile_picture,
                bio: user.bio,
                mutualFriends: user.mutual_friends
            }))
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get friend suggestions'
        });
    }
};

module.exports = {
    sendFriendRequest,
    getFriendRequests,
    respondToFriendRequest,
    unfriend,
    getFriendSuggestions
};