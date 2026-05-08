const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, refresh, logout, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Strict rate limit for auth endpoints to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

module.exports = router;
