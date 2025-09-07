const express = require('express');
const {
  createOrderHandler,
  getAllOrdersHandler,
  getOrderByIdHandler,
  updateOrderStatusHandler,
  getOrdersByStatusHandler,
} = require('../controllers/ordersController');
const { authenticateToken } = require('../middleware/auth');
const { activityLoggers } = require('../middleware/activityLogger');

const router = express.Router();

// Create a new order
router.post('/', authenticateToken, activityLoggers.createOrder, createOrderHandler);

// Get all orders
router.get('/', authenticateToken, getAllOrdersHandler);

// Get order by ID
router.get('/:id', authenticateToken, getOrderByIdHandler);

// Update order status
router.put('/:id/status', authenticateToken, activityLoggers.updateOrder, updateOrderStatusHandler);

// Get orders by status
router.get('/status/:status', authenticateToken, getOrdersByStatusHandler);

module.exports = router; 