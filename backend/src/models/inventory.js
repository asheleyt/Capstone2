const pool = require('../db');

// Create inventory tables if they don't exist
async function initInventoryTables() {
  try {
    // Create inventory_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        unit VARCHAR(20),
        category VARCHAR(50),
        low_stock_threshold INTEGER DEFAULT 10,
        requires_raw_materials BOOLEAN DEFAULT FALSE,
        raw_materials JSONB DEFAULT '[]',
        price DECIMAL(10,2) DEFAULT 0.00
      );
    `);

    // Add price column if it doesn't exist (migration)
    try {
      await pool.query('ALTER TABLE inventory_items ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00');
      console.log('Price column added to inventory_items table');
    } catch (error) {
      // Column already exists, ignore error
      console.log('Price column already exists in inventory_items table');
    }

    // Add unit and category columns if they don't exist (migration)
    try {
      await pool.query('ALTER TABLE inventory_items ADD COLUMN unit VARCHAR(20)');
      console.log('Unit column added to inventory_items table');
    } catch (error) {
      console.log('Unit column already exists in inventory_items table');
    }
    try {
      await pool.query('ALTER TABLE inventory_items ADD COLUMN category VARCHAR(50)');
      console.log('Category column added to inventory_items table');
    } catch (error) {
      console.log('Category column already exists in inventory_items table');
    }

    // Create inventory_batches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_batches (
        id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        expiry DATE NOT NULL,
        unit_amount NUMERIC(10,2),
        unit_label VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Inventory tables initialized successfully');
  } catch (error) {
    console.error('Error initializing inventory tables:', error);
    throw error;
  }
}

// INVENTORY ITEM CRUD
async function createInventoryItem({ name, type, unit, category, lowStockThreshold, requiresRawMaterials, rawMaterials, price }) {
  const result = await pool.query(
    `INSERT INTO inventory_items (name, type, unit, category, low_stock_threshold, requires_raw_materials, raw_materials, price)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [name, type, unit, category, lowStockThreshold, requiresRawMaterials, JSON.stringify(rawMaterials || []), price || 0]
  );
  return result.rows[0];
}

async function findInventoryItemByNameAndType(name, type) {
  const result = await pool.query(
    `SELECT * FROM inventory_items WHERE LOWER(name) = LOWER($1) AND type = $2 LIMIT 1`,
    [name, type]
  );
  return result.rows[0] || null;
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
async function addBatch({ itemId, quantity, expiry, unitAmount = null, unitLabel = null }) {
  // Normalize expiry to DATE (YYYY-MM-DD) to avoid DB driver casting issues
  const expiryDate = expiry instanceof Date ? expiry.toISOString().slice(0, 10) : String(expiry).slice(0, 10);
  // Backward compatibility: some DBs may not have unit_amount/unit_label columns
  let result;
  try {
    result = await pool.query(
      `INSERT INTO inventory_batches (item_id, quantity, expiry, unit_amount, unit_label)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [itemId, quantity, expiryDate, unitAmount, unitLabel]
    );
  } catch (e) {
    if (/column \"unit_amount\" of relation \"inventory_batches\" does not exist/i.test(e.message)) {
      // Fallback to legacy schema without these columns
      result = await pool.query(
        `INSERT INTO inventory_batches (item_id, quantity, expiry)
         VALUES ($1, $2, $3) RETURNING *`,
        [itemId, quantity, expiryDate]
      );
    } else {
      throw e;
    }
  }
  return result.rows[0];
}

async function getBatchesByItemId(itemId) {
  const result = await pool.query(
    'SELECT * FROM inventory_batches WHERE item_id = $1 ORDER BY expiry ASC, id ASC',
    [itemId]
  );
  return result.rows;
}

async function discardBatch(batchId) {
  await pool.query('DELETE FROM inventory_batches WHERE id = $1', [batchId]);
}

// Get products for POS (only products, not raw materials)
async function getProductsForPOS() {
  const result = await pool.query(`
    SELECT 
      i.id,
      i.name,
      i.type,
      i.low_stock_threshold,
      i.price,
      COALESCE(SUM(b.quantity), 0) as current_stock
    FROM inventory_items i
    LEFT JOIN inventory_batches b ON i.id = b.item_id
    WHERE i.type = 'Product'
    GROUP BY i.id, i.name, i.type, i.low_stock_threshold, i.price
    ORDER BY i.name ASC
  `);
  return result.rows;
}

// Consume stock FIFO across batches for a given product
async function consumeStockFIFO(itemId, quantity) {
  if (!quantity || quantity <= 0) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const batchesRes = await client.query(
      'SELECT id, quantity FROM inventory_batches WHERE item_id = $1 ORDER BY expiry ASC, id ASC FOR UPDATE',
      [itemId]
    );
    let remaining = quantity;
    for (const b of batchesRes.rows) {
      if (remaining <= 0) break;
      const consume = Math.min(remaining, b.quantity);
      const newQty = b.quantity - consume;
      if (newQty === 0) {
        await client.query('DELETE FROM inventory_batches WHERE id = $1', [b.id]);
      } else {
        await client.query('UPDATE inventory_batches SET quantity = $1 WHERE id = $2', [newQty, b.id]);
      }
      remaining -= consume;
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Initialize sample products for testing
async function initializeSampleProducts() {
  try {
    // Check if products already exist
    const existingProducts = await pool.query("SELECT COUNT(*) FROM inventory_items WHERE type = 'Product'");
    if (existingProducts.rows[0].count > 0) {
      console.log('Sample products already exist');
      return;
    }

    // Sample products for restaurant
    const sampleProducts = [
      { name: 'Chicken Adobo', type: 'Product', lowStockThreshold: 10, price: 120.00 },
      { name: 'Beef Sinigang', type: 'Product', lowStockThreshold: 8, price: 150.00 },
      { name: 'Pork Sisig', type: 'Product', lowStockThreshold: 12, price: 180.00 },
      { name: 'Fish Paksiw', type: 'Product', lowStockThreshold: 6, price: 130.00 },
      { name: 'Coke', type: 'Product', lowStockThreshold: 20, price: 25.00 },
      { name: 'Sprite', type: 'Product', lowStockThreshold: 15, price: 25.00 },
      { name: 'San Miguel Beer', type: 'Product', lowStockThreshold: 25, price: 45.00 },
      { name: 'Halo-Halo', type: 'Product', lowStockThreshold: 10, price: 80.00 },
      { name: 'Leche Flan', type: 'Product', lowStockThreshold: 8, price: 60.00 },
      { name: 'Turon', type: 'Product', lowStockThreshold: 12, price: 35.00 },
      { name: 'Pancit Canton', type: 'Product', lowStockThreshold: 15, price: 90.00 },
      { name: 'Fried Rice', type: 'Product', lowStockThreshold: 20, price: 70.00 }
    ];

    // Create products
    for (const product of sampleProducts) {
      const createdProduct = await createInventoryItem({
        name: product.name,
        type: product.type,
        lowStockThreshold: product.lowStockThreshold,
        requiresRawMaterials: false,
        rawMaterials: [],
        price: product.price
      });

      // Add some stock for each product
      await addBatch({
        itemId: createdProduct.id,
        quantity: Math.floor(Math.random() * 50) + 10, // Random stock between 10-60
        expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });
    }

    console.log('Sample products initialized successfully');
  } catch (error) {
    console.error('Error initializing sample products:', error);
  }
}

module.exports = {
  createInventoryItem,
  findInventoryItemByNameAndType,
  getAllInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  addBatch,
  getBatchesByItemId,
  discardBatch,
  getProductsForPOS,
  initializeSampleProducts,
  initInventoryTables,
  consumeStockFIFO,
}; 
