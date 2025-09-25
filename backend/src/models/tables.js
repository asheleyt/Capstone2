const pool = require('../db');

// Initialize tables table
async function initTablesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dining_tables (
      id SERIAL PRIMARY KEY,
      table_number INTEGER UNIQUE NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'available', -- 'available' | 'occupied'
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    );
  `);

  // Seed default tables if empty (1..20)
  const res = await pool.query('SELECT COUNT(*)::int AS count FROM dining_tables');
  if (res.rows[0].count === 0) {
    const defaultCount = 40;
    const values = [];
    for (let i = 1; i <= defaultCount; i++) {
      values.push(`(${i}, 'available')`);
    }
    await pool.query(`INSERT INTO dining_tables (table_number, status) VALUES ${values.join(',')}`);
  }
}

async function listTables() {
  const { rows } = await pool.query('SELECT id, table_number, status FROM dining_tables ORDER BY table_number ASC');
  return rows;
}

async function getTableByNumber(tableNumber) {
  const { rows } = await pool.query('SELECT id, table_number, status FROM dining_tables WHERE table_number = $1', [tableNumber]);
  return rows[0] || null;
}

async function setTableStatus(tableNumber, status) {
  const { rows } = await pool.query(
    `UPDATE dining_tables SET status = $2, updated_at = NOW() WHERE table_number = $1 RETURNING id, table_number, status`,
    [tableNumber, status]
  );
  return rows[0] || null;
}

async function toggleTable(tableNumber) {
  const table = await getTableByNumber(tableNumber);
  if (!table) return null;
  const nextStatus = table.status === 'available' ? 'occupied' : 'available';
  return await setTableStatus(tableNumber, nextStatus);
}

module.exports = {
  initTablesTable,
  listTables,
  getTableByNumber,
  setTableStatus,
  toggleTable,
};


