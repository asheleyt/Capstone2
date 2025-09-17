const express = require('express');
const {
  createOrderHandler,
  getAllOrdersHandler,
  getOrderByIdHandler,
  updateOrderStatusHandler,
  getOrdersByStatusHandler,
  updateOrderHandler,
  voidOrderHandler,
} = require('../controllers/ordersController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { activityLoggers } = require('../middleware/activityLogger');

const router = express.Router();

// Create a new order (Cashier/Admin)
router.post('/', authenticateToken, requireRole(['Cashier', 'Admin']), activityLoggers.createOrder, createOrderHandler);

// Get all orders (Admin only) - TEMPORARILY PUBLIC FOR KDS TESTING
router.get('/', getAllOrdersHandler);

// Get order by ID (Admin only)
router.get('/:id', authenticateToken, requireRole(['Admin']), getOrderByIdHandler);

// Update order status (Kitchen/Admin)
router.put('/:id/status', authenticateToken, requireRole(['Kitchen', 'Admin']), activityLoggers.updateOrder, updateOrderStatusHandler);

// Update order (edit items and notes) - Cashier/Admin only (TEMPORARILY NO AUTH FOR TESTING)
router.patch('/:id', updateOrderHandler);

// Void order - Cashier/Admin only
router.post('/:id/void', authenticateToken, requireRole(['Cashier', 'Admin']), activityLoggers.updateOrder, voidOrderHandler);

// Get orders by status (Kitchen/Admin) - TEMPORARILY PUBLIC FOR KDS TESTING
router.get('/status/:status', getOrdersByStatusHandler);

module.exports = router; 