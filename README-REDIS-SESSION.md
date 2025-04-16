# Redis Session Management

This project implements Redis-based session management for both user and admin authentication, with support for preventing multiple simultaneous logins.

## Features

- Single-device login policy (with optional force login)
- Redis-based session storage
- JWT token with unique session IDs
- Session activity logging
- Efficient middleware for authentication
- Graceful handling of Redis connection errors
- Automatic JWT secret generation

## Setup

1. Ensure Redis is installed and running on your system or accessible via a URL.
2. Update your `.env` file with the Redis configuration:

```
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_SESSION_TTL=86400  # Session TTL in seconds (24 hours)
```

3. Make sure JWT_SECRET is set in your `.env` file. If it's not set, the application will automatically generate a secure secret on startup. You can also manually generate a secret with:

```bash
npm run generate-jwt-secret
```

## JWT Security

The application uses JSON Web Tokens (JWT) for authentication with enhanced security features:

- Tokens include a unique `tokenId` that is validated against the stored session
- JWT secrets are generated using cryptographically secure random values
- Automatic secret generation on first run if JWT_SECRET is empty in .env
- Each token is linked to a specific session stored in Redis

Best practices:
- Keep your JWT secret confidential
- Store the secret in environment variables, not in code
- Do not commit the .env file to version control
- Consider rotating secrets periodically in production environments

## How It Works

### Session Storage

Sessions are stored in Redis with the following structure:

- Key: `session:{type}:{id}` where `type` is either "user" or "admin" and `id` is the user/admin ID
- Value: JSON object containing:
  - `tokenId`: Unique token ID
  - `userAgent`: Browser/client info
  - `ip`: IP address of login
  - `loginTime`: Timestamp of login

### Authentication Flow

1. **Login**:
   - User provides credentials
   - System checks for existing session
   - If a session exists and `forceLogin` is false, login is rejected
   - If `forceLogin` is true, existing session is terminated
   - New JWT token is generated with a unique `tokenId`
   - Session is stored in Redis with the `tokenId`

2. **Request Authentication**:
   - Token is extracted from Authorization header or cookies
   - Token is verified and decoded
   - User/Admin existence is verified
   - Session is retrieved from Redis using user/admin ID
   - Session `tokenId` is compared with token's `tokenId`
   - If all checks pass, request proceeds

3. **Logout**:
   - Session is removed from Redis
   - Cookie is invalidated
   - Activity is logged

## Testing in Postman

### Admin Login

1. Create a POST request to `/api/v1/admin/auth/login`
2. Include in the request body:
   ```json
   {
     "email": "admin@example.com",
     "password": "password123",
     "forceLogin": false
   }
   ```
3. If the admin is already logged in, you'll receive a 403 response with `canForceLogin: true`
4. To force login, set `forceLogin: true` in the request body

### Admin Logout

1. Create a GET request to `/api/v1/admin/auth/logout`
2. Include the token in one of these ways:
   - Add an Authorization header: `Authorization: Bearer <token>`
   - Add a cookie named `admin_token` with the token value

## Implementation Details

### Key Files

- `src/utils/redisClient.js`: Redis client and session management functions
- `src/middleware/auth.js`: User authentication middleware
- `src/middleware/adminAuth.js`: Admin authentication middleware
- `src/controllers/user/authController.js`: User authentication controller
- `src/controllers/admin/authController.js`: Admin authentication controller
- `src/scripts/generateJwtSecret.js`: Logic for generating and updating JWT secrets

### Error Handling

The system is designed to gracefully handle Redis connection issues:
- In development mode, the application will continue to run even if Redis is unavailable
- In production mode, the application will fail if Redis cannot be connected

## Extending the System

To extend this system with additional features:

1. **Session Analytics**: Store additional session data for analytics purposes
2. **Session Listing**: Add endpoints to list active sessions for admins
3. **Session Termination**: Allow admins to terminate other users' sessions
4. **Rate Limiting**: Implement rate limiting with Redis for login attempts 