/**
 * In-memory data store (replace with a real DB like PostgreSQL in production)
 */

// Roles hierarchy: admin > manager > user
const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
};

// Permissions per role
const PERMISSIONS = {
  [ROLES.ADMIN]: [
    'users:read', 'users:write', 'users:delete',
    'reports:read', 'reports:write',
    'settings:read', 'settings:write',
  ],
  [ROLES.MANAGER]: [
    'users:read',
    'reports:read', 'reports:write',
    'settings:read',
  ],
  [ROLES.USER]: [
    'users:read',
    'reports:read',
  ],
};

// In-memory users store
const users = new Map();

// In-memory refresh token store (use Redis in production)
const refreshTokens = new Set();

module.exports = { ROLES, PERMISSIONS, users, refreshTokens };
