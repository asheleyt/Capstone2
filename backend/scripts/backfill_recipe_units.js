#!/usr/bin/env node
// Backfill product recipes to amount+unit using pcs default when missing
const pool = require('../src/db');

(async () => {
  try {
    const { rows } = await pool.query("SELECT id, name, raw_materials FROM inventory_items WHERE type = 'Product'");
    for (const p of rows) {
      let changed = false;
      const updated = (p.raw_materials || []).map(rm => {
        if (rm && rm.name) {
          if (rm.amount == null && rm.quantity != null) { rm.amount = rm.quantity; changed = true; }
          if (!rm.unit) { rm.unit = 'pcs'; changed = true; }
        }
        return rm;
      });
      if (changed) {
        await pool.query('UPDATE inventory_items SET raw_materials = $1 WHERE id = $2', [JSON.stringify(updated), p.id]);
        console.log(`Updated recipe for product #${p.id} (${p.name})`);
      }
    }
    console.log('Backfill complete.');
    process.exit(0);
  } catch (e) {
    console.error('Backfill failed:', e);
    process.exit(1);
  }
})();

