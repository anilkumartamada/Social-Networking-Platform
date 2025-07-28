const { runQuery, getRow, getAll } = require('../config/database');
const { HTTP_STATUS } = require('../utils/constants');

// Send a message
const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { recipientId, conversationId, content, attachments } = req.body;

        let finalConversationId = conversationId;

        // If no conversation ID, create or find direct message conversation
        if (!conversationId && recipientId) {
            // Check if conversation already exists
            const existingConversation = await getRow(`
                SELECT c.id FROM conversations c
                JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
                JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
                WHERE c.type = 'direct' 
                AND cp1.user_id = ? AND cp2.user_id = ?
                AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) = 2
            `, [senderId, recipientId]);

            if (existingConversation) {
                finalConversationId = existingConversation.id;
            } else {
                // Create new conversation
                const conversationResult = await runQuery(`
                    INSERT INTO conversations (type) VALUES ('direct')
                `);
                finalConversationId = conversationResult.id;

                // Add participants
                await runQuery(`
                    INSERT INTO conversation_participants (conversation_id, user_id)
                    VALUES (?, ?), (?, ?)
                `, [finalConversationId, senderId, finalConversationId, recipientId]);
            }
        }

        // Insert message
        const messageResult = await runQuery(`
            INSERT INTO messages (conversation_id, sender_id, content, attachments)
            VALUES (?, ?, ?, ?)
        `, [finalConversationId, senderId, content, JSON.stringify(attachments || [])]);

        // Update conversation last message
        await runQuery(`
            UPDATE conversations 
            SET last_message_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [messageResult.id, finalConversationId]);

        // Get sender info
        const sender = await getRow(`
            SELECT first_name, last_name FROM users WHERE id = ?
        `, [senderId]);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: {
                id: messageResult.id,
                content,
                sender: {
                    id: senderId,
                    name: `${sender.first_name} ${sender.last_name}`
                },
                conversationId: finalConversationId,
                sentAt: new Date().toISOString(),
                status: 'sent'
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to send message'
        });
    }
};

// Get conversations
const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const conversations = await getAll(`
            SELECT DISTINCT c.id, c.type, c.updated_at,
                   m.content as last_message,
                   sender.first_name as sender_first_name,
                   sender.last_name as sender_last_name,
                   CASE 
                       WHEN c.type = 'direct' THEN 
                           (SELECT u.first_name || ' ' || u.last_name 
                            FROM users u 
                            JOIN conversation_participants cp ON u.id = cp.user_id 
                            WHERE cp.conversation_id = c.id AND u.id != ?)
                       ELSE c.name
                   END as conversation_name
            FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            LEFT JOIN messages m ON c.last_message_id = m.id
            LEFT JOIN users sender ON m.sender_id = sender.id
            WHERE cp.user_id = ?
            ORDER BY c.updated_at DESC
            LIMIT ? OFFSET ?
        `, [userId, userId, limit, offset]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            conversations: conversations.map(conv => ({
                id: conv.id,
                type: conv.type,
                name: conv.conversation_name,
                lastMessage: {
                    content: conv.last_message,
                    sender: conv.sender_first_name ? 
                        `${conv.sender_first_name} ${conv.sender_last_name}` : null
                },
                updatedAt: conv.updated_at
            }))
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get conversations'
        });
    }
};

// Get conversation messages
const getConversationMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        // Check if user is participant
        const participant = await getRow(`
            SELECT id FROM conversation_participants 
            WHERE conversation_id = ? AND user_id = ?
        `, [conversationId, userId]);

        if (!participant) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You are not a participant in this conversation'
            });
        }

        // Get messages
        const messages = await getAll(`
            SELECT m.*, u.first_name, u.last_name, u.profile_picture
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at DESC
            LIMIT ? OFFSET ?
        `, [conversationId, limit, offset]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            messages: messages.map(msg => ({
                id: msg.id,
                content: msg.content,
                sender: {
                    id: msg.sender_id,
                    name: `${msg.first_name} ${msg.last_name}`,
                    profilePicture: msg.profile_picture
                },
                sentAt: msg.created_at,
                status: msg.status,
                attachments: JSON.parse(msg.attachments || '[]')
            })).reverse()
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get messages'
        });
    }
};

// Mark message as read
const markAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        // Update message status
        await runQuery(`
            UPDATE messages SET status = 'read' 
            WHERE id = ? AND conversation_id IN (
                SELECT conversation_id FROM conversation_participants 
                WHERE user_id = ?
            )
        `, [messageId, userId]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Message marked as read'
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to mark message as read'
        });
    }
};

module.exports = {
    sendMessage,
    getConversations,
    getConversationMessages,
    markAsRead
};