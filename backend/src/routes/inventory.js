const express = require('express');
const {
  getInventory,
  addInventoryItem,
  updateInventoryItemHandler,
  deleteInventoryItemHandler,
  addBatchHandler,
  discardBatchHandler,
  searchInventory,
} = require('../controllers/inventoryController');

const router = express.Router();

// Get all inventory items with batches
router.get('/', getInventory);
// Add new inventory item
router.post('/', addInventoryItem);
// Update inventory item
router.put('/:id', updateInventoryItemHandler);
// Delete inventory item
router.delete('/:id', deleteInventoryItemHandler);
// Add batch to item
router.post('/batch', addBatchHandler);
// Discard batch
router.delete('/batch/:batchId', discardBatchHandler);
// Search inventory
router.get('/search', searchInventory);

module.exports = router; 