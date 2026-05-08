require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret-dev-only',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-dev-only',
    accessExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  },
};
