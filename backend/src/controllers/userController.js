const {
  createUser,
  getAllUsers,
  deleteUser,
  updateUser,
  findUserByUsername,
  getSecurityQuestions,
  verifySecurityAnswersAndResetPassword,
  setupSuperAdminSecurity,
  resetSuperAdminSecurity,
  setupAdminSecurity,
} = require('../models/user');
const bcrypt = require('bcrypt');
const { generateToken } = require('../middleware/auth');

function trim(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeQuestionSet(questions = {}) {
  return {
    q1: trim(questions.q1),
    q2: trim(questions.q2),
    q3: trim(questions.q3),
  };
}

function normalizeAnswerSet(answers = {}) {
  return {
    a1: trim(answers.a1),
    a2: trim(answers.a2),
    a3: trim(answers.a3),
  };
}

function hasEmptyField(map) {
  return Object.values(map).some(value => !value);
}

function sanitizeUser(user) {
  if (!user) return null;
  const {
    password,
    security_answer_1,
    security_answer_2,
    security_answer_3,
    ...rest
  } = user;
  return rest;
}

async function registerUser(req, res) {
  try {
    const { fullName, username, password, role } = req.body;
    if (!fullName || !username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const currentUserRole = req.user?.role;
    if (currentUserRole === 'Admin' && (role === 'Admin' || role === 'SuperAdmin')) {
      return res.status(403).json({ error: 'Admin users cannot manage this role' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
      fullName: trim(fullName),
      username: trim(username),
      password: hashedPassword,
      role,
      securitySetupComplete: role === 'Admin' ? false : null,
    });

    res.status(201).json({ message: 'User created', user });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

async function getUsers(req, res) {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
}

async function removeUser(req, res) {
  try {
    const { id } = req.params;

    const users = await getAllUsers();
    const userToDelete = users.find(u => u.id == id);

    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUserRole = req.user?.role;
    if (currentUserRole === 'Admin' && (userToDelete.role === 'Admin' || userToDelete.role === 'SuperAdmin')) {
      return res.status(403).json({ error: 'Admin users cannot manage this role' });
    }

    await deleteUser(id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user', details: err.message });
  }
}

async function editUser(req, res) {
  try {
    const { id } = req.params;
    const { fullName, username, role } = req.body;

    if (!fullName || !username || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const currentUserRole = req.user?.role;
    if (currentUserRole === 'Admin' && (role === 'Admin' || role === 'SuperAdmin')) {
      return res.status(403).json({ error: 'Admin users cannot manage this role' });
    }

    const updated = await updateUser(id, {
      fullName: trim(fullName),
      username: trim(username),
      role,
    });
    res.json({ message: 'User updated', user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user', details: err.message });
  }
}

async function loginUser(req, res) {
  try {
    const { username, password } = req.body;
    const normalizedUsername = trim(username);
    if (!normalizedUsername || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const user = await findUserByUsername(normalizedUsername);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const sanitizedUser = sanitizeUser(user);
    const token = generateToken(sanitizedUser);

    res.json({
      message: 'Login successful',
      user: sanitizedUser,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

// Get security questions for admin user
async function getAdminSecurityQuestions(req, res) {
  try {
    const { username } = req.params;
    const questions = await getSecurityQuestions(username);
    if (!questions) {
      return res.status(404).json({ error: 'Admin user not found or no security questions set' });
    }
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

// Verify security answers and reset password
async function resetAdminPassword(req, res) {
  try {
    const { username, answers, newPassword } = req.body;

    if (!username || !answers || !newPassword) {
      return res.status(400).json({ error: 'Username, answers, and new password are required' });
    }

    const normalizedAnswers = normalizeAnswerSet(answers);
    if (hasEmptyField(normalizedAnswers)) {
      return res.status(400).json({ error: 'All three security answers are required' });
    }

    const result = await verifySecurityAnswersAndResetPassword(username, normalizedAnswers, newPassword);
    if (!result) {
      return res.status(400).json({ error: 'Invalid security answers' });
    }

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

// Get current authenticated user (without password)
async function getCurrentUser(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    return res.json(req.user);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

// SuperAdmin: Setup security questions and answers
async function setupSuperAdmin(req, res) {
  try {
    if (!req.user || req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ error: 'SuperAdmin access required' });
    }
    const normalizedQuestions = normalizeQuestionSet(req.body.questions);
    const normalizedAnswers = normalizeAnswerSet(req.body.answers);
    if (hasEmptyField(normalizedQuestions) || hasEmptyField(normalizedAnswers)) {
      return res.status(400).json({ error: 'Three questions and answers are required' });
    }
    const updated = await setupSuperAdminSecurity(req.user.id, {
      questions: normalizedQuestions,
      answers: normalizedAnswers,
    });
    return res.json({ message: 'Security setup completed', user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to setup security', details: err.message });
  }
}

// SuperAdmin: Reset security during setup/cancel
async function resetSuperAdmin(req, res) {
  try {
    if (!req.user || req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ error: 'SuperAdmin access required' });
    }
    await resetSuperAdminSecurity(req.user.id);
    return res.json({ message: 'Security reset' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset security', details: err.message });
  }
}

// Admin: Setup security questions and answers
async function setupAdmin(req, res) {
  try {
    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (req.user.security_setup_complete) {
      return res.status(409).json({ error: 'Security already configured' });
    }

    const normalizedQuestions = normalizeQuestionSet(req.body.questions);
    const normalizedAnswers = normalizeAnswerSet(req.body.answers);

    if (hasEmptyField(normalizedQuestions) || hasEmptyField(normalizedAnswers)) {
      return res.status(400).json({ error: 'Three questions and answers are required' });
    }

    const updated = await setupAdminSecurity(req.user.id, {
      questions: normalizedQuestions,
      answers: normalizedAnswers,
    });

    return res.json({ message: 'Security setup completed', user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to setup security', details: err.message });
  }
}

module.exports = {
  registerUser,
  getUsers,
  removeUser,
  editUser,
  loginUser,
  getAdminSecurityQuestions,
  resetAdminPassword,
  getCurrentUser,
  setupSuperAdmin,
  resetSuperAdmin,
  setupAdmin,
};
