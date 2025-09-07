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
// const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { activityLoggers } = require('../middleware/activityLogger');

const router = express.Router();

// Get all inventory items with batches
router.get('/', getInventory);
// Add new inventory item
router.post('/', activityLoggers.addInventory, addInventoryItem);
// Update inventory item
router.put('/:id', activityLoggers.updateInventory, updateInventoryItemHandler);
// Delete inventory item
router.delete('/:id', activityLoggers.deleteInventory, deleteInventoryItemHandler);
// Add batch to item
router.post('/batch', addBatchHandler);
// Discard batch
router.delete('/batch/:batchId', discardBatchHandler);
// Search inventory
router.get('/search', searchInventory);
// Get products for POS
router.get('/pos', getProductsForPOSHandler);

module.exports = router; 