const pool = require('../db');

// INVENTORY ITEM CRUD
async function createInventoryItem({ name, type, lowStockThreshold, requiresRawMaterials, rawMaterials }) {
  const result = await pool.query(
    `INSERT INTO inventory_items (name, type, low_stock_threshold, requires_raw_materials, raw_materials)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, type, lowStockThreshold, requiresRawMaterials, JSON.stringify(rawMaterials || [])]
  );
  return result.rows[0];
}

async function getAllInventoryItems() {
  const result = await pool.query('SELECT * FROM inventory_items ORDER BY id ASC');
  return result.rows;
}

async function getInventoryItemById(id) {
  const result = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [id]);
  return result.rows[0];
}

async function updateInventoryItem(id, fields) {
  // Only update provided fields
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  if (keys.length === 0) return getInventoryItemById(id);
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const result = await pool.query(
    `UPDATE inventory_items SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0];
}

async function deleteInventoryItem(id) {
  await pool.query('DELETE FROM inventory_items WHERE id = $1', [id]);
}

// BATCH CRUD
async function addBatch({ itemId, quantity, expiry }) {
  const result = await pool.query(
    `INSERT INTO inventory_batches (item_id, quantity, expiry)
     VALUES ($1, $2, $3) RETURNING *`,
    [itemId, quantity, expiry]
  );
  return result.rows[0];
}

async function getBatchesByItemId(itemId) {
  const result = await pool.query(
    'SELECT * FROM inventory_batches WHERE item_id = $1 ORDER BY expiry ASC',
    [itemId]
  );
  return result.rows;
}

async function discardBatch(batchId) {
  await pool.query('DELETE FROM inventory_batches WHERE id = $1', [batchId]);
}

module.exports = {
  createInventoryItem,
  getAllInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  addBatch,
  getBatchesByItemId,
  discardBatch,
}; 