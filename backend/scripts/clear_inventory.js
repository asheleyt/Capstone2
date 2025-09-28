const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM inventory_batches');
    await client.query('DELETE FROM inventory_items');
    await client.query('COMMIT');
    console.log('All inventory cleared.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Failed to clear inventory:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();

