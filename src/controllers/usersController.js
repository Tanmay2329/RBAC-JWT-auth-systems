const { users, ROLES } = require('../models/store');

/**
 * GET /api/users
 * Accessible by: admin, manager (users:read permission)
 */
function getAllUsers(req, res) {
  const userList = [...users.values()].map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  }));

  return res.status(200).json({
    success: true,
    count: userList.length,
    users: userList,
  });
}

/**
 * GET /api/users/:id
 * Accessible by: admin, manager, or the user themselves
 */
function getUserById(req, res) {
  const { id } = req.params;

  // Users can only view their own profile unless they're admin/manager
  const isSelf = req.user.id === id;
  const hasElevatedRole = [ROLES.ADMIN, ROLES.MANAGER].includes(req.user.role);

  if (!isSelf && !hasElevatedRole) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const user = users.get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
}

/**
 * PATCH /api/users/:id/role
 * Accessible by: admin only (users:write permission)
 */
function updateUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = Object.values(ROLES);
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
    });
  }

  const user = users.get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  // Prevent self-demotion
  if (user.id === req.user.id && role !== ROLES.ADMIN) {
    return res.status(400).json({ success: false, message: 'Admins cannot demote themselves.' });
  }

  user.role = role;
  users.set(id, user);

  return res.status(200).json({
    success: true,
    message: `User role updated to '${role}'.`,
    user: { id: user.id, email: user.email, role: user.role },
  });
}

/**
 * DELETE /api/users/:id
 * Accessible by: admin only (users:delete permission)
 */
function deleteUser(req, res) {
  const { id } = req.params;

  if (req.user.id === id) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
  }

  if (!users.has(id)) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  users.delete(id);

  return res.status(200).json({ success: true, message: 'User deleted successfully.' });
}

/**
 * GET /api/reports
 * Accessible by: admin, manager, user (reports:read)
 */
function getReports(req, res) {
  return res.status(200).json({
    success: true,
    message: `Reports accessed by ${req.user.email} (${req.user.role})`,
    reports: [
      { id: 1, title: 'Q1 Summary', date: '2025-03-31' },
      { id: 2, title: 'Q2 Summary', date: '2025-06-30' },
    ],
  });
}

/**
 * POST /api/reports
 * Accessible by: admin, manager (reports:write)
 */
function createReport(req, res) {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Report title is required.' });
  }

  return res.status(201).json({
    success: true,
    message: 'Report created.',
    report: { id: Date.now(), title, createdBy: req.user.email },
  });
}

/**
 * GET /api/settings
 * Accessible by: admin only (settings:read + settings:write)
 */
function getSettings(req, res) {
  return res.status(200).json({
    success: true,
    settings: {
      maintenanceMode: false,
      maxUsersAllowed: 1000,
      twoFactorRequired: false,
    },
  });
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getReports,
  createReport,
  getSettings,
};
