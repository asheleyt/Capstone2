const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { initUserTable } = require('./models/user');
const userRoutes = require('./routes/user');
const salesRoutes = require('./routes/sales');
const inventoryRoutes = require('./routes/inventory');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Initialize user table
initUserTable().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize user table:', err);
});
