const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrdersByStatus,
} = require('../models/orders');
const { consumeStockFIFO } = require('../models/inventory');

// Create a new order
async function createOrderHandler(req, res) {
  try {
    const orderData = req.body;
    
    // Validate required fields
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    
    if (!orderData.total || orderData.total <= 0) {
      return res.status(400).json({ error: 'Order total must be greater than 0' });
    }
    
    const order = await createOrder(orderData);

    // Decrement inventory stock per item (FIFO across batches)
    try {
      await Promise.all(
        orderData.items.map(item =>
          item.id ? consumeStockFIFO(item.id, item.quantity) : Promise.resolve()
        )
      );
    } catch (stockErr) {
      console.error('Stock decrement failed:', stockErr);
      // We do not fail the order creation for display purposes, but log the error
    }

    // Emit new order to KDS via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('newOrder', order);
    }
    res.status(201).json(order);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
}

// Get all orders
async function getAllOrdersHandler(req, res) {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
}

// Get order by ID
async function getOrderByIdHandler(req, res) {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order', details: err.message });
  }
}

// Update order status
async function updateOrderStatusHandler(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const order = await updateOrderStatus(id, status);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status', details: err.message });
  }
}

// Get orders by status
async function getOrdersByStatusHandler(req, res) {
  try {
    const { status } = req.params;
    const orders = await getOrdersByStatus(status);
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders by status:', err);
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
}

module.exports = {
  createOrderHandler,
  getAllOrdersHandler,
  getOrderByIdHandler,
  updateOrderStatusHandler,
  getOrdersByStatusHandler,
}; 