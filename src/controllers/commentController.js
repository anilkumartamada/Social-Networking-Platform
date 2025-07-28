const { runQuery, getRow, getAll } = require('../config/database');
const { HTTP_STATUS } = require('../utils/constants');

// Comment on a post
const createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;
        const { content, parentCommentId, mentions } = req.body;

        // Check if post exists
        const post = await getRow('SELECT id FROM posts WHERE id = ?', [postId]);
        if (!post) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Insert comment
        const commentResult = await runQuery(`
            INSERT INTO comments (post_id, user_id, content, parent_comment_id)
            VALUES (?, ?, ?, ?)
        `, [postId, userId, content, parentCommentId]);

        const commentId = commentResult.id;

        // Handle mentions if provided
        if (mentions && Array.isArray(mentions) && mentions.length > 0) {
            for (const mentionedUserId of mentions) {
                await runQuery(`
                    INSERT INTO comment_mentions (comment_id, mentioned_user_id)
                    VALUES (?, ?)
                `, [commentId, mentionedUserId]);
            }
        }

        // Get the created comment with author info
        const comment = await getRow(`
            SELECT c.*, u.first_name, u.last_name, u.profile_picture
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [commentId]);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            comment: {
                id: comment.id,
                content: comment.content,
                author: {
                    id: comment.user_id,
                    name: `${comment.first_name} ${comment.last_name}`,
                    profilePicture: comment.profile_picture
                },
                createdAt: comment.created_at,
                reactions: {
                    like: 0,
                    love: 0
                },
                replyCount: 0
            }
        });
    } catch (error) {
        console.error('Create comment error:', error); // Add error logging
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create comment',
            error: error.message // Return error message for debugging
        });
    }
};

// Get post comments
const getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Get top-level comments
        const comments = await getAll(`
            SELECT c.*, u.first_name, u.last_name, u.profile_picture
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ? AND c.parent_comment_id IS NULL
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        `, [postId, limit, offset]);

        // Get replies and reactions for each comment
        const commentsWithDetails = await Promise.all(
            comments.map(async (comment) => {
                // Get reply count
                const replyCount = await getRow(`
                    SELECT COUNT(*) as count FROM comments WHERE parent_comment_id = ?
                `, [comment.id]);

                // Get top replies
                const replies = await getAll(`
                    SELECT c.*, u.first_name, u.last_name, u.profile_picture
                    FROM comments c
                    JOIN users u ON c.user_id = u.id
                    WHERE c.parent_comment_id = ?
                    ORDER BY c.created_at ASC
                    LIMIT 3
                `, [comment.id]);

                // Get reaction counts
                const reactions = await getRow(`
                    SELECT 
                        SUM(CASE WHEN reaction_type = 'like' THEN 1 ELSE 0 END) as like_count,
                        SUM(CASE WHEN reaction_type = 'love' THEN 1 ELSE 0 END) as love_count
                    FROM reactions 
                    WHERE comment_id = ?
                `, [comment.id]);

                return {
                    id: comment.id,
                    content: comment.content,
                    author: {
                        id: comment.user_id,
                        name: `${comment.first_name} ${comment.last_name}`,
                        profilePicture: comment.profile_picture
                    },
                    createdAt: comment.created_at,
                    reactions: {
                        like: reactions.like_count || 0,
                        love: reactions.love_count || 0
                    },
                    replyCount: replyCount.count,
                    replies: replies.map(reply => ({
                        id: reply.id,
                        content: reply.content,
                        author: {
                            id: reply.user_id,
                            name: `${reply.first_name} ${reply.last_name}`,
                            profilePicture: reply.profile_picture
                        },
                        createdAt: reply.created_at
                    }))
                };
            })
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            comments: commentsWithDetails
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get comments'
        });
    }
};

// Update comment
const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;
        const { content } = req.body;

        // Check if comment exists and belongs to user
        const comment = await getRow(`
            SELECT user_id FROM comments WHERE id = ?
        `, [commentId]);

        if (!comment) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Comment not found'
            });
        }

        if (comment.user_id !== userId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You can only edit your own comments'
            });
        }

        // Update comment
        await runQuery(`
            UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `, [content, commentId]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Comment updated successfully'
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update comment'
        });
    }
};

// Delete comment
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        // Check if comment exists and belongs to user
        const comment = await getRow(`
            SELECT user_id FROM comments WHERE id = ?
        `, [commentId]);

        if (!comment) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Comment not found'
            });
        }

        if (comment.user_id !== userId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You can only delete your own comments'
            });
        }

        // Delete comment (cascade will handle replies and reactions)
        await runQuery('DELETE FROM comments WHERE id = ?', [commentId]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to delete comment'
        });
    }
};

module.exports = {
    createComment,
    getPostComments,
    updateComment,
    deleteComment
};