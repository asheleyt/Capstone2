const express = require('express');
const { generateSalesReport, getDashboardAnalytics } = require('../controllers/salesController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { activityLoggers } = require('../middleware/activityLogger');

const router = express.Router();

// GET /api/sales/report - Generate and download sales report (Admin only)
router.get('/report', authenticateToken, requireAdmin, activityLoggers.downloadReport, generateSalesReport);

// GET /api/sales/dashboard - Get dashboard analytics data (Admin only)
router.get('/dashboard', authenticateToken, requireAdmin, getDashboardAnalytics);

module.exports = router; 