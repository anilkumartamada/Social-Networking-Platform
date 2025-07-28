// User account statuses
const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    DELETED: 'deleted'
};

// Post privacy settings
const POST_PRIVACY = {
    PUBLIC: 'public',
    FRIENDS: 'friends',
    ONLY_ME: 'only_me',
    CUSTOM: 'custom'
};

// Post types
const POST_TYPES = {
    STATUS: 'status',
    PHOTO: 'photo',
    VIDEO: 'video',
    SHARE: 'share'
};

// Reaction types
const REACTION_TYPES = {
    LIKE: 'like',
    LOVE: 'love',
    HAHA: 'haha',
    WOW: 'wow',
    SAD: 'sad',
    ANGRY: 'angry'
};

// Friendship statuses
const FRIENDSHIP_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    BLOCKED: 'blocked'
};

// Group privacy settings
const GROUP_PRIVACY = {
    PUBLIC: 'public',
    PRIVATE: 'private'
};

// Group member roles
const GROUP_ROLES = {
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    MEMBER: 'member'
};

// Conversation types
const CONVERSATION_TYPES = {
    DIRECT: 'direct',
    GROUP: 'group'
};

// Message statuses
const MESSAGE_STATUS = {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read'
};

// Notification types
const NOTIFICATION_TYPES = {
    FRIEND_REQUEST: 'friend_request',
    FRIEND_ACCEPTED: 'friend_accepted',
    POST_LIKE: 'post_like',
    POST_COMMENT: 'post_comment',
    POST_SHARE: 'post_share',
    COMMENT_LIKE: 'comment_like',
    COMMENT_REPLY: 'comment_reply',
    GROUP_INVITE: 'group_invite',
    GROUP_POST: 'group_post',
    MESSAGE: 'message',
    STORY_MENTION: 'story_mention',
    EVENT_INVITE: 'event_invite'
};

// Story types
const STORY_TYPES = {
    PHOTO: 'photo',
    VIDEO: 'video',
    TEXT: 'text'
};

// Event RSVP statuses
const EVENT_RSVP_STATUS = {
    GOING: 'going',
    INTERESTED: 'interested',
    NOT_GOING: 'not_going'
};

// File upload limits
const UPLOAD_LIMITS = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
    MAX_IMAGES_PER_POST: 10,
    MAX_VIDEOS_PER_POST: 1
};

// HTTP status codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    PAYLOAD_TOO_LARGE: 413,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500
};

// Rate limiting
const RATE_LIMITS = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
};

// Pagination defaults
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50
};

module.exports = {
    USER_STATUS,
    POST_PRIVACY,
    POST_TYPES,
    REACTION_TYPES,
    FRIENDSHIP_STATUS,
    GROUP_PRIVACY,
    GROUP_ROLES,
    CONVERSATION_TYPES,
    MESSAGE_STATUS,
    NOTIFICATION_TYPES,
    STORY_TYPES,
    EVENT_RSVP_STATUS,
    UPLOAD_LIMITS,
    HTTP_STATUS,
    RATE_LIMITS,
    PAGINATION
}; 