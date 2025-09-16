const {
  createInventoryItem,
  getAllInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  addBatch,
  getBatchesByItemId,
  discardBatch,
  getProductsForPOS,
  findInventoryItemByNameAndType,
} = require('../models/inventory');

// Get all inventory items with their batches
async function getInventory(req, res) {
  try {
    const items = await getAllInventoryItems();
    // Fetch batches for each item
    const itemsWithBatches = await Promise.all(
      items.map(async item => {
        const batches = await getBatchesByItemId(item.id);
        return { ...item, batches };
      })
    );
    res.json(itemsWithBatches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory', details: err.message });
  }
}

// Add a new inventory item
async function addInventoryItem(req, res) {
  try {
    const { name, type, unit, category, lowStockThreshold, requiresRawMaterials, rawMaterials } = req.body;

    // If this is a raw material/product that already exists by name+type, reuse it
    const existing = await findInventoryItemByNameAndType(name, type);
    if (existing) {
      return res.status(200).json(existing);
    }

    const item = await createInventoryItem({ name, type, unit, category, lowStockThreshold, requiresRawMaterials, rawMaterials });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add item', details: err.message });
  }
}

// Update an inventory item
async function updateInventoryItemHandler(req, res) {
  try {
    const { id } = req.params;
    const updated = await updateInventoryItem(id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item', details: err.message });
  }
}

// Delete an inventory item
async function deleteInventoryItemHandler(req, res) {
  try {
    const { id } = req.params;
    await deleteInventoryItem(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item', details: err.message });
  }
}

// Add a batch to an item
async function addBatchHandler(req, res) {
  try {
    const { itemId, quantity, expiry, unitAmount, unitLabel } = req.body;
    const batch = await addBatch({ itemId, quantity, expiry, unitAmount, unitLabel });
    res.status(201).json(batch);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add batch', details: err.message });
  }
}

// Discard a batch
async function discardBatchHandler(req, res) {
  try {
    const { batchId } = req.params;
    await discardBatch(batchId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to discard batch', details: err.message });
  }
}

// Search inventory by name/type
async function searchInventory(req, res) {
  try {
    const { q } = req.query;
    const items = await getAllInventoryItems();
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(q.toLowerCase()) ||
      (item.type && item.type.toLowerCase().includes(q.toLowerCase()))
    );
    // Fetch batches for each filtered item
    const itemsWithBatches = await Promise.all(
      filtered.map(async item => {
        const batches = await getBatchesByItemId(item.id);
        return { ...item, batches };
      })
    );
    res.json(itemsWithBatches);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search inventory', details: err.message });
  }
}

// Get products for POS
async function getProductsForPOSHandler(req, res) {
  try {
    const products = await getProductsForPOS();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products for POS', details: err.message });
  }
}

module.exports = {
  getInventory,
  addInventoryItem,
  updateInventoryItemHandler,
  deleteInventoryItemHandler,
  addBatchHandler,
  discardBatchHandler,
  searchInventory,
  getProductsForPOSHandler,
}; 