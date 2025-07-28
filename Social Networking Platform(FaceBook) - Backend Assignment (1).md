# Social Networking Platform(FaceBook) - Backend Assignment

## Project Overview

Build a complete backend API for a social networking platform similar to Facebook. This system should handle user profiles, posts, comments, reactions, friendships, groups, pages, messaging, and notifications.

## Technical Requirements

- **Backend Framework**: Node.js with Express.js
- **Database**: SQLite for development (with proper schema design)
- **Authentication**: JWT tokens
- **API Documentation**: Clear endpoint documentation
- **Error Handling**: Proper error responses with appropriate HTTP status codes
- **Validation**: Input validation for all endpoints

## Database Design Requirements

### Entities to Model

You need to design a database schema that includes the following entities:

1. **Users**

   - Profile information
   - Privacy settings
   - Account status
   - Cover photo and profile picture
   - Bio and personal details

2. **Posts**

   - Text, images, videos
   - Privacy settings (public, friends, custom)
   - Location tags
   - Feeling/activity
   - Post type (status, photo, video, share)

3. **Comments**

   - Nested comments (replies)
   - Mentions
   - Comment reactions

4. **Reactions**

   - Multiple reaction types (like, love, haha, wow, sad, angry)
   - Post and comment reactions

5. **Friendships**

   - Friend requests
   - Friend status
   - Mutual friends
   - Friend lists (close friends, acquaintances)

6. **Groups**

   - Public/private groups
   - Group membership
   - Group roles (admin, moderator, member)
   - Group posts

7. **Pages**

   - Business/brand pages
   - Page categories
   - Page likes/followers
   - Page insights

8. **Messages**

   - Direct messages
   - Group conversations
   - Message status (sent, delivered, read)
   - Message reactions

9. **Notifications**

   - Different notification types
   - Read/unread status
   - Notification preferences

10. **Media**

    - Photos and videos
    - Albums
    - Tags in photos

11. **Events**

    - Event creation
    - RSVP status
    - Event posts

12. **Stories**
    - 24-hour stories
    - Story views
    - Story reactions

### Design Considerations

- **Relationships**: Complex many-to-many relationships
- **Privacy**: Granular privacy controls
- **Performance**: Optimize for feed generation
- **Scalability**: Design for millions of users
- **Real-time**: Consider real-time features
- **Media Storage**: Handle large media files
- **Search**: Efficient search implementation

## API Endpoints

### 1. Authentication APIs

#### POST /api/auth/register

Register a new user

```json
Request Body:
{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "dateOfBirth": "1990-01-15",
    "gender": "male"
}

Response:
{
    "success": true,
    "message": "Registration successful. Please verify your email.",
    "userId": 1,
    "token": "jwt_token_here"
}
```

#### POST /api/auth/login

User login

```json
Request Body:
{
    "email": "john@example.com",
    "password": "securePassword123"
}

Response:
{
    "success": true,
    "token": "jwt_token_here",
    "user": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "profilePicture": "profile_pic_url"
    }
}
```

#### POST /api/auth/logout

Logout from all devices

### 2. Profile APIs

#### GET /api/users/:userId

Get user profile

```json
Response:
{
    "success": true,
    "user": {
        "id": 1,
        "firstName": "John",
        "lastName": "Doe",
        "profilePicture": "profile_pic_url",
        "coverPhoto": "cover_photo_url",
        "bio": "Software developer | Travel enthusiast",
        "location": "Mumbai, India",
        "work": "Software Engineer at Tech Corp",
        "education": "IIT Bombay",
        "friendCount": 342,
        "mutualFriends": 15,
        "isFriend": false,
        "friendRequestSent": false
    }
}
```

#### PUT /api/users/profile

Update profile (requires authentication)

```json
Request Body:
{
    "bio": "Updated bio",
    "location": "New Delhi, India",
    "work": {
        "company": "New Tech Corp",
        "position": "Senior Developer"
    },
    "relationshipStatus": "single"
}
```

#### POST /api/users/profile-picture

Upload profile picture (requires authentication)

#### GET /api/users/:userId/friends

Get user's friends list

### 3. Post APIs

#### POST /api/posts

Create a post (requires authentication)

```json
Request Body:
{
    "content": "Having a great day at the beach! 🏖️",
    "media": [
        {
            "type": "photo",
            "url": "photo_url"
        }
    ],
    "privacy": "friends", // public, friends, only_me, custom
    "location": "Juhu Beach, Mumbai",
    "feeling": "happy",
    "tags": [2, 3, 4] // Tagged user IDs
}

Response:
{
    "success": true,
    "post": {
        "id": 101,
        "content": "Having a great day at the beach! 🏖️",
        "author": {
            "id": 1,
            "name": "John Doe",
            "profilePicture": "profile_pic_url"
        },
        "createdAt": "2024-03-20T10:30:00Z",
        "privacy": "friends",
        "reactions": {
            "like": 0,
            "love": 0,
            "total": 0
        },
        "commentCount": 0,
        "shareCount": 0
    }
}
```

#### GET /api/posts/feed

Get news feed (requires authentication)

```
Query Parameters:
- page: Page number
- limit: Posts per page

Response:
{
    "success": true,
    "posts": [
        {
            "id": 102,
            "type": "status",
            "content": "Just finished reading a great book!",
            "author": {
                "id": 3,
                "name": "Jane Smith",
                "profilePicture": "profile_pic_url"
            },
            "createdAt": "2024-03-20T09:15:00Z",
            "reactions": {
                "like": 23,
                "love": 5,
                "total": 28,
                "userReaction": "like"
            },
            "commentCount": 12,
            "shareCount": 2,
            "topComments": [...]
        }
    ],
    "hasMore": true
}
```

#### GET /api/posts/:postId

Get post details

#### PUT /api/posts/:postId

Update post (requires authentication)

#### DELETE /api/posts/:postId

Delete post (requires authentication)

### 4. Reaction APIs

#### POST /api/posts/:postId/react

React to a post (requires authentication)

```json
Request Body:
{
    "reaction": "love" // like, love, haha, wow, sad, angry
}
```

#### DELETE /api/posts/:postId/react

Remove reaction (requires authentication)

#### GET /api/posts/:postId/reactions

Get post reactions

```json
Response:
{
    "success": true,
    "reactions": {
        "summary": {
            "like": 45,
            "love": 12,
            "haha": 3,
            "total": 60
        },
        "users": [
            {
                "id": 2,
                "name": "Alice Johnson",
                "profilePicture": "profile_pic_url",
                "reaction": "love"
            }
        ]
    }
}
```

### 5. Comment APIs

#### POST /api/posts/:postId/comments

Comment on a post (requires authentication)

```json
Request Body:
{
    "content": "Great photo! Where is this place?",
    "parentCommentId": null, // For replies
    "mentions": [3] // Mentioned user IDs
}
```

#### GET /api/posts/:postId/comments

Get post comments

```json
Response:
{
    "success": true,
    "comments": [
        {
            "id": 201,
            "content": "Great photo! Where is this place?",
            "author": {
                "id": 2,
                "name": "Alice Johnson",
                "profilePicture": "profile_pic_url"
            },
            "createdAt": "2024-03-20T10:35:00Z",
            "reactions": {
                "like": 5,
                "love": 1
            },
            "replyCount": 2,
            "replies": [...]
        }
    ]
}
```

### 6. Friend APIs

#### POST /api/friends/request

Send friend request (requires authentication)

```json
Request Body:
{
    "userId": 5,
    "message": "Hey! Let's connect"
}
```

#### GET /api/friends/requests

Get friend requests (requires authentication)

```json
Response:
{
    "success": true,
    "requests": {
        "received": [
            {
                "id": 301,
                "from": {
                    "id": 8,
                    "name": "Bob Wilson",
                    "profilePicture": "profile_pic_url",
                    "mutualFriends": 3
                },
                "message": "Hey! We met at the conference",
                "sentAt": "2024-03-19T15:00:00Z"
            }
        ],
        "sent": [...]
    }
}
```

#### PUT /api/friends/request/:requestId

Accept/reject friend request

```json
Request Body:
{
    "action": "accept" // accept or reject
}
```

#### DELETE /api/friends/:friendId

Unfriend (requires authentication)

#### GET /api/friends/suggestions

Get friend suggestions

### 7. Group APIs

#### POST /api/groups

Create a group (requires authentication)

```json
Request Body:
{
    "name": "Mumbai Foodies",
    "description": "A group for food lovers in Mumbai",
    "privacy": "public", // public, private
    "category": "Food & Drink",
    "coverPhoto": "cover_photo_url"
}
```

#### GET /api/groups/:groupId

Get group details

#### POST /api/groups/:groupId/join

Join a group (requires authentication)

#### POST /api/groups/:groupId/posts

Post in a group (requires authentication)

#### GET /api/groups/:groupId/members

Get group members

#### PUT /api/groups/:groupId/members/:userId/role

Update member role (admin only)

### 8. Message APIs

#### POST /api/messages/send

Send a message (requires authentication)

```json
Request Body:
{
    "recipientId": 2, // For direct message
    "conversationId": null, // For group conversation
    "content": "Hey! How are you?",
    "attachments": []
}

Response:
{
    "success": true,
    "message": {
        "id": 401,
        "content": "Hey! How are you?",
        "sender": {
            "id": 1,
            "name": "John Doe"
        },
        "sentAt": "2024-03-20T11:00:00Z",
        "status": "sent"
    }
}
```

#### GET /api/messages/conversations

Get conversations (requires authentication)

#### GET /api/messages/conversation/:conversationId

Get conversation messages

#### PUT /api/messages/:messageId/read

Mark message as read

### 9. Notification APIs

#### GET /api/notifications

Get notifications (requires authentication)

```json
Response:
{
    "success": true,
    "notifications": [
        {
            "id": 501,
            "type": "friend_request",
            "message": "Bob Wilson sent you a friend request",
            "actor": {
                "id": 8,
                "name": "Bob Wilson",
                "profilePicture": "profile_pic_url"
            },
            "createdAt": "2024-03-20T10:00:00Z",
            "read": false,
            "actionUrl": "/friends/requests"
        }
    ],
    "unreadCount": 5
}
```

#### PUT /api/notifications/read

Mark notifications as read

#### GET /api/notifications/settings

Get notification preferences

#### PUT /api/notifications/settings

Update notification preferences

### 10. Search APIs

#### GET /api/search

Global search

```
Query Parameters:
- q: Search query
- type: all/people/posts/groups/pages

Response:
{
    "success": true,
    "results": {
        "people": [
            {
                "id": 10,
                "name": "John Smith",
                "profilePicture": "profile_pic_url",
                "mutualFriends": 2
            }
        ],
        "posts": [...],
        "groups": [...],
        "pages": [...]
    }
}
```

### 11. Story APIs

#### POST /api/stories

Create a story (requires authentication)

```json
Request Body:
{
    "type": "photo", // photo, video, text
    "content": "story_media_url",
    "text": "At the concert! 🎵",
    "duration": 5 // seconds
}
```

#### GET /api/stories/feed

Get stories feed (requires authentication)

#### GET /api/stories/:storyId/views

Get story views (story owner only)

### 12. Page APIs

#### POST /api/pages

Create a page (requires authentication)

```json
Request Body:
{
    "name": "My Business",
    "category": "Local Business",
    "description": "Best coffee in town",
    "contact": {
        "phone": "+919876543210",
        "email": "contact@mybusiness.com",
        "website": "www.mybusiness.com"
    }
}
```

#### POST /api/pages/:pageId/like

Like/unlike a page

#### GET /api/pages/:pageId/insights

Get page insights (page admin only)

### 13. Event APIs

#### POST /api/events

Create an event (requires authentication)

```json
Request Body:
{
    "name": "Mumbai Meetup 2024",
    "description": "Annual tech meetup",
    "startDate": "2024-04-15T10:00:00Z",
    "endDate": "2024-04-15T18:00:00Z",
    "location": "Convention Center, Mumbai",
    "privacy": "public"
}
```

#### POST /api/events/:eventId/rsvp

RSVP to event

```json
Request Body:
{
    "status": "going" // going, interested, not_going
}
```

## Implementation Requirements

### 1. Middleware

- Authentication middleware using JWT
- Privacy check middleware
- File upload middleware
- Request validation middleware
- Rate limiting middleware
- Error handling middleware

### 2. Security

- Password hashing using bcrypt
- Input sanitization
- SQL injection prevention
- Privacy controls enforcement
- Content moderation checks
- Rate limiting

### 3. Features to Implement

- News feed algorithm (basic)
- Friend suggestions algorithm
- Privacy settings enforcement
- Real-time notifications
- Message delivery status
- Media upload and processing
- Search functionality
- Mention system
- Share functionality
- Blocking users

### 4. Error Handling

Implement proper error responses:

- 400 Bad Request - Invalid input
- 401 Unauthorized - Missing/invalid token
- 403 Forbidden - Privacy restriction
- 404 Not Found - Resource not found
- 409 Conflict - Already friends/member
- 413 Payload Too Large - File too large
- 429 Too Many Requests - Rate limit exceeded
- 500 Internal Server Error

## Important Considerations

1. **Privacy Controls**: Implement granular privacy settings
2. **Feed Algorithm**: Basic chronological with friend posts
3. **Media Handling**: Support photos and videos
4. **Real-time Features**: Consider notification system
5. **Search Optimization**: Efficient user/content search
6. **Content Moderation**: Basic inappropriate content checks
7. **Performance**: Optimize for large friend lists

## Deliverables

1. Complete source code with proper folder structure
2. SQLite database with:
   - Complete schema design (CREATE TABLE statements)
   - Seed data including:
     - Sample users with profiles
     - Friend relationships
     - Posts with reactions and comments
     - Groups and pages
     - Messages and notifications
   - Documentation explaining your design decisions
3. Postman collection with all API endpoints
4. README.md with:
   - Setup instructions
   - Database design explanation
   - API documentation
   - Assumptions made

## Folder Structure

```
social-network-backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── postController.js
│   │   ├── friendController.js
│   │   ├── groupController.js
│   │   ├── messageController.js
│   │   ├── notificationController.js
│   │   └── storyController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── privacy.js
│   │   ├── upload.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── user.js
│   │   ├── post.js
│   │   ├── friendship.js
│   │   ├── group.js
│   │   └── ...
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── postRoutes.js
│   │   ├── friendRoutes.js
│   │   └── ...
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── feed.js
│   │   └── constants.js
│   └── app.js
├── database/
│   ├── schema.sql
│   └── seeds.sql
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Bonus Points

- Implement basic feed algorithm
- Add hashtag support
- Create live video metadata support
- Implement user blocking
- Add marketplace feature
- Create dating feature
- Implement memories (on this day)
- Add polls in posts
- Create admin moderation panel
- Deploy the application

## Submission Guidelines

1. Push your code to a GitHub repository
2. Include clear setup instructions in README
3. Provide sample API requests in Postman collection
4. Document your database design decisions
5. Include comprehensive seed data for testing
6. Mention any assumptions made during development

Good luck! This assignment will test your ability to build a complex social networking platform with multiple features, privacy controls, and social interactions.
