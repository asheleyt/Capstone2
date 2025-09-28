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
  countBatchesForItem,
  countOrderReferences,
} = require('../models/inventory');
const pool = require('../db');

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
    // Validate id
    const itemId = Number(id);
    if (!Number.isInteger(itemId)) {
      return res.status(400).json({ error: 'Invalid inventory id' });
    }
    // Pre-checks to provide clear reasons instead of generic errors
    const [batches, orderRefs] = await Promise.all([
      countBatchesForItem(itemId),
      countOrderReferences(itemId),
    ]);
    if (batches > 0) {
      return res.status(409).json({ error: 'Cannot delete: product still has batches', details: `batches=${batches}` });
    }
    if (orderRefs > 0) {
      return res.status(409).json({ error: 'Cannot delete: product used in past orders', details: `orders=${orderRefs}` });
    }
    // Attempt delete; model uses ON DELETE CASCADE for batches
    await deleteInventoryItem(itemId);
    return res.json({ success: true });
  } catch (err) {
    // Normalize common constraint errors to 409 instead of 500
    const msg = err?.message || '';
    if (/foreign key|constraint/i.test(msg)) {
      return res.status(409).json({ error: 'Delete blocked by constraints', details: msg });
    }
    return res.status(500).json({ error: 'Failed to delete item', details: msg });
  }
}

// Add a batch to an item
async function addBatchHandler(req, res) {
  try {
    const { itemId, quantity, expiry, unitAmount, unitLabel } = req.body;
    if (!itemId) throw new Error('itemId is required');
    if (!quantity || quantity <= 0) throw new Error('quantity must be > 0');
    if (!expiry) throw new Error('expiry is required');
    const parsedId = Number(itemId);
    const parsedQty = Number(quantity);
    if (!Number.isInteger(parsedId)) throw new Error('itemId must be an integer');
    if (!Number.isInteger(parsedQty)) throw new Error('quantity must be an integer');
    const batch = await addBatch({ itemId: parsedId, quantity: parsedQty, expiry, unitAmount, unitLabel });
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

// Admin utility: clear all inventory items and batches
async function clearInventoryHandler(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM inventory_batches');
    await client.query('DELETE FROM inventory_items');
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to clear inventory', details: e.message });
  } finally {
    client.release();
  }
}

module.exports.clearInventoryHandler = clearInventoryHandler;
