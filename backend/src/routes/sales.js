const express = require('express');
const { generateSalesReport, getDashboardAnalytics } = require('../controllers/salesController');
const { authenticateToken } = require('../middleware/auth');
const { activityLoggers } = require('../middleware/activityLogger');

const router = express.Router();

// GET /api/sales/report - Generate and download sales report
router.get('/report', authenticateToken, activityLoggers.downloadReport, generateSalesReport);

// GET /api/sales/dashboard - Get dashboard analytics data
router.get('/dashboard', authenticateToken, getDashboardAnalytics);

module.exports = router; 