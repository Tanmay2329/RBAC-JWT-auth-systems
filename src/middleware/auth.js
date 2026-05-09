const {
  verifyAccessToken
} = require('../utils/jwt');


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


function authenticate(
  req,
  res,
  next
) {

  try {

    const authHeader =
      req.headers.authorization;


    if (
      !authHeader ||
      !authHeader.startsWith(
        'Bearer '
      )
    ) {

      return res.status(401).json({
        success: false,
        message:
          'No token provided.'
      });
    }


    const token =
      authHeader.split(' ')[1];


    const decoded =
      verifyAccessToken(
        token
      );


    req.user = {
      id:
        decoded.sub,
      email:
        decoded.email,
      role:
        decoded.role,
      permissions:
        PERMISSIONS[
          decoded.role
        ] || []
    };


    next();

  } catch {

    return res.status(401).json({
      success: false,
      message:
        'Invalid token.'
    });
  }
}


function authorize(
  ...roles
) {

  return (
    req,
    res,
    next
  ) => {

    if (
      !roles.includes(
        req.user.role
      )
    ) {

      return res.status(403).json({
        success: false
      });
    }

    next();
  };
}


function requirePermission(
  permission
) {

  return (
    req,
    res,
    next
  ) => {

    if (
      !req.user.permissions.includes(
        permission
      )
    ) {

      return res.status(403).json({
        success: false
      });
    }

    next();
  };
}


module.exports = {
  authenticate,
  authorize,
  requirePermission
};