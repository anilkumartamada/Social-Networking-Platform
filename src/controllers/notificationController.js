const { runQuery, getRow, getAll } = require('../config/database');
const { HTTP_STATUS } = require('../utils/constants');

// Get notifications
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const notifications = await getAll(`
            SELECT n.*, u.first_name, u.last_name, u.profile_picture
            FROM notifications n
            LEFT JOIN users u ON n.actor_id = u.id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);

        // Get unread count
        const unreadCount = await getRow(`
            SELECT COUNT(*) as count FROM notifications 
            WHERE user_id = ? AND read = 0
        `, [userId]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            notifications: notifications.map(notif => ({
                id: notif.id,
                type: notif.type,
                message: notif.message,
                actor: notif.actor_id ? {
                    id: notif.actor_id,
                    name: `${notif.first_name} ${notif.last_name}`,
                    profilePicture: notif.profile_picture
                } : null,
                createdAt: notif.created_at,
                read: notif.read === 1,
                actionUrl: notif.action_url
            })),
            unreadCount: unreadCount.count
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get notifications',
            error:error.message 
        });
    }
};

// Mark notifications as read
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationIds } = req.body;

        if (notificationIds && Array.isArray(notificationIds)) {
            // Mark specific notifications as read
            const placeholders = notificationIds.map(() => '?').join(',');
            await runQuery(`
                UPDATE notifications SET read = 1 
                WHERE user_id = ? AND id IN (${placeholders})
            `, [userId, ...notificationIds]);
        } else {
            // Mark all notifications as read
            await runQuery(`
                UPDATE notifications SET read = 1 WHERE user_id = ?
            `, [userId]);
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Notifications marked as read'
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to mark notifications as read'
        });
    }
};

// Get notification settings
const getNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const settings = await getRow(`
            SELECT * FROM notification_settings WHERE user_id = ?
        `, [userId]);

        // Default settings if not found
        const defaultSettings = {
            emailNotifications: true,
            pushNotifications: true,
            friendRequests: true,
            comments: true,
            reactions: true,
            messages: true,
            groupActivity: true
        };

        res.status(HTTP_STATUS.OK).json({
            success: true,
            settings: settings ? {
                emailNotifications: settings.email_notifications === 1,
                pushNotifications: settings.push_notifications === 1,
                friendRequests: settings.friend_requests === 1,
                comments: settings.comments === 1,
                reactions: settings.reactions === 1,
                messages: settings.messages === 1,
                groupActivity: settings.group_activity === 1
            } : defaultSettings
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get notification settings'
        });
    }
};

// Update notification settings
const updateNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            emailNotifications,
            pushNotifications,
            friendRequests,
            comments,
            reactions,
            messages,
            groupActivity
        } = req.body;

        // Check if settings exist
        const existingSettings = await getRow(`
            SELECT id FROM notification_settings WHERE user_id = ?
        `, [userId]);

        if (existingSettings) {
            // Update existing settings
            await runQuery(`
                UPDATE notification_settings SET
                    email_notifications = ?,
                    push_notifications = ?,
                    friend_requests = ?,
                    comments = ?,
                    reactions = ?,
                    messages = ?,
                    group_activity = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `, [
                emailNotifications ? 1 : 0,
                pushNotifications ? 1 : 0,
                friendRequests ? 1 : 0,
                comments ? 1 : 0,
                reactions ? 1 : 0,
                messages ? 1 : 0,
                groupActivity ? 1 : 0,
                userId
            ]);
        } else {
            // Create new settings
            await runQuery(`
                INSERT INTO notification_settings (
                    user_id, email_notifications, push_notifications,
                    friend_requests, comments, reactions, messages, group_activity
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId,
                emailNotifications ? 1 : 0,
                pushNotifications ? 1 : 0,
                friendRequests ? 1 : 0,
                comments ? 1 : 0,
                reactions ? 1 : 0,
                messages ? 1 : 0,
                groupActivity ? 1 : 0
            ]);
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Notification settings updated'
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update notification settings'
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    getNotificationSettings,
    updateNotificationSettings
};