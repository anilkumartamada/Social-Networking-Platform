const { runQuery, getRow, getAll } = require('../config/database');
const { HTTP_STATUS } = require('../utils/constants');

// Create a group
const createGroup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, privacy, category, coverPhoto } = req.body;

        // Create group
        const result = await runQuery(`
            INSERT INTO groups (name, description, privacy, category, cover_photo, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [name, description, privacy || 'public', category, coverPhoto, userId]);

        const groupId = result.id;

        // Add creator as admin member
        await runQuery(`
            INSERT INTO group_members (group_id, user_id, role, status)
            VALUES (?, ?, 'admin', 'active')
        `, [groupId, userId]);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            group: {
                id: groupId,
                name,
                description,
                privacy,
                category,
                coverPhoto,
                memberCount: 1,
                role: 'admin'
            }
        });
    } catch (error) {
        console.error('Create group error:', error); // <-- Add error logging
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create group',
            error: error.message // <-- Return error message for debugging
        });
    }
};

// Get group details
const getGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.id;

        // Get group details
        const group = await getRow(`
            SELECT g.*, u.first_name as creator_first_name, u.last_name as creator_last_name,
                   COUNT(gm.id) as member_count
            FROM groups g
            JOIN users u ON g.created_by = u.id
            LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.status = 'active'
            WHERE g.id = ?
            GROUP BY g.id
        `, [groupId]);

        if (!group) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Get user's membership status
        let userRole = null;
        if (userId) {
            const membership = await getRow(`
                SELECT role FROM group_members 
                WHERE group_id = ? AND user_id = ? AND status = 'active'
            `, [groupId, userId]);
            userRole = membership?.role || null;
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            group: {
                id: group.id,
                name: group.name,
                description: group.description,
                privacy: group.privacy,
                category: group.category,
                coverPhoto: group.cover_photo,
                creator: {
                    name: `${group.creator_first_name} ${group.creator_last_name}`
                },
                memberCount: group.member_count,
                userRole,
                createdAt: group.created_at
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get group details'
        });
    }
};

// Join a group
const joinGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        // Check if group exists
        const group = await getRow('SELECT id, privacy FROM groups WHERE id = ?', [groupId]);
        if (!group) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Check if already a member
        const existingMember = await getRow(`
            SELECT id FROM group_members WHERE group_id = ? AND user_id = ?
        `, [groupId, userId]);

        if (existingMember) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: 'Already a member of this group'
            });
        }

        // Add member (pending for private groups, active for public)
        const status = group.privacy === 'private' ? 'pending' : 'active';
        await runQuery(`
            INSERT INTO group_members (group_id, user_id, role, status)
            VALUES (?, ?, 'member', ?)
        `, [groupId, userId, status]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: group.privacy === 'private' ? 'Join request sent' : 'Joined group successfully'
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to join group'
        });
    }
};

// Get group members
const getGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const members = await getAll(`
            SELECT gm.role, gm.status, gm.joined_at,
                   u.id, u.first_name, u.last_name, u.profile_picture
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = ? AND gm.status = 'active'
            ORDER BY gm.joined_at DESC
            LIMIT ? OFFSET ?
        `, [groupId, limit, offset]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            members: members.map(member => ({
                id: member.id,
                name: `${member.first_name} ${member.last_name}`,
                profilePicture: member.profile_picture,
                role: member.role,
                joinedAt: member.joined_at
            }))
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get group members'
        });
    }
};

// Update member role (admin only)
const updateMemberRole = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const { role } = req.body;
        const requesterId = req.user.id;

        // Check if requester is admin
        const requesterMembership = await getRow(`
            SELECT role FROM group_members 
            WHERE group_id = ? AND user_id = ? AND status = 'active'
        `, [groupId, requesterId]);

        if (!requesterMembership || requesterMembership.role !== 'admin') {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Only group admins can update member roles'
            });
        }

        // Update member role
        await runQuery(`
            UPDATE group_members SET role = ? 
            WHERE group_id = ? AND user_id = ?
        `, [role, groupId, userId]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Member role updated successfully'
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update member role'
        });
    }
};

// Post in a group
const createGroupPost = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;
        const { content, privacy } = req.body;

        // Check if user is a member
        const membership = await getRow(`
            SELECT id FROM group_members 
            WHERE group_id = ? AND user_id = ? AND status = 'active'
        `, [groupId, userId]);

        if (!membership) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You must be a group member to post'
            });
        }

        // Create post
        const result = await runQuery(`
            INSERT INTO posts (user_id, content, privacy, group_id)
            VALUES (?, ?, ?, ?)
        `, [userId, content, privacy || 'public', groupId]);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            post: {
                id: result.id,
                content,
                privacy,
                groupId,
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create group post'
        });
    }
};

module.exports = {
    createGroup,
    getGroup,
    joinGroup,
    getGroupMembers,
    updateMemberRole,
    createGroupPost
};