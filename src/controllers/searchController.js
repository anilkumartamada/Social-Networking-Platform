const { runQuery, getRow, getAll } = require('../config/database');
const { HTTP_STATUS } = require('../utils/constants');

// Global search
const globalSearch = async (req, res) => {
    try {
        const { q, type = 'all', page = 1, limit = 10 } = req.query;
        const userId = req.user?.id;
        
        if (!q || q.trim().length < 2) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Search query must be at least 2 characters long'
            });
        }

        const searchTerm = `%${q.trim()}%`;
        const offset = (page - 1) * limit;
        const results = {};

        // Search people
        if (type === 'all' || type === 'people') {
            const people = await getAll(`
                SELECT u.id, u.first_name, u.last_name, u.profile_picture, u.bio,
                       CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as is_friend,
                       COUNT(DISTINCT mf.friend_id) as mutual_friends
                FROM users u
                LEFT JOIN friendships f ON (
                    (f.user_id = ? AND f.friend_id = u.id) OR 
                    (f.friend_id = ? AND f.user_id = u.id)
                ) AND f.status = 'accepted'
                LEFT JOIN friendships mf ON (
                    (mf.user_id = u.id OR mf.friend_id = u.id) AND
                    mf.status = 'accepted' AND
                    (mf.user_id IN (
                        SELECT CASE WHEN user_id = ? THEN friend_id ELSE user_id END
                        FROM friendships WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'
                    ) OR mf.friend_id IN (
                        SELECT CASE WHEN user_id = ? THEN friend_id ELSE user_id END
                        FROM friendships WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'
                    ))
                )
                WHERE (u.first_name LIKE ? OR u.last_name LIKE ? OR 
                       (u.first_name || ' ' || u.last_name) LIKE ?)
                AND u.id != ? AND u.account_status = 'active'
                GROUP BY u.id
                ORDER BY is_friend DESC, mutual_friends DESC
                LIMIT ? OFFSET ?
            `, [
                userId || 0, userId || 0, userId || 0, userId || 0, userId || 0,
                userId || 0, userId || 0, userId || 0,
                searchTerm, searchTerm, searchTerm, userId || 0, limit, offset
            ]);

            results.people = people.map(person => ({
                id: person.id,
                name: `${person.first_name} ${person.last_name}`,
                profilePicture: person.profile_picture,
                bio: person.bio,
                isFriend: person.is_friend === 1,
                mutualFriends: person.mutual_friends
            }));
        }

        // Search posts
        if (type === 'all' || type === 'posts') {
            const posts = await getAll(`
                SELECT p.id, p.content, p.created_at,
                       u.id as author_id, u.first_name, u.last_name, u.profile_picture,
                       COUNT(DISTINCT r.id) as reaction_count,
                       COUNT(DISTINCT c.id) as comment_count
                FROM posts p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN reactions r ON p.id = r.post_id
                LEFT JOIN comments c ON p.id = c.post_id
                WHERE p.content LIKE ? AND p.privacy = 'public'
                GROUP BY p.id
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?
            `, [searchTerm, limit, offset]);

            results.posts = posts.map(post => ({
                id: post.id,
                content: post.content,
                author: {
                    id: post.author_id,
                    name: `${post.first_name} ${post.last_name}`,
                    profilePicture: post.profile_picture
                },
                createdAt: post.created_at,
                reactionCount: post.reaction_count,
                commentCount: post.comment_count
            }));
        }

        // Search groups
        if (type === 'all' || type === 'groups') {
            const groups = await getAll(`
                SELECT g.id, g.name, g.description, g.privacy, g.category, g.cover_photo,
                       COUNT(DISTINCT gm.id) as member_count
                FROM groups g
                LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.status = 'active'
                WHERE (g.name LIKE ? OR g.description LIKE ?) AND g.privacy = 'public'
                GROUP BY g.id
                ORDER BY member_count DESC
                LIMIT ? OFFSET ?
            `, [searchTerm, searchTerm, limit, offset]);

            results.groups = groups.map(group => ({
                id: group.id,
                name: group.name,
                description: group.description,
                privacy: group.privacy,
                category: group.category,
                coverPhoto: group.cover_photo,
                memberCount: group.member_count
            }));
        }

        // Search pages
        if (type === 'all' || type === 'pages') {
            const pages = await getAll(`
                SELECT p.id, p.name, p.description, p.category, p.cover_photo,
                       COUNT(DISTINCT pl.id) as like_count
                FROM pages p
                LEFT JOIN page_likes pl ON p.id = pl.page_id
                WHERE p.name LIKE ? OR p.description LIKE ?
                GROUP BY p.id
                ORDER BY like_count DESC
                LIMIT ? OFFSET ?
            `, [searchTerm, searchTerm, limit, offset]);

            results.pages = pages.map(page => ({
                id: page.id,
                name: page.name,
                description: page.description,
                category: page.category,
                coverPhoto: page.cover_photo,
                likeCount: page.like_count
            }));
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            query: q,
            results
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Search failed'
        });
    }
};

module.exports = {
    globalSearch
};