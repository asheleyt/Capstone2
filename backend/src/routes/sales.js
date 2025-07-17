const express = require('express');
const { generateSalesReport } = require('../controllers/salesController');

const router = express.Router();

// GET /api/sales/report - Generate and download sales report
router.get('/report', generateSalesReport);

module.exports = router; 