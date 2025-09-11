const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getActivityLogsHandler,
  getActivityStatsHandler,
  getAvailableActionsHandler
} = require('../controllers/activityLogsController');

// Get activity logs with filtering and pagination (Admin only)
router.get('/', authenticateToken, requireAdmin, getActivityLogsHandler);

// Get activity statistics (Admin only)
router.get('/stats', authenticateToken, requireAdmin, getActivityStatsHandler);

// Get available actions for filtering (Admin only)
router.get('/actions', authenticateToken, requireAdmin, getAvailableActionsHandler);

module.exports = router;
