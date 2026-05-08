const bcrypt = require('bcryptjs');
const { bcrypt: bcryptConfig } = require('../config/config');

/**
 * Hash a plain-text password
 */
async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(bcryptConfig.rounds);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Compare a plain-text password against a stored hash
 */
async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = { hashPassword, verifyPassword };
