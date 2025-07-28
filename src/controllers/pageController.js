const { runQuery, getRow, getAll } = require('../config/database');
const { HTTP_STATUS } = require('../utils/constants');

// Create a page
const createPage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, category, description, contact } = req.body;

        const result = await runQuery(`
            INSERT INTO pages (name, category, description, contact_info, creator_id)
            VALUES (?, ?, ?, ?, ?)
        `, [name, category, description, JSON.stringify(contact || {}), userId]);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            page: {
                id: result.id,
                name,
                category,
                description,
                contact,
                likeCount: 0,
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create page'
        });
    }
};

// Get page details
const getPage = async (req, res) => {
    try {
        const { pageId } = req.params;
        const userId = req.user?.id;

        const page = await getRow(`
            SELECT p.*, u.first_name, u.last_name,
                   COUNT(DISTINCT pl.id) as like_count,
                   MAX(CASE WHEN pl.user_id = ? THEN 1 ELSE 0 END) as user_liked
            FROM pages p
            JOIN users u ON p.creator_id = u.id
            LEFT JOIN page_likes pl ON p.id = pl.page_id
            WHERE p.id = ?
            GROUP BY p.id
        `, [userId || 0, pageId]);

        if (!page) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Page not found'
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            page: {
                id: page.id,
                name: page.name,
                category: page.category,
                description: page.description,
                coverPhoto: page.cover_photo,
                contact: JSON.parse(page.contact_info || '{}'),
                creator: {
                    name: `${page.first_name} ${page.last_name}`
                },
                likeCount: page.like_count,
                userLiked: page.user_liked === 1,
                createdAt: page.created_at
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get page details'
        });
    }
};

// Like/unlike a page
const togglePageLike = async (req, res) => {
    try {
        const { pageId } = req.params;
        const userId = req.user.id;

        // Check if page exists
        const page = await getRow('SELECT id FROM pages WHERE id = ?', [pageId]);
        if (!page) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Page not found'
            });
        }

        // Check if already liked
        const existingLike = await getRow(`
            SELECT id FROM page_likes WHERE page_id = ? AND user_id = ?
        `, [pageId, userId]);

        if (existingLike) {
            // Unlike
            await runQuery(`
                DELETE FROM page_likes WHERE page_id = ? AND user_id = ?
            `, [pageId, userId]);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Page unliked',
                liked: false
            });
        } else {
            // Like
            await runQuery(`
                INSERT INTO page_likes (page_id, user_id) VALUES (?, ?)
            `, [pageId, userId]);

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'Page liked',
                liked: true
            });
        }
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to toggle page like'
        });
    }
};

// Get page insights (page admin only)
const getPageInsights = async (req, res) => {
    try {
        const { pageId } = req.params;
        const userId = req.user.id;

        // Check if user is page creator
        const page = await getRow(`
            SELECT creator_id FROM pages WHERE id = ?
        `, [pageId]);

        if (!page) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Page not found'
            });
        }

        if (page.creator_id !== userId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Only page creator can view insights'
            });
        }

        // Get basic insights
        const insights = await getRow(`
            SELECT 
                COUNT(DISTINCT pl.id) as total_likes,
                COUNT(DISTINCT p.id) as total_posts
            FROM pages pg
            LEFT JOIN page_likes pl ON pg.id = pl.page_id
            LEFT JOIN posts p ON pg.id = p.page_id
            WHERE pg.id = ?
        `, [pageId]);

        // Get recent activity (last 30 days)
        const recentActivity = await getAll(`
            SELECT DATE(pl.created_at) as date, COUNT(*) as likes
            FROM page_likes pl
            WHERE pl.page_id = ? AND pl.created_at >= date('now', '-30 days')
            GROUP BY DATE(pl.created_at)
            ORDER BY date DESC
        `, [pageId]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            insights: {
                totalLikes: insights.total_likes,
                totalPosts: insights.total_posts,
                recentActivity: recentActivity.map(activity => ({
                    date: activity.date,
                    likes: activity.likes
                }))
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get page insights'
        });
    }
};

module.exports = {
    createPage,
    getPage,
    togglePageLike,
    getPageInsights
};