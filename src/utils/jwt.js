const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/config');

/**
 * Generate a short-lived access token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiry,
    issuer: 'auth-system',
    audience: 'auth-system-client',
  });
}

/**
 * Generate a long-lived refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiry,
    issuer: 'auth-system',
    audience: 'auth-system-client',
  });
}

/**
 * Verify an access token — returns decoded payload or throws
 */
function verifyAccessToken(token) {
  return jwt.verify(token, jwtConfig.accessSecret, {
    issuer: 'auth-system',
    audience: 'auth-system-client',
  });
}

/**
 * Verify a refresh token — returns decoded payload or throws
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, jwtConfig.refreshSecret, {
    issuer: 'auth-system',
    audience: 'auth-system-client',
  });
}

/**
 * Build the token payload from a user object
 */
function buildTokenPayload(user) {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  buildTokenPayload,
};
