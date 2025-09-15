const pool = require('../db');
const bcrypt = require('bcrypt');
const { getHashedAnswers, getQuestions } = require('../constants/securityQuestions');

// Create users table if it doesn't exist
async function initUserTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL,
      security_answer_1 VARCHAR(255),
      security_answer_2 VARCHAR(255),
      security_answer_3 VARCHAR(255)
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
      const securityAnswers = await getHashedAnswers();
      
      await createUser({
        fullName: 'Temporary Admin',
        username: 'admin',
        password: adminPassword,
        role: 'Admin',
        securityAnswers: securityAnswers
      });
      console.log('Temporary admin account created: admin/admin123');
    }
  } catch (error) {
    console.error('Error creating default accounts:', error);
  }
}

// Insert a new user
async function createUser({ fullName, username, password, role, securityAnswers }) {
  const query = securityAnswers ? 
    `INSERT INTO users (full_name, username, password, role, security_answer_1, security_answer_2, security_answer_3)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *` :
    `INSERT INTO users (full_name, username, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`;
  
  const params = securityAnswers ? 
    [fullName, username, password, role, 
     securityAnswers.a1, securityAnswers.a2, securityAnswers.a3] :
    [fullName, username, password, role];
  
  const result = await pool.query(query, params);
  return result.rows[0];
}

// Fetch all users (excluding passwords)
async function getAllUsers() {
  const result = await pool.query(
    `SELECT id, full_name, username, role FROM users ORDER BY id ASC`
  );
  return result.rows;
}

// Delete a user by ID
async function deleteUser(id) {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}

// Update a user by ID
async function updateUser(id, { fullName, username, role, securityAnswers }) {
  let query, params;
  
  if (securityAnswers) {
    query = `UPDATE users SET full_name = $1, username = $2, role = $3, 
             security_answer_1 = $4, security_answer_2 = $5, security_answer_3 = $6 WHERE id = $7 
             RETURNING id, full_name, username, role`;
    params = [fullName, username, role, 
              securityAnswers.a1, securityAnswers.a2, securityAnswers.a3, id];
  } else {
    query = `UPDATE users SET full_name = $1, username = $2, role = $3 WHERE id = $4 
             RETURNING id, full_name, username, role`;
    params = [fullName, username, role, id];
  }
  
  const result = await pool.query(query, params);
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

// Get security questions for admin user (returns predefined questions)
async function getSecurityQuestions(username) {
  // Check if user exists and is admin
  const userResult = await pool.query(
    `SELECT id FROM users WHERE username = $1 AND role = 'Admin'`,
    [username]
  );
  
  if (userResult.rows.length === 0) {
    return null;
  }
  
  // Return predefined questions
  return getQuestions();
}

// Verify security answers and reset password
async function verifySecurityAnswersAndResetPassword(username, answers, newPassword) {
  try {
    const result = await pool.query(
      `SELECT id, security_answer_1, security_answer_2, security_answer_3 FROM users WHERE username = $1 AND role = 'Admin'`,
      [username]
    );
    if (result.rows.length === 0) return false;

    const user = result.rows[0];

    // Defensive: check for missing hashes
    if (!user.security_answer_1 || !user.security_answer_2 || !user.security_answer_3) {
      console.error('Missing security answer hashes for user:', username);
      return false;
    }

    const match1 = await bcrypt.compare(answers.a1, user.security_answer_1);
    const match2 = await bcrypt.compare(answers.a2, user.security_answer_2);
    const match3 = await bcrypt.compare(answers.a3, user.security_answer_3);

    if (!(match1 && match2 && match3)) return false;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users SET password = $1 WHERE id = $2`,
      [hashedPassword, user.id]
    );
    return true;
  } catch (err) {
    console.error('Error in verifySecurityAnswersAndResetPassword:', err);
    throw err;
  }
}

// Update user password (for regular password changes)
async function updateUserPassword(id, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await pool.query(
    `UPDATE users SET password = $1 WHERE id = $2`,
    [hashedPassword, id]
  );
}

module.exports = {
  initUserTable,
  createUser,
  getAllUsers,
  deleteUser,
  updateUser,
  findUserByUsername,
  createDefaultAccounts,
  getSecurityQuestions,
  verifySecurityAnswersAndResetPassword,
  updateUserPassword,
}; 