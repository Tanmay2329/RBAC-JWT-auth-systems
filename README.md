# Secure Authentication & Authorization System

A production-grade authentication and authorization backend built with Node.js, Express, Prisma, PostgreSQL, JWT, and Role-Based Access Control (RBAC).

Live API: https://rbac-jwt-auth-systems.onrender.com

---

## Features

✅ User Registration  
✅ Secure Login  
✅ Password Hashing using bcrypt  
✅ JWT Access Tokens  
✅ Refresh Token Rotation  
✅ Logout + Token Revocation  
✅ Role-Based Access Control (RBAC)  
✅ Permission-Based API Protection  
✅ PostgreSQL Persistence  
✅ Cloud Deployment  
✅ Production Security Middleware

---

## Tech Stack

Backend:
- Node.js
- Express.js

Database:
- PostgreSQL
- Prisma ORM

Authentication:
- JSON Web Token (JWT)
- bcryptjs

Security:
- Helmet
- Rate Limiting
- CORS
- Cookie Parser

Deployment:
- Render
- Neon PostgreSQL

---

## Architecture

Client
↓
Express API
↓
Authentication Middleware
↓
RBAC + Permission Checks
↓
Prisma ORM
↓
PostgreSQL

---

## Live API

https://rbac-jwt-auth-systems.onrender.com

Health Check:

https://rbac-jwt-auth-systems.onrender.com/health

---

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=

JWT_ACCESS_SECRET=

JWT_REFRESH_SECRET=

NODE_ENV=production
```

---

## Installation

Clone repository:

```bash
git clone https://github.com/Tanmay2329/RBAC-JWT-auth-systems
```

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npx prisma generate
```

Run migrations:

```bash
npx prisma migrate dev
```

Start server:

```bash
npm run dev
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh tokens |
| POST | /auth/logout | Logout |
| GET | /auth/me | Current user |

---

### Users

| Method | Endpoint | Role |
|--------|----------|------|
| GET | /api/users | user+ |
| GET | /api/users/:id | user+ |
| PATCH | /api/users/:id/role | admin |
| DELETE | /api/users/:id | admin |

---

### Other APIs

| Method | Endpoint |
|--------|----------|
| GET | /api/reports |
| POST | /api/reports |
| GET | /api/settings |

---

## Example Login

### Request

```json
{
  "email": "admin@test.com",
  "password": "SecurePass123"
}
```

### Response

```json
{
  "success": true,
  "accessToken": "...",
  "refreshToken": "..."
}
```

---

## Security Features

- Password hashing
- Token expiration
- Token revocation
- Refresh rotation
- RBAC
- Permission checks
- Rate limiting
- Secure headers

---

## Deployment

Backend deployed on Render.

Database hosted on Neon PostgreSQL.

---

## Author

Tanmay Chandorkar