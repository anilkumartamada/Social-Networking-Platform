const { runQuery, getRow, getAll } = require('../config/database');
const { getMutualFriendsCount, areFriends, formatDate } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user?.id;

        const user = await getRow(`
            SELECT id, first_name, last_name, bio, location, work_company, 
                   work_position, education, relationship_status, profile_picture, 
                   cover_photo, created_at
            FROM users WHERE id = ?
        `, [userId]);

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get friend count
        const friendCount = await getRow(`
            SELECT COUNT(*) as count FROM friendships 
            WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'
        `, [userId, userId]);

        let mutualFriends = 0;
        let isFriend = false;
        let friendRequestSent = false;

        if (currentUserId && currentUserId !== parseInt(userId)) {
            mutualFriends = await getMutualFriendsCount(req.db, currentUserId, userId);
            isFriend = await areFriends(req.db, currentUserId, userId);
            
            // Check if friend request was sent
            const friendRequest = await getRow(`
                SELECT id FROM friendships 
                WHERE user_id = ? AND friend_id = ? AND status = 'pending'
            `, [currentUserId, userId]);
            friendRequestSent = !!friendRequest;
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                profilePicture: user.profile_picture,
                coverPhoto: user.cover_photo,
                bio: user.bio,
                location: user.location,
                work: {
                    company: user.work_company,
                    position: user.work_position
                },
                education: user.education,
                relationshipStatus: user.relationship_status,
                friendCount: friendCount.count,
                mutualFriends,
                isFriend,
                friendRequestSent
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get user profile'
        });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio, location, work, relationshipStatus } = req.body;

        const updateFields = [];
        const updateValues = [];

        if (bio !== undefined) {
            updateFields.push('bio = ?');
            updateValues.push(bio);
        }

        if (location !== undefined) {
            updateFields.push('location = ?');
            updateValues.push(location);
        }

        if (work) {
            if (work.company !== undefined) {
                updateFields.push('work_company = ?');
                updateValues.push(work.company);
            }
            if (work.position !== undefined) {
                updateFields.push('work_position = ?');
                updateValues.push(work.position);
            }
        }

        if (relationshipStatus !== undefined) {
            updateFields.push('relationship_status = ?');
            updateValues.push(relationshipStatus);
        }

        if (updateFields.length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(userId);

        await runQuery(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

// Get user's friends
const getUserFriends = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const friends = await getAll(`
            SELECT u.id, u.first_name, u.last_name, u.profile_picture, u.bio
            FROM users u
            JOIN friendships f ON (f.user_id = u.id OR f.friend_id = u.id)
            WHERE (f.user_id = ? OR f.friend_id = ?) 
            AND f.status = 'accepted'
            AND u.id != ?
            ORDER BY u.first_name, u.last_name
            LIMIT ? OFFSET ?
        `, [userId, userId, userId, limit, offset]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            friends: friends.map(friend => ({
                id: friend.id,
                firstName: friend.first_name,
                lastName: friend.last_name,
                profilePicture: friend.profile_picture,
                bio: friend.bio
            }))
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get friends'
        });
    }
};

// Search users
const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const currentUserId = req.user.id;

        if (!q || q.trim().length < 2) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        const users = await getAll(`
            SELECT id, first_name, last_name, profile_picture, bio
            FROM users 
            WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)
            AND id != ?
            AND account_status = 'active'
            LIMIT 20
        `, [`%${q}%`, `%${q}%`, `%${q}%`, currentUserId]);

        // Add mutual friends count for each user
        const usersWithMutualFriends = await Promise.all(
            users.map(async (user) => {
                const mutualFriends = await getMutualFriendsCount(req.db, currentUserId, user.id);
                return {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    profilePicture: user.profile_picture,
                    bio: user.bio,
                    mutualFriends
                };
            })
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            users: usersWithMutualFriends
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Search failed'
        });
    }
};

module.exports = {
    getUserProfile,
    updateProfile,
    getUserFriends,
    searchUsers
}; 