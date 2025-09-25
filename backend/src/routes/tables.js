const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { listTables, toggleTable, setTableStatus } = require('../models/tables');

const router = express.Router();

// List tables (Server/Admin)
router.get('/', authenticateToken, requireRole(['Server', 'Admin']), async (req, res) => {
  try {
    const tables = await listTables();
    res.json(tables);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Toggle table status by number (Server/Admin)
router.post('/:tableNumber/toggle', authenticateToken, requireRole(['Server', 'Admin']), async (req, res) => {
  try {
    const tableNumber = parseInt(req.params.tableNumber, 10);
    if (Number.isNaN(tableNumber)) return res.status(400).json({ error: 'Invalid table number' });
    const updated = await toggleTable(tableNumber);
    if (!updated) return res.status(404).json({ error: 'Table not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to toggle table' });
  }
});

// Explicitly set status (Server/Admin)
router.post('/:tableNumber/status', authenticateToken, requireRole(['Server', 'Admin']), async (req, res) => {
  try {
    const tableNumber = parseInt(req.params.tableNumber, 10);
    const { status } = req.body;
    if (Number.isNaN(tableNumber)) return res.status(400).json({ error: 'Invalid table number' });
    if (!['available', 'occupied'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const updated = await setTableStatus(tableNumber, status);
    if (!updated) return res.status(404).json({ error: 'Table not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to set table status' });
  }
});

module.exports = router;


