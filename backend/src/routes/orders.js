const express = require('express');
const {
  createOrderHandler,
  getAllOrdersHandler,
  getOrderByIdHandler,
  updateOrderStatusHandler,
  getOrdersByStatusHandler,
} = require('../controllers/ordersController');

const router = express.Router();

// Create a new order
router.post('/', createOrderHandler);

// Get all orders
router.get('/', getAllOrdersHandler);

// Get order by ID
router.get('/:id', getOrderByIdHandler);

// Update order status
router.put('/:id/status', updateOrderStatusHandler);

// Get orders by status
router.get('/status/:status', getOrdersByStatusHandler);

module.exports = router; 