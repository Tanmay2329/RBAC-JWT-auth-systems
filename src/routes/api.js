const express = require('express');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getReports,
  createReport,
  getSettings,
} = require('../controllers/usersController');

const router = express.Router();

// All API routes require authentication
router.use(authenticate);

// ─── User Management ──────────────────────────────────────────────────────────
router.get(
  '/users',
  requirePermission('users:read'),
  getAllUsers
);

router.get(
  '/users/:id',
  requirePermission('users:read'),
  getUserById
);

router.patch(
  '/users/:id/role',
  authorize('admin'),
  requirePermission('users:write'),
  updateUserRole
);

router.delete(
  '/users/:id',
  authorize('admin'),
  requirePermission('users:delete'),
  deleteUser
);

// ─── Reports ─────────────────────────────────────────────────────────────────
router.get(
  '/reports',
  requirePermission('reports:read'),
  getReports
);

router.post(
  '/reports',
  authorize('admin', 'manager'),
  requirePermission('reports:write'),
  createReport
);

// ─── Settings (admin only) ────────────────────────────────────────────────────
router.get(
  '/settings',
  authorize('admin'),
  requirePermission('settings:read'),
  getSettings
);

module.exports = router;
