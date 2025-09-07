const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { initUserTable } = require('./models/user');
const { initializeSampleProducts, initInventoryTables } = require('./models/inventory');
const { initOrdersTables } = require('./models/orders');
const { initActivityLogsTable } = require('./models/activityLogs');
const userRoutes = require('./routes/user');
const salesRoutes = require('./routes/sales');
const inventoryRoutes = require('./routes/inventory');
const ordersRoutes = require('./routes/orders');
const activityLogsRoutes = require('./routes/activityLogs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- SOCKET.IO SETUP ---
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
app.set('io', io); // Make io accessible in routes/controllers

app.use('/api/users', userRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/activity-logs', activityLogsRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Initialize user table, inventory tables, orders tables, activity logs table, and sample products
initUserTable().then(() => {
  return initInventoryTables();
}).then(() => {
  return initOrdersTables();
}).then(() => {
  return initActivityLogsTable();
}).then(() => {
  return initializeSampleProducts();
}).then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize:', err);
});
