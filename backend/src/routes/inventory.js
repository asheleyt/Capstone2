const express = require('express');
const {
  getInventory,
  addInventoryItem,
  updateInventoryItemHandler,
  deleteInventoryItemHandler,
  addBatchHandler,
  discardBatchHandler,
  searchInventory,
  getProductsForPOSHandler,
} = require('../controllers/inventoryController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { activityLoggers } = require('../middleware/activityLogger');

const router = express.Router();

// Get all inventory items with batches (Admin only) - Temporarily disabled auth for testing
router.get('/', getInventory);
// Add new inventory item (Admin only)
router.post('/', authenticateToken, requireAdmin, activityLoggers.addInventory, addInventoryItem);
// Update inventory item (Admin only)
router.put('/:id', authenticateToken, requireAdmin, activityLoggers.updateInventory, updateInventoryItemHandler);
// Delete inventory item (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, activityLoggers.deleteInventory, deleteInventoryItemHandler);
// Add batch to item (Admin only)
router.post('/batch', authenticateToken, requireAdmin, addBatchHandler);
// Discard batch (Admin only)
router.delete('/batch/:batchId', authenticateToken, requireAdmin, discardBatchHandler);
// Search inventory (Admin only)
router.get('/search', authenticateToken, requireAdmin, searchInventory);
// Get products for POS (Public - no authentication required)
router.get('/pos', getProductsForPOSHandler);

// Smoke route to verify date parsing
router.get('/smoke/parse-date', (req, res) => {
  const { value } = req.query;
  const normalized = value ? (value instanceof Date ? value.toISOString().slice(0,10) : String(value).slice(0,10)) : null;
  res.json({ input: value || null, normalized });
});

module.exports = router; 
