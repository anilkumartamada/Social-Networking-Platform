# Social Networking Platform API

A complete backend API for a social networking platform similar to Facebook, built with Node.js, Express.js, and SQLite.

## Features

- **User Authentication**: JWT-based authentication with registration and login
- **User Profiles**: Complete user profile management with privacy settings
- **Posts**: Create, read, update, and delete posts with privacy controls
- **Reactions**: Like, love, haha, wow, sad, and angry reactions on posts
- **Comments**: Nested comments with replies and mentions
- **Friendships**: Friend requests, accept/reject, and friend suggestions
- **News Feed**: Personalized feed with posts from friends
- **Search**: User search functionality
- **File Uploads**: Support for profile pictures and post media
- **Security**: Rate limiting, input validation, and security headers

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite with proper schema design
- **Authentication**: JWT tokens
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting
- **File Upload**: Multer

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-network-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   DB_PATH=./database/social_network.db
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Set up the database**
   ```bash
   npm run setup-db
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Logout

### Users

- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/profile` - Update profile (authenticated)
- `GET /api/users/:userId/friends` - Get user's friends
- `GET /api/users/search` - Search users (authenticated)

### Posts

- `POST /api/posts` - Create a post (authenticated)
- `GET /api/posts/feed` - Get news feed (authenticated)
- `GET /api/posts/:postId` - Get post details
- `PUT /api/posts/:postId` - Update post (authenticated)
- `DELETE /api/posts/:postId` - Delete post (authenticated)

### Reactions

- `POST /api/posts/:postId/react` - React to a post (authenticated)
- `DELETE /api/posts/:postId/react` - Remove reaction (authenticated)
- `GET /api/posts/:postId/reactions` - Get post reactions

### Comments

- `POST /api/posts/:postId/comments` - Comment on a post (authenticated)
- `GET /api/posts/:postId/comments` - Get post comments
- `PUT /api/comments/:commentId` - Update comment (authenticated)
- `DELETE /api/comments/:commentId` - Delete comment (authenticated)

### Friends

- `POST /api/friends/request` - Send friend request (authenticated)
- `GET /api/friends/requests` - Get friend requests (authenticated)
- `PUT /api/friends/request/:requestId` - Accept/reject friend request (authenticated)
- `DELETE /api/friends/:friendId` - Unfriend (authenticated)
- `GET /api/friends/suggestions` - Get friend suggestions (authenticated)

## Database Schema

The application uses a comprehensive SQLite database with the following main tables:

- **users**: User profiles and authentication
- **posts**: User posts with privacy settings
- **comments**: Post comments with nested replies
- **reactions**: Post and comment reactions
- **friendships**: Friend relationships and requests
- **media**: Post media files
- **notifications**: User notifications
- **conversations**: Messaging conversations
- **messages**: Individual messages
- **groups**: User groups
- **pages**: Business/brand pages
- **stories**: 24-hour stories
- **events**: User events

## API Examples

### Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### Create a post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Hello, world!",
    "privacy": "public"
  }'
```

### Get news feed
```bash
curl -X GET http://localhost:3000/api/posts/feed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for password security
- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **SQL Injection Prevention**: Parameterized queries
- **File Upload Security**: File type and size validation

## Error Handling

The API returns consistent error responses with appropriate HTTP status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `409` - Conflict (resource already exists)
- `413` - Payload Too Large (file too large)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Development

### Project Structure
```
social-network-backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── postController.js
│   │   ├── reactionController.js
│   │   ├── commentController.js
│   │   └── friendController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── upload.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── postRoutes.js
│   │   ├── reactionRoutes.js
│   │   ├── commentRoutes.js
│   │   └── friendRoutes.js
│   ├── utils/
│   │   ├── helpers.js
│   │   └── constants.js
│   └── app.js
├── database/
│   ├── schema.sql
│   └── setup.js
├── uploads/
├── .env
├── .gitignore
├── package.json
└── README.md
```

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run setup-db` - Set up the database schema
- `npm test` - Run tests (when implemented)

## Testing

The API can be tested using tools like:
- Postman
- curl
- Insomnia
- Thunder Client

## Deployment

1. Set environment variables for production
2. Use a production database (PostgreSQL, MySQL)
3. Set up proper logging
4. Configure reverse proxy (nginx)
5. Use PM2 or similar process manager
6. Set up SSL/TLS certificates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository. 