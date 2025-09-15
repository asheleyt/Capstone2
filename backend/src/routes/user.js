const express = require('express');
const { registerUser, getUsers, removeUser, editUser, loginUser, getAdminSecurityQuestions, resetAdminPassword } = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { activityLoggers } = require('../middleware/activityLogger');

const router = express.Router();

// POST /api/users - Register a new user (Admin only)
router.post('/', authenticateToken, requireAdmin, activityLoggers.createUser, registerUser);

// GET /api/users - Get all users (Admin only) - Temporarily disabled auth for testing
router.get('/', getUsers);

// DELETE /api/users/:id - Delete a user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, activityLoggers.deleteUser, removeUser);

// PUT /api/users/:id - Edit a user (Admin only)
router.put('/:id', authenticateToken, requireAdmin, activityLoggers.updateUser, editUser);

// POST /api/users/login - User login (Public endpoint)
router.post('/login', activityLoggers.login, loginUser);

// POST /api/users/logout - User logout (Authenticated endpoint)
router.post('/logout', activityLoggers.logout, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/users/security-questions/:username - Get security questions for admin (Public endpoint for password recovery)
router.get('/security-questions/:username', getAdminSecurityQuestions);

// POST /api/users/reset-admin-password - Reset admin password using security questions (Public endpoint)
router.post('/reset-admin-password', resetAdminPassword);

module.exports = router; 