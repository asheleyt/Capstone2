const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { initUserTable } = require('./models/user');
const { initializeSampleProducts, initInventoryTables } = require('./models/inventory');
const { initOrdersTables } = require('./models/orders');
const userRoutes = require('./routes/user');
const salesRoutes = require('./routes/sales');
const inventoryRoutes = require('./routes/inventory');
const ordersRoutes = require('./routes/orders');
const tablesRoutes = require('./routes/tables');
const activityLogsRoutes = require('./routes/activityLogs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/tables', tablesRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Initialize user table, inventory tables, and sample products
async function startServer() {
  try {
    console.log('Starting server initialization...');
    
    await initUserTable();
    console.log('User table initialized');
    
    await initInventoryTables();
    console.log('Inventory tables initialized');
    
    await initOrdersTables();
    const { initTablesTable } = require('./models/tables');
    await initTablesTable();
    console.log('Orders tables initialized');
    
    await initializeSampleProducts();
    console.log('Sample products initialized');
    
    const PORT = process.env.PORT || 5000;
    console.log(`Attempting to start server on port ${PORT}...`);
    
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Test the server: http://localhost:${PORT}/`);
      console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/users/login`);
    });
    
    // Keep the server running
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });
    
    // Prevent the process from exiting
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
    
    console.log('🚀 Server startup complete!');
    
  } catch (err) {
    console.error('❌ Failed to initialize:', err);
    process.exit(1);
  }
}

console.log('📦 Starting application...');
startServer();
