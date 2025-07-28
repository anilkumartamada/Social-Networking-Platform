const { runQuery, getRow, getAll } = require('../config/database');
const { HTTP_STATUS } = require('../utils/constants');

// React to a post
const reactToPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;
        const { reaction } = req.body;

        // Check if post exists
        const post = await getRow('SELECT id FROM posts WHERE id = ?', [postId]);
        if (!post) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Check if user already reacted
        const existingReaction = await getRow(
            'SELECT id FROM reactions WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );

        if (existingReaction) {
            // Update existing reaction
            await runQuery(
                'UPDATE reactions SET reaction_type = ? WHERE user_id = ? AND post_id = ?',
                [reaction, userId, postId]
            );
        } else {
            // Create new reaction
            await runQuery(
                'INSERT INTO reactions (user_id, post_id, reaction_type) VALUES (?, ?, ?)',
                [userId, postId, reaction]
            );
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Reaction added successfully'
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to add reaction'
        });
    }
};

// Remove reaction from post
const removeReaction = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        await runQuery(
            'DELETE FROM reactions WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Reaction removed successfully'
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to remove reaction'
        });
    }
};

// Get post reactions
const getPostReactions = async (req, res) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Get reaction summary
        const summary = await getRow(`
            SELECT 
                SUM(CASE WHEN reaction_type = 'like' THEN 1 ELSE 0 END) as like_count,
                SUM(CASE WHEN reaction_type = 'love' THEN 1 ELSE 0 END) as love_count,
                SUM(CASE WHEN reaction_type = 'haha' THEN 1 ELSE 0 END) as haha_count,
                SUM(CASE WHEN reaction_type = 'wow' THEN 1 ELSE 0 END) as wow_count,
                SUM(CASE WHEN reaction_type = 'sad' THEN 1 ELSE 0 END) as sad_count,
                SUM(CASE WHEN reaction_type = 'angry' THEN 1 ELSE 0 END) as angry_count,
                COUNT(*) as total_reactions
            FROM reactions 
            WHERE post_id = ?
        `, [postId]);

        // Get users who reacted
        const users = await getAll(`
            SELECT r.reaction_type, u.id, u.first_name, u.last_name, u.profile_picture
            FROM reactions r
            JOIN users u ON r.user_id = u.id
            WHERE r.post_id = ?
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        `, [postId, limit, offset]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            reactions: {
                summary: {
                    like: summary.like_count || 0,
                    love: summary.love_count || 0,
                    haha: summary.haha_count || 0,
                    wow: summary.wow_count || 0,
                    sad: summary.sad_count || 0,
                    angry: summary.angry_count || 0,
                    total: summary.total_reactions || 0
                },
                users: users.map(user => ({
                    id: user.id,
                    name: `${user.first_name} ${user.last_name}`,
                    profilePicture: user.profile_picture,
                    reaction: user.reaction_type
                }))
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get reactions'
        });
    }
};

module.exports = {
    reactToPost,
    removeReaction,
    getPostReactions
}; 