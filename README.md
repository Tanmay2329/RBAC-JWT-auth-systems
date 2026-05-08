# 🔐 Authentication & Authorization System

A production-ready JWT authentication system with Role-Based Access Control (RBAC), bcrypt password hashing, and refresh token rotation.

## Features

- **JWT Authentication** — Short-lived access tokens (15m) + long-lived refresh tokens (7d)
- **Token Refresh & Rotation** — Refresh tokens are rotated on every use to prevent reuse attacks
- **RBAC** — Three roles: `admin`, `manager`, `user` with fine-grained permission scopes
- **Password Security** — bcrypt hashing with configurable rounds (default: 12)
- **Rate Limiting** — Global limiter + strict auth endpoint limiter (10 req/15m)
- **Security Headers** — Helmet.js for secure HTTP headers
- **HttpOnly Cookies** — Refresh tokens can be stored in httpOnly cookies for web clients
- **Comprehensive Tests** — Jest + Supertest covering all flows

## Project Structure

```
auth-system/
├── src/
│   ├── config/
│   │   └── config.js          # Environment configuration
│   ├── controllers/
│   │   ├── authController.js  # Register, login, refresh, logout, me
│   │   └── usersController.js # User CRUD + reports + settings
│   ├── middleware/
│   │   └── auth.js            # authenticate, authorize, requirePermission
│   ├── models/
│   │   └── store.js           # In-memory store, ROLES, PERMISSIONS
│   ├── routes/
│   │   ├── auth.js            # /auth/* routes
│   │   └── api.js             # /api/* protected routes
│   ├── utils/
│   │   ├── jwt.js             # Token generation & verification
│   │   └── password.js        # bcrypt hashing helpers
│   └── server.js              # Express app entry point
├── tests/
│   └── auth.test.js           # Full test suite
├── .env.example
├── jest.config.json
└── package.json
```

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your secrets

# Run development server
npm run dev

# Run tests
npm test
```

## RBAC Model

| Permission       | admin | manager | user |
|-----------------|-------|---------|------|
| users:read      | ✅    | ✅      | ✅   |
| users:write     | ✅    | ❌      | ❌   |
| users:delete    | ✅    | ❌      | ❌   |
| reports:read    | ✅    | ✅      | ✅   |
| reports:write   | ✅    | ✅      | ❌   |
| settings:read   | ✅    | ✅      | ❌   |
| settings:write  | ✅    | ❌      | ❌   |

## API Reference

### Auth Endpoints

#### Register
```http
POST /auth/register
Content-Type: application/json

{ "email": "user@example.com", "password": "securepass123", "role": "user" }
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "securepass123" }
```
Response:
```json
{
  "success": true,
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": "15m",
  "user": { "id": "...", "email": "...", "role": "user" }
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{ "refreshToken": "eyJ..." }
```

#### Logout
```http
POST /auth/logout
Content-Type: application/json

{ "refreshToken": "eyJ..." }
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer eyJ...
```

### Protected API Endpoints

All require `Authorization: Bearer <accessToken>`

```http
GET    /api/users              # users:read
GET    /api/users/:id          # users:read
PATCH  /api/users/:id/role     # admin + users:write
DELETE /api/users/:id          # admin + users:delete
GET    /api/reports            # reports:read
POST   /api/reports            # admin/manager + reports:write
GET    /api/settings           # admin + settings:read
```

## Middleware Usage

```js
const { authenticate, authorize, requirePermission } = require('./middleware/auth');

// Require valid JWT
router.get('/profile', authenticate, handler);

// Require specific role
router.get('/admin-only', authenticate, authorize('admin'), handler);

// Require specific permission (fine-grained)
router.delete('/users/:id', authenticate, requirePermission('users:delete'), handler);
```

## Security Notes

- In production, replace the in-memory store with **PostgreSQL** (users) + **Redis** (refresh tokens)
- Use strong random strings for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- Enable HTTPS and set `NODE_ENV=production` so cookies are `Secure`
- Consider adding 2FA on top of this system for sensitive applications
