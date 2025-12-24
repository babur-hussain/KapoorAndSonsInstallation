# JWT Authentication System

## Overview

The Kapoor & Sons Demo Booking App now includes a comprehensive JWT (JSON Web Token) authentication system that protects all booking routes. Only authenticated users can create, view, or update bookings.

## Features

- ✅ **User Registration** - Create new user accounts with email/password
- ✅ **User Login** - Authenticate and receive JWT token
- ✅ **Protected Routes** - All booking routes require authentication
- ✅ **Token Verification** - Middleware validates JWT tokens
- ✅ **Password Hashing** - Secure password storage with bcrypt
- ✅ **User Profile** - Get and update user information
- ✅ **Password Change** - Secure password update functionality
- ✅ **Role-Based Access** - Support for user and admin roles

## Architecture

### User Model (`src/models/User.js`)

```javascript
{
  name: String,           // User's full name
  email: String,          // Unique email (used for login)
  password: String,       // Hashed password (bcrypt)
  phone: String,          // Phone number (optional)
  role: String,           // "user" or "admin"
  isActive: Boolean,      // Account status
  timestamps: true        // createdAt, updatedAt
}
```

**Features:**
- Email validation with regex
- Password hashing before save (bcrypt)
- Password comparison method
- Password excluded from queries by default
- Minimum password length: 6 characters

### Auth Middleware (`src/middleware/authMiddleware.js`)

#### `protect` Middleware

Protects routes by requiring valid JWT token in Authorization header.

**Usage:**
```javascript
import { protect } from "../middleware/authMiddleware.js";

router.get("/protected-route", protect, (req, res) => {
  // req.user is available here
  console.log(req.user.email);
});
```

**Flow:**
1. Extract token from `Authorization: Bearer <token>` header
2. Verify token using JWT_SECRET
3. Fetch user from database (excluding password)
4. Check if user exists and is active
5. Attach user to `req.user`
6. Continue to route handler

**Error Responses:**
- `401` - No token provided
- `401` - Invalid token
- `401` - Token expired
- `401` - User not found
- `401` - User account inactive

#### `optionalProtect` Middleware

Attaches user if token is valid, but doesn't require it. Useful for routes that work differently for authenticated vs unauthenticated users.

#### `adminOnly` Middleware

Requires user to be authenticated and have admin role. Must be used after `protect` middleware.

**Usage:**
```javascript
router.delete("/admin-only", protect, adminOnly, (req, res) => {
  // Only admins can access this route
});
```

#### `generateToken` Function

Generates JWT token for a user ID.

**Parameters:**
- `userId` - User ID to encode in token
- `expiresIn` - Token expiration time (default: 30 days)

**Returns:** JWT token string

## API Endpoints

### Authentication Routes (`/api/v1/auth`)

#### 1. Register User

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+919876543210"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "690ce76462da5e31b0b857f0",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "role": "user"
  }
}
```

**Errors:**
- `400` - Missing required fields
- `400` - Email already exists
- `500` - Registration failed

#### 2. Login User

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "690ce76462da5e31b0b857f0",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "role": "user"
  }
}
```

**Errors:**
- `400` - Missing email or password
- `401` - Invalid email or password
- `401` - Account inactive
- `500` - Login failed

#### 3. Get Current User Profile

**Endpoint:** `GET /api/v1/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "690ce76462da5e31b0b857f0",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "role": "user",
    "createdAt": "2025-11-06T18:22:28.140Z"
  }
}
```

**Errors:**
- `401` - Not authorized (no token or invalid token)
- `500` - Failed to get profile

#### 4. Update User Profile

**Endpoint:** `PUT /api/v1/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+919999999999"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "690ce76462da5e31b0b857f0",
    "name": "John Updated",
    "email": "john@example.com",
    "phone": "+919999999999",
    "role": "user"
  }
}
```

**Errors:**
- `401` - Not authorized
- `404` - User not found
- `500` - Update failed

#### 5. Change Password

**Endpoint:** `POST /api/v1/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:**
- `400` - Missing current or new password
- `401` - Current password incorrect
- `404` - User not found
- `500` - Password change failed

### Protected Booking Routes (`/api/v1/bookings`)

All booking routes now require authentication:

- `POST /api/v1/bookings` - Create booking (requires token)
- `GET /api/v1/bookings` - Get all bookings (requires token)
- `GET /api/v1/bookings/:id` - Get booking by ID (requires token)
- `PATCH /api/v1/bookings/:id` - Update booking status (requires token)

## Environment Variables

### `.env`

```bash
# JWT Authentication
JWT_SECRET=kapoor_sons_demo_jwt_secret_key_2025_very_strong_and_secure
```

**Important:** Change the JWT_SECRET to a strong, random string in production!

### `.env.example`

```bash
# JWT Authentication
# Generate a strong secret key for production
JWT_SECRET=your_jwt_secret_key_here_change_in_production
```

## Usage Examples

### 1. Register a New User

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+919876543210"
  }'
```

**Save the token from the response!**

### 2. Login

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Access Protected Route (Create Booking)

```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:4000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Customer Name",
    "phone": "+919876543210",
    "address": "Customer Address",
    "brand": "Samsung",
    "model": "Galaxy S24",
    "invoiceNo": "INV-001",
    "preferredAt": "2025-11-20T10:00:00.000Z"
  }'
```

### 4. Get All Bookings (Protected)

```bash
curl http://localhost:4000/api/v1/bookings \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Get Current User Profile

```bash
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Update Profile

```bash
curl -X PUT http://localhost:4000/api/v1/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "John Updated",
    "phone": "+919999999999"
  }'
```

## Testing

### Test 1: Access Without Token (Should Fail)

```bash
curl http://localhost:4000/api/v1/bookings
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Not authorized. No token provided."
}
```

### Test 2: Access With Invalid Token (Should Fail)

```bash
curl http://localhost:4000/api/v1/bookings \
  -H "Authorization: Bearer invalid_token"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Not authorized. Invalid token."
}
```

### Test 3: Register and Access (Should Succeed)

```bash
# 1. Register
RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}')

# 2. Extract token
TOKEN=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# 3. Access protected route
curl http://localhost:4000/api/v1/bookings \
  -H "Authorization: Bearer $TOKEN"
```

## Security Best Practices

### 1. Strong JWT Secret

Generate a strong, random JWT secret:

```bash
# Generate a random 64-character secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Token Expiration

Tokens expire after 30 days by default. Adjust in `generateToken()` function:

```javascript
generateToken(userId, "7d")  // 7 days
generateToken(userId, "1h")  // 1 hour
```

### 3. HTTPS in Production

Always use HTTPS in production to prevent token interception.

### 4. Password Requirements

Enforce strong passwords:
- Minimum 6 characters (configurable in User model)
- Consider adding: uppercase, lowercase, numbers, special characters

### 5. Rate Limiting

Consider adding rate limiting to prevent brute force attacks:

```bash
npm install express-rate-limit
```

## Troubleshooting

### Issue: "Not authorized. No token provided"

**Solution:** Make sure to include the Authorization header:
```
Authorization: Bearer <your_token>
```

### Issue: "Not authorized. Invalid token"

**Solutions:**
1. Check if JWT_SECRET is set in .env
2. Verify token is not expired
3. Ensure token is copied correctly (no extra spaces)

### Issue: "Not authorized. User not found"

**Solutions:**
1. User may have been deleted from database
2. Token may be from a different environment
3. Register a new user and get a new token

### Issue: Password not hashing

**Solution:** Make sure bcryptjs is installed:
```bash
npm install bcryptjs
```

## Future Enhancements

- [ ] Email verification on registration
- [ ] Password reset via email
- [ ] Refresh tokens for extended sessions
- [ ] OAuth integration (Google, Facebook)
- [ ] Two-factor authentication (2FA)
- [ ] Account lockout after failed login attempts
- [ ] Session management and token revocation
- [ ] API rate limiting per user
- [ ] Audit log for authentication events

---

**Last Updated:** November 6, 2025
**Version:** 1.0.0

