const express = require('express');
const { registerUser, getUsers, removeUser, editUser, loginUser, requestPasswordReset, resetPassword, verifyResetToken } = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { activityLoggers } = require('../middleware/activityLogger');

const router = express.Router();

// POST /api/users - Register a new user (Admin only)
router.post('/', authenticateToken, requireAdmin, activityLoggers.createUser, registerUser);

// GET /api/users - Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, getUsers);

// DELETE /api/users/:id - Delete a user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, activityLoggers.deleteUser, removeUser);

// PUT /api/users/:id - Edit a user (Admin only)
router.put('/:id', authenticateToken, requireAdmin, activityLoggers.updateUser, editUser);

// POST /api/users/login - User login (Public endpoint)
router.post('/login', activityLoggers.login, loginUser);

// POST /api/users/logout - User logout (Authenticated endpoint)
router.post('/logout', authenticateToken, activityLoggers.logout, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Password reset routes (Public endpoints)
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

module.exports = router; 