const pool = require('../db');

// Create users table if it doesn't exist
async function initUserTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL,
      shift VARCHAR(50),
      salary NUMERIC(12,2)
    );
  `);
}

// Insert a new user
async function createUser({ fullName, username, password, role, shift, salary }) {
  const result = await pool.query(
    `INSERT INTO users (full_name, username, password, role, shift, salary)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [fullName, username, password, role, shift, salary]
  );
  return result.rows[0];
}

// Fetch all users (excluding passwords)
async function getAllUsers() {
  const result = await pool.query(
    `SELECT id, full_name, username, role, shift, salary FROM users ORDER BY id ASC`
  );
  return result.rows;
}

// Delete a user by ID
async function deleteUser(id) {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}

// Update a user by ID
async function updateUser(id, { fullName, username, role, shift, salary }) {
  const result = await pool.query(
    `UPDATE users SET full_name = $1, username = $2, role = $3, shift = $4, salary = $5 WHERE id = $6 RETURNING id, full_name, username, role, shift, salary`,
    [fullName, username, role, shift, salary, id]
  );
  return result.rows[0];
}

// Find user by username (for login)
async function findUserByUsername(username) {
  const result = await pool.query(
    `SELECT * FROM users WHERE username = $1`,
    [username]
  );
  return result.rows[0];
}

module.exports = {
  initUserTable,
  createUser,
  getAllUsers,
  deleteUser,
  updateUser,
  findUserByUsername,
}; 