const pool = require('../db');
const bcrypt = require('bcrypt');

// Create users table if it doesn't exist
async function initUserTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL,
      shift VARCHAR(50),
      salary NUMERIC(12,2),
      reset_password_token VARCHAR(255),
      reset_password_expires TIMESTAMP
    );
  `);
  
  // Create temporary default accounts
  await createDefaultAccounts();
}

// Create temporary default accounts for testing
async function createDefaultAccounts() {
  try {
    // Check if default accounts already exist
    const existingUsers = await getAllUsers();
    const existingUsernames = existingUsers.map(user => user.username);
    
    // Only create admin account if it doesn't exist
    if (!existingUsernames.includes('admin')) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      await createUser({
        fullName: 'Temporary Admin',
        username: 'admin',
        password: adminPassword,
        role: 'Admin',
        shift: 'Day',
        salary: 50000
      });
      console.log('Temporary admin account created: admin/admin123');
    }
  } catch (error) {
    console.error('Error creating default accounts:', error);
  }
}

// Insert a new user
async function createUser({ fullName, username, email, password, role, shift, salary }) {
  const result = await pool.query(
    `INSERT INTO users (full_name, username, email, password, role, shift, salary)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [fullName, username, email, password, role, shift, salary]
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

// Find user by email
async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
}

// Find user by reset token
async function findUserByResetToken(token) {
  const result = await pool.query(
    `SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()`,
    [token]
  );
  return result.rows[0];
}

// Set password reset token
async function setPasswordResetToken(userId, token, expires) {
  await pool.query(
    `UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3`,
    [token, expires, userId]
  );
}

// Update user password
async function updateUserPassword(userId, hashedPassword) {
  await pool.query(
    `UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2`,
    [hashedPassword, userId]
  );
}

module.exports = {
  initUserTable,
  createUser,
  getAllUsers,
  deleteUser,
  updateUser,
  findUserByUsername,
  findUserByEmail,
  findUserByResetToken,
  setPasswordResetToken,
  updateUserPassword,
  createDefaultAccounts,
}; 