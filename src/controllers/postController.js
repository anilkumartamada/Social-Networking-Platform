const { runQuery, getRow, getAll } = require('../config/database');
const { canViewPost, formatDate } = require('../utils/helpers');
const { HTTP_STATUS } = require('../utils/constants');

// Create a post
const createPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, privacy = 'public', location, feeling, tags } = req.body;

        // Insert post
        const postResult = await runQuery(`
            INSERT INTO posts (user_id, content, privacy, location, feeling)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, content, privacy, location, feeling]);

        const postId = postResult.id;

        // Handle user tags if provided
        if (tags && Array.isArray(tags) && tags.length > 0) {
            for (const taggedUserId of tags) {
                await runQuery(`
                    INSERT INTO post_tags (post_id, tagged_user_id)
                    VALUES (?, ?)
                `, [postId, taggedUserId]);
            }
        }

        // Get the created post with author info
        const post = await getRow(`
            SELECT p.*, u.first_name, u.last_name, u.profile_picture
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [postId]);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            post: {
                id: post.id,
                content: post.content,
                author: {
                    id: post.user_id,
                    name: `${post.first_name} ${post.last_name}`,
                    profilePicture: post.profile_picture
                },
                createdAt: post.created_at,
                privacy: post.privacy,
                reactions: {
                    like: 0,
                    love: 0,
                    total: 0
                },
                commentCount: 0,
                shareCount: 0
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create post'
        });
    }
};

// Get news feed
const getFeed = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // Get posts from user and their friends
        const posts = await getAll(`
            SELECT DISTINCT p.*, u.first_name, u.last_name, u.profile_picture
            FROM posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN friendships f ON (f.user_id = p.user_id OR f.friend_id = p.user_id)
            WHERE (p.user_id = ? OR 
                   (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted')
            AND p.privacy IN ('public', 'friends')
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, userId, userId, limit, offset]);

        // Get reactions and comments for each post
        const postsWithDetails = await Promise.all(
            posts.map(async (post) => {
                // Get reaction counts
                const reactions = await getRow(`
                    SELECT 
                        SUM(CASE WHEN reaction_type = 'like' THEN 1 ELSE 0 END) as like_count,
                        SUM(CASE WHEN reaction_type = 'love' THEN 1 ELSE 0 END) as love_count,
                        COUNT(*) as total_reactions
                    FROM reactions 
                    WHERE post_id = ?
                `, [post.id]);

                // Get user's reaction
                const userReaction = await getRow(`
                    SELECT reaction_type FROM reactions 
                    WHERE post_id = ? AND user_id = ?
                `, [post.id, userId]);

                // Get comment count
                const commentCount = await getRow(`
                    SELECT COUNT(*) as count FROM comments WHERE post_id = ?
                `, [post.id]);

                return {
                    id: post.id,
                    type: post.post_type,
                    content: post.content,
                    author: {
                        id: post.user_id,
                        name: `${post.first_name} ${post.last_name}`,
                        profilePicture: post.profile_picture
                    },
                    createdAt: post.created_at,
                    reactions: {
                        like: reactions.like_count || 0,
                        love: reactions.love_count || 0,
                        total: reactions.total_reactions || 0,
                        userReaction: userReaction?.reaction_type || null
                    },
                    commentCount: commentCount.count,
                    shareCount: 0
                };
            })
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            posts: postsWithDetails,
            hasMore: posts.length === parseInt(limit)
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get feed'
        });
    }
};

// Get post details
const getPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user?.id;

        const post = await getRow(`
            SELECT p.*, u.first_name, u.last_name, u.profile_picture
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?
        `, [postId]);

        if (!post) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Post not found'
            });
        }

        // Check if user can view this post
        if (userId && !(await canViewPost(req.db, post, userId))) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You cannot view this post'
            });
        }

        // Get reactions
        const reactions = await getRow(`
            SELECT 
                SUM(CASE WHEN reaction_type = 'like' THEN 1 ELSE 0 END) as like_count,
                SUM(CASE WHEN reaction_type = 'love' THEN 1 ELSE 0 END) as love_count,
                COUNT(*) as total_reactions
            FROM reactions 
            WHERE post_id = ?
        `, [postId]);

        // Get user's reaction
        let userReaction = null;
        if (userId) {
            const userReactionResult = await getRow(`
                SELECT reaction_type FROM reactions 
                WHERE post_id = ? AND user_id = ?
            `, [postId, userId]);
            userReaction = userReactionResult?.reaction_type;
        }

        // Get comment count
        const commentCount = await getRow(`
            SELECT COUNT(*) as count FROM comments WHERE post_id = ?
        `, [postId]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            post: {
                id: post.id,
                content: post.content,
                author: {
                    id: post.user_id,
                    name: `${post.first_name} ${post.last_name}`,
                    profilePicture: post.profile_picture
                },
                createdAt: post.created_at,
                privacy: post.privacy,
                location: post.location,
                feeling: post.feeling,
                reactions: {
                    like: reactions.like_count || 0,
                    love: reactions.love_count || 0,
                    total: reactions.total_reactions || 0,
                    userReaction
                },
                commentCount: commentCount.count
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get post'
        });
    }
};

// Update post
const updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;
        const { content, privacy, location, feeling } = req.body;

        // Check if post exists and belongs to user
        const post = await getRow(`
            SELECT user_id FROM posts WHERE id = ?
        `, [postId]);

        if (!post) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Post not found'
            });
        }

        if (post.user_id !== userId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You can only edit your own posts'
            });
        }

        // Update post
        const updateFields = [];
        const updateValues = [];

        if (content !== undefined) {
            updateFields.push('content = ?');
            updateValues.push(content);
        }

        if (privacy !== undefined) {
            updateFields.push('privacy = ?');
            updateValues.push(privacy);
        }

        if (location !== undefined) {
            updateFields.push('location = ?');
            updateValues.push(location);
        }

        if (feeling !== undefined) {
            updateFields.push('feeling = ?');
            updateValues.push(feeling);
        }

        if (updateFields.length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'No fields to update'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(postId);

        await runQuery(`
            UPDATE posts SET ${updateFields.join(', ')} WHERE id = ?
        `, updateValues);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Post updated successfully'
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update post'
        });
    }
};

// Delete post
const deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        // Check if post exists and belongs to user
        const post = await getRow(`
            SELECT user_id FROM posts WHERE id = ?
        `, [postId]);

        if (!post) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Post not found'
            });
        }

        if (post.user_id !== userId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You can only delete your own posts'
            });
        }

        // Delete post (cascade will handle related data)
        await runQuery('DELETE FROM posts WHERE id = ?', [postId]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to delete post'
        });
    }
};

module.exports = {
    createPost,
    getFeed,
    getPost,
    updatePost,
    deletePost
}; 