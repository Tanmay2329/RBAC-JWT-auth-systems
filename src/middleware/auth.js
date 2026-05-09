const { verifyAccessToken } = require('../utils/jwt');
const PERMISSIONS = {
  admin: [
    'users:read',
    'users:write',
    'users:delete',
    'reports:read',
    'reports:write',
    'settings:read',
    'settings:write'
  ],
  manager: [
    'users:read',
    'reports:read',
    'reports:write',
    'settings:read'
  ],
  user: [
    'users:read',
    'reports:read'
  ]
};

/**
 * authenticate — verifies the Bearer access token on every protected route.
 * Attaches decoded user info to req.user.
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Include Authorization: Bearer <token>',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      permissions: PERMISSIONS[decoded.role] || [],
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired. Use /auth/refresh to get a new one.',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
}

/**
 * authorize — checks that the authenticated user has the required role(s).
 * Usage: router.get('/admin', authenticate, authorize('admin'), handler)
 * Accepts a single role string or an array of roles (any match grants access).
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const allowed = roles.flat();
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowed.join(' or ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
}

/**
 * requirePermission — fine-grained permission check.
 * Usage: router.delete('/users/:id', authenticate, requirePermission('users:delete'), handler)
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Missing permission: ${permission}`,
      });
    }

    next();
  };
}

module.exports = { authenticate, authorize, requirePermission };
