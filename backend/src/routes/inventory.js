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

// Get all inventory items with batches
router.get('/', authenticateToken, getInventory);
// Add new inventory item
router.post('/', authenticateToken, requireAdmin, activityLoggers.addInventory, addInventoryItem);
// Update inventory item
router.put('/:id', authenticateToken, requireAdmin, activityLoggers.updateInventory, updateInventoryItemHandler);
// Delete inventory item
router.delete('/:id', authenticateToken, requireAdmin, activityLoggers.deleteInventory, deleteInventoryItemHandler);
// Add batch to item
router.post('/batch', authenticateToken, requireAdmin, addBatchHandler);
// Discard batch
router.delete('/batch/:batchId', authenticateToken, requireAdmin, discardBatchHandler);
// Search inventory
router.get('/search', authenticateToken, searchInventory);
// Get products for POS
router.get('/pos', authenticateToken, getProductsForPOSHandler);

module.exports = router; 