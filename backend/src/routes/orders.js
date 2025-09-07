const express = require('express');
const {
  createOrderHandler,
  getAllOrdersHandler,
  getOrderByIdHandler,
  updateOrderStatusHandler,
  getOrdersByStatusHandler,
} = require('../controllers/ordersController');
// const { authenticateToken } = require('../middleware/auth');
const { activityLoggers } = require('../middleware/activityLogger');

const router = express.Router();

// Create a new order
router.post('/', activityLoggers.createOrder, createOrderHandler);

// Get all orders
router.get('/', getAllOrdersHandler);

// Get order by ID
router.get('/:id', getOrderByIdHandler);

// Update order status
router.put('/:id/status', activityLoggers.updateOrder, updateOrderStatusHandler);

// Get orders by status
router.get('/status/:status', getOrdersByStatusHandler);

module.exports = router; 