const express = require('express');
const router = express.Router();
// const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getActivityLogsHandler,
  getActivityStatsHandler,
  getAvailableActionsHandler
} = require('../controllers/activityLogsController');

// Make activity logs routes public for now

// Get activity logs with filtering and pagination
router.get('/', getActivityLogsHandler);

// Get activity statistics
router.get('/stats', getActivityStatsHandler);

// Get available actions for filtering
router.get('/actions', getAvailableActionsHandler);

module.exports = router;
