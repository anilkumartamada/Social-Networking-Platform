const { runQuery, getRow, getAll } = require('../config/database');
const { HTTP_STATUS } = require('../utils/constants');

// Create a story
const createStory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, content, text, duration } = req.body;

        // Stories expire after 24 hours
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const result = await runQuery(`
            INSERT INTO stories (user_id, type, content, text, duration, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [userId, type, content, text, duration || 5, expiresAt.toISOString()]);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            story: {
                id: result.id,
                type,
                content,
                text,
                duration,
                expiresAt: expiresAt.toISOString(),
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create story'
        });
    }
};

// Get stories feed
const getStoriesFeed = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get stories from friends and own stories (not expired)
        const stories = await getAll(`
            SELECT DISTINCT s.*, u.first_name, u.last_name, u.profile_picture,
                   COUNT(DISTINCT sv.id) as view_count,
                   MAX(CASE WHEN sv.viewer_id = ? THEN 1 ELSE 0 END) as viewed_by_user
            FROM stories s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN story_views sv ON s.id = sv.story_id
            WHERE s.expires_at > datetime('now') AND (
                s.user_id = ? OR 
                s.user_id IN (
                    SELECT CASE WHEN user_id = ? THEN friend_id ELSE user_id END
                    FROM friendships 
                    WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'
                )
            )
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `, [userId, userId, userId, userId, userId]);

        // Group stories by user
        const groupedStories = {};
        stories.forEach(story => {
            const authorId = story.user_id;
            if (!groupedStories[authorId]) {
                groupedStories[authorId] = {
                    author: {
                        id: authorId,
                        name: `${story.first_name} ${story.last_name}`,
                        profilePicture: story.profile_picture
                    },
                    stories: [],
                    hasUnviewed: false
                };
            }
            
            const storyData = {
                id: story.id,
                type: story.type,
                content: story.content,
                text: story.text,
                duration: story.duration,
                viewCount: story.view_count,
                viewedByUser: story.viewed_by_user === 1,
                createdAt: story.created_at,
                expiresAt: story.expires_at
            };
            
            groupedStories[authorId].stories.push(storyData);
            if (!storyData.viewedByUser) {
                groupedStories[authorId].hasUnviewed = true;
            }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            storyGroups: Object.values(groupedStories)
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get stories feed'
        });
    }
};

// Get story views (story owner only)
const getStoryViews = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user.id;

        // Check if user owns the story
        const story = await getRow(`
            SELECT user_id FROM stories WHERE id = ?
        `, [storyId]);

        if (!story) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Story not found'
            });
        }

        if (story.user_id !== userId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You can only view your own story views'
            });
        }

        // Get story views
        const views = await getAll(`
            SELECT sv.viewed_at, u.id, u.first_name, u.last_name, u.profile_picture
            FROM story_views sv
            JOIN users u ON sv.viewer_id = u.id
            WHERE sv.story_id = ?
            ORDER BY sv.viewed_at DESC
        `, [storyId]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            views: views.map(view => ({
                viewer: {
                    id: view.id,
                    name: `${view.first_name} ${view.last_name}`,
                    profilePicture: view.profile_picture
                },
                viewedAt: view.viewed_at
            })),
            totalViews: views.length
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get story views'
        });
    }
};

// View a story
const viewStory = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.user.id;

        // Check if story exists and not expired
        const story = await getRow(`
            SELECT id, user_id FROM stories 
            WHERE id = ? AND expires_at > datetime('now')
        `, [storyId]);

        if (!story) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Story not found or expired'
            });
        }

        // Don't record view if it's the story owner
        if (story.user_id !== userId) {
            // Check if already viewed
            const existingView = await getRow(`
                SELECT id FROM story_views WHERE story_id = ? AND viewer_id = ?
            `, [storyId, userId]);

            if (!existingView) {
                // Record the view
                await runQuery(`
                    INSERT INTO story_views (story_id, viewer_id)
                    VALUES (?, ?)
                `, [storyId, userId]);
            }
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Story viewed'
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to view story'
        });
    }
};

module.exports = {
    createStory,
    getStoriesFeed,
    getStoryViews,
    viewStory
};