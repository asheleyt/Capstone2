const pool = require('../db');
const bcrypt = require('bcrypt');

function normalizeAnswer(value) {
  return typeof value === 'string' ? value.toLowerCase().trim() : '';
}

function normalizeQuestion(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || null;
}

async function hashSecurityAnswers(answers) {
  return {
    a1: await bcrypt.hash(normalizeAnswer(answers.a1), 10),
    a2: await bcrypt.hash(normalizeAnswer(answers.a2), 10),
    a3: await bcrypt.hash(normalizeAnswer(answers.a3), 10),
  };
}

function sanitizeUserRow(row) {
  if (!row) return null;
  const {
    password,
    security_answer_1,
    security_answer_2,
    security_answer_3,
    ...rest
  } = row;
  return rest;
}

// Create users table if it doesn't exist
async function initUserTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL,
      security_question_1 TEXT,
      security_question_2 TEXT,
      security_question_3 TEXT,
      security_answer_1 VARCHAR(255),
      security_answer_2 VARCHAR(255),
      security_answer_3 VARCHAR(255),
      security_setup_complete BOOLEAN DEFAULT FALSE
    );
  `);

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question_1 TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question_2 TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question_3 TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer_1 VARCHAR(255)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer_2 VARCHAR(255)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer_3 VARCHAR(255)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_setup_complete BOOLEAN DEFAULT FALSE`);

  await createDefaultAccounts();
}

// Create temporary default accounts for testing
async function createDefaultAccounts() {
  try {
    const existingUsers = await getAllUsers();
    const existingUsernames = existingUsers.map(user => user.username);

    if (!existingUsernames.includes('admin')) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      await createUser({
        fullName: 'Temporary Admin',
        username: 'admin',
        password: adminPassword,
        role: 'Admin',
        securitySetupComplete: false,
      });
      console.log('Temporary admin account created: admin/admin123');
    }
  } catch (error) {
    console.error('Error creating default accounts:', error);
  }
}

function buildInsert(columns, values) {
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  return {
    text: `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id, full_name, username, role, security_question_1, security_question_2, security_question_3, security_setup_complete`,
    values,
  };
}

// Insert a new user
async function createUser({ fullName, username, password, role, securityQuestions = null, securityAnswers = null, securitySetupComplete = null }) {
  const columns = ['full_name', 'username', 'password', 'role'];
  const values = [fullName, username, password, role];

  if (securityQuestions) {
    columns.push('security_question_1', 'security_question_2', 'security_question_3');
    values.push(
      normalizeQuestion(securityQuestions.q1),
      normalizeQuestion(securityQuestions.q2),
      normalizeQuestion(securityQuestions.q3),
    );
  }

  if (securityAnswers) {
    columns.push('security_answer_1', 'security_answer_2', 'security_answer_3');
    values.push(securityAnswers.a1, securityAnswers.a2, securityAnswers.a3);
  }

  if (securitySetupComplete !== null) {
    columns.push('security_setup_complete');
    values.push(securitySetupComplete);
  }

  const { text, values: params } = buildInsert(columns, values);
  const result = await pool.query(text, params);
  return sanitizeUserRow(result.rows[0]);
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
async function updateUser(id, { fullName, username, role, securityQuestions = null, securityAnswers = null, securitySetupComplete = null }) {
  const sets = ['full_name = $1', 'username = $2', 'role = $3'];
  const values = [fullName, username, role];
  let index = 4;

  if (securityQuestions) {
    sets.push(`security_question_1 = $${index++}`);
    values.push(normalizeQuestion(securityQuestions.q1));
    sets.push(`security_question_2 = $${index++}`);
    values.push(normalizeQuestion(securityQuestions.q2));
    sets.push(`security_question_3 = $${index++}`);
    values.push(normalizeQuestion(securityQuestions.q3));
  }

  if (securityAnswers) {
    sets.push(`security_answer_1 = $${index++}`);
    values.push(securityAnswers.a1);
    sets.push(`security_answer_2 = $${index++}`);
    values.push(securityAnswers.a2);
    sets.push(`security_answer_3 = $${index++}`);
    values.push(securityAnswers.a3);
  }

  if (securitySetupComplete !== null) {
    sets.push(`security_setup_complete = $${index++}`);
    values.push(securitySetupComplete);
  }

  values.push(id);
  const query = `UPDATE users SET ${sets.join(', ')} WHERE id = $${index} RETURNING id, full_name, username, role, security_question_1, security_question_2, security_question_3, security_setup_complete`;
  const result = await pool.query(query, values);
  return sanitizeUserRow(result.rows[0]);
}

// Find user by username (for login)
async function findUserByUsername(username) {
  const result = await pool.query(
    `SELECT id, full_name, username, password, role, security_question_1, security_question_2, security_question_3, security_answer_1, security_answer_2, security_answer_3, security_setup_complete FROM users WHERE username = $1`,
    [username]
  );
  return result.rows[0];
}

// Get security questions for admin user
async function getSecurityQuestions(username) {
  const result = await pool.query(
    `SELECT security_question_1, security_question_2, security_question_3 FROM users WHERE username = $1 AND role = 'Admin'`,
    [username]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const { security_question_1, security_question_2, security_question_3 } = result.rows[0];
  if (!security_question_1 || !security_question_2 || !security_question_3) {
    return null;
  }

  return {
    q1: security_question_1,
    q2: security_question_2,
    q3: security_question_3,
  };
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

    if (!user.security_answer_1 || !user.security_answer_2 || !user.security_answer_3) {
      console.error('Missing security answer hashes for user:', username);
      return false;
    }

    const match1 = await bcrypt.compare(normalizeAnswer(answers.a1), user.security_answer_1);
    const match2 = await bcrypt.compare(normalizeAnswer(answers.a2), user.security_answer_2);
    const match3 = await bcrypt.compare(normalizeAnswer(answers.a3), user.security_answer_3);

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

async function setupSuperAdminSecurity(userId, { questions, answers }) {
  const hashedAnswers = await hashSecurityAnswers(answers);
  const result = await pool.query(
    `UPDATE users SET
      security_question_1 = $1,
      security_question_2 = $2,
      security_question_3 = $3,
      security_answer_1 = $4,
      security_answer_2 = $5,
      security_answer_3 = $6,
      security_setup_complete = TRUE
     WHERE id = $7 AND role = 'SuperAdmin'
     RETURNING id, full_name, username, role, security_question_1, security_question_2, security_question_3, security_setup_complete`,
    [
      normalizeQuestion(questions.q1),
      normalizeQuestion(questions.q2),
      normalizeQuestion(questions.q3),
      hashedAnswers.a1,
      hashedAnswers.a2,
      hashedAnswers.a3,
      userId,
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('SuperAdmin not found');
  }

  return sanitizeUserRow(result.rows[0]);
}

async function resetSuperAdminSecurity(userId) {
  await pool.query(
    `UPDATE users SET
      security_question_1 = NULL,
      security_question_2 = NULL,
      security_question_3 = NULL,
      security_answer_1 = NULL,
      security_answer_2 = NULL,
      security_answer_3 = NULL,
      security_setup_complete = FALSE
     WHERE id = $1 AND role = 'SuperAdmin'`,
    [userId]
  );
}

async function setupAdminSecurity(userId, { questions, answers }) {
  const hashedAnswers = await hashSecurityAnswers(answers);
  const result = await pool.query(
    `UPDATE users SET
      security_question_1 = $1,
      security_question_2 = $2,
      security_question_3 = $3,
      security_answer_1 = $4,
      security_answer_2 = $5,
      security_answer_3 = $6,
      security_setup_complete = TRUE
     WHERE id = $7 AND role = 'Admin'
     RETURNING id, full_name, username, role, security_question_1, security_question_2, security_question_3, security_setup_complete`,
    [
      normalizeQuestion(questions.q1),
      normalizeQuestion(questions.q2),
      normalizeQuestion(questions.q3),
      hashedAnswers.a1,
      hashedAnswers.a2,
      hashedAnswers.a3,
      userId,
    ]
  );

  if (result.rows.length === 0) {
    throw new Error('Admin not found');
  }

  return sanitizeUserRow(result.rows[0]);
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
  setupSuperAdminSecurity,
  resetSuperAdminSecurity,
  setupAdminSecurity,
};
