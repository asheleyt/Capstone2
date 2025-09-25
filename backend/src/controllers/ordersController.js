const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrdersByStatus,
  updateOrder,
  voidOrder,
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
    
    if (orderData.total === undefined || orderData.total < 0) {
      return res.status(400).json({ error: 'Order total must be 0 or greater' });
    }
    
    // POS integration: enforce table availability when dine-in has a table number
    // Allow override when sameTableOverride is true (attach to occupied table)
    if (orderData.orderType === 'dine-in' && orderData.tableNumber) {
      try {
        const { getTableByNumber } = require('../models/tables');
        const table = await getTableByNumber(parseInt(orderData.tableNumber, 10));
        if (!table) {
          return res.status(400).json({ error: 'Invalid table number' });
        }
        if (table.status !== 'available' && !orderData.sameTableOverride) {
          return res.status(409).json({ error: 'Selected table is occupied' });
        }
        if (orderData.sameTableOverride && orderData.sameTableNumber && String(orderData.sameTableNumber) !== String(table.table_number)) {
          return res.status(400).json({ error: 'Same table number does not match an existing table' });
        }
      } catch (e) {
        // If tables model not available or DB error
        console.error('Table validation error:', e.message, {
          tableNumber: orderData.tableNumber,
          sameTableOverride: orderData.sameTableOverride
        });
        return res.status(500).json({ error: 'Failed to validate table status' });
      }
    }

    const order = await createOrder(orderData);

    // Auto-occupy the table if this is a dine-in order with a table number
    if (orderData.orderType === 'dine-in' && orderData.tableNumber) {
      try {
        const { setTableStatus } = require('../models/tables');
        await setTableStatus(parseInt(orderData.tableNumber, 10), 'occupied');
      } catch (e) {
        console.warn('Failed to set table to occupied after order creation:', e.message);
      }
    }

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
    console.error('Error creating order:', err?.message || err, {
      tableNumber: req?.body?.tableNumber,
      sameTableOverride: req?.body?.sameTableOverride,
      orderType: req?.body?.orderType
    });
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

    // Emit status update to connected clients (e.g., KDS screens)
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('orderStatusUpdated', order);
      }
    } catch (emitErr) {
      console.warn('Socket emit failed for orderStatusUpdated:', emitErr.message);
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

// Update order (edit items and notes)
async function updateOrderHandler(req, res) {
  try {
    const { id } = req.params;
    const orderData = req.body;
    
    console.log('Update order request:', { id, orderData });
    
    // Validate required fields
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    
    // If editing table number, validate availability (accept snake_case or camelCase)
    const incomingTable = orderData.table_number ?? orderData.tableNumber;
    if (incomingTable !== undefined && incomingTable !== null && String(incomingTable).trim() !== '') {
      const tableNum = parseInt(String(incomingTable).trim(), 10);
      if (Number.isNaN(tableNum)) {
        return res.status(400).json({ error: 'Invalid table number' });
      }
      try {
        const { getTableByNumber } = require('../models/tables');
        const table = await getTableByNumber(tableNum);
        if (!table) {
          return res.status(400).json({ error: 'Invalid table number' });
        }
        if (table.status !== 'available') {
          return res.status(409).json({ error: 'Selected table is occupied' });
        }
      } catch (e) {
        return res.status(500).json({ error: 'Failed to validate table status' });
      }
    }

    const order = await updateOrder(id, orderData);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log('Order updated successfully:', order);
    
    // After successful update, set table to occupied if provided (snake_case or camelCase)
    if (incomingTable !== undefined && incomingTable !== null && String(incomingTable).trim() !== '') {
      try {
        const { setTableStatus } = require('../models/tables');
        await setTableStatus(parseInt(String(incomingTable).trim(), 10), 'occupied');
      } catch (_) {}
    }

    // Emit updated order to KDS via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdated', order);
    }
    
    res.json(order);
  } catch (err) {
    console.error('Error updating order:', err);
    if (err.message === 'Order not found') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === 'Order can only be edited when status is pending') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to update order', details: err.message });
  }
}

// Void order
async function voidOrderHandler(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    console.log('Void order request:', { id, password });
    
    // Simple password validation (you can make this more secure)
    const validPasswords = ['july 2 2004', 'pasig', 'waiter'];
    if (!password || !validPasswords.includes(password.toLowerCase())) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }
    
    const order = await voidOrder(id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log('Order voided successfully:', order);
    
    // Emit voided order to KDS via socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('orderVoided', order);
    }
    
    res.json(order);
  } catch (err) {
    console.error('Error voiding order:', err);
    if (err.message === 'Order not found') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === 'Order can only be voided when status is pending') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to void order', details: err.message });
  }
}

module.exports = {
  createOrderHandler,
  getAllOrdersHandler,
  getOrderByIdHandler,
  updateOrderStatusHandler,
  getOrdersByStatusHandler,
  updateOrderHandler,
  voidOrderHandler,
}; 
