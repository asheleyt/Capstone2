const { createUser, getAllUsers, deleteUser, updateUser, findUserByUsername, getSecurityQuestions, verifySecurityAnswersAndResetPassword } = require('../models/user');
const { getHashedAnswers } = require('../constants/securityQuestions');
const bcrypt = require('bcrypt');
const { generateToken } = require('../middleware/auth');

async function registerUser(req, res) {
  try {
    const { fullName, username, password, role, securityAnswers } = req.body;
    if (!fullName || !username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // For admin users, validate security answers BEFORE any processing
    if (role === 'Admin') {
      console.log('=== ADMIN USER CREATION START ===');
      console.log('Received request body:', req.body);
      console.log('Security answers received:', securityAnswers);
      
      if (!securityAnswers || !securityAnswers.a1 || !securityAnswers.a2 || !securityAnswers.a3) {
        console.log('❌ Missing security answers for admin user');
        return res.status(400).json({ error: 'Security answers are required for admin users' });
      }
      
      // Validate answers against predefined answers
      const { getAnswers } = require('../constants/securityQuestions');
      const correctAnswers = getAnswers();
      
      const userAnswers = {
        a1: securityAnswers.a1.toLowerCase().trim(),
        a2: securityAnswers.a2.toLowerCase().trim(),
        a3: securityAnswers.a3.toLowerCase().trim()
      };
      
      console.log('User answers (normalized):', userAnswers);
      console.log('Correct answers:', correctAnswers);
      
      const isValid = userAnswers.a1 === correctAnswers.a1 &&
                      userAnswers.a2 === correctAnswers.a2 &&
                      userAnswers.a3 === correctAnswers.a3;
      
      console.log('Validation result:', isValid);
      
      if (!isValid) {
        console.log('❌ Invalid security answers provided - REJECTING USER CREATION');
        return res.status(400).json({ error: 'Invalid security answers' });
      }
      
      console.log('✅ Security answers validation passed');
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Get predefined security answers for admin users
    let hashedSecurityAnswers = null;
    if (role === 'Admin') {
      hashedSecurityAnswers = await getHashedAnswers();
    }
    
    const user = await createUser({
      fullName,
      username,
      password: hashedPassword,
      role,
      securityAnswers: hashedSecurityAnswers
    });
    res.status(201).json({ message: 'User created', user: { ...user, password: undefined } });
  } catch (err) {
    if (err.code === '23505') {
      // Unique violation (username)
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
    await deleteUser(id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user', details: err.message });
  }
}

async function editUser(req, res) {
  try {
    const { id } = req.params;
    const { fullName, username, role, securityAnswers } = req.body;
    
    // For admin users, validate security answers BEFORE any processing
    if (role === 'Admin') {
      console.log('=== ADMIN USER UPDATE START ===');
      console.log('Received request body:', req.body);
      console.log('Security answers received:', securityAnswers);
      
      if (!securityAnswers || !securityAnswers.a1 || !securityAnswers.a2 || !securityAnswers.a3) {
        console.log('❌ Missing security answers for admin user');
        return res.status(400).json({ error: 'Security answers are required for admin users' });
      }
      
      // Validate answers against predefined answers
      const { getAnswers } = require('../constants/securityQuestions');
      const correctAnswers = getAnswers();
      
      const userAnswers = {
        a1: securityAnswers.a1.toLowerCase().trim(),
        a2: securityAnswers.a2.toLowerCase().trim(),
        a3: securityAnswers.a3.toLowerCase().trim()
      };
      
      console.log('User answers (normalized):', userAnswers);
      console.log('Correct answers:', correctAnswers);
      
      const isValid = userAnswers.a1 === correctAnswers.a1 &&
                      userAnswers.a2 === correctAnswers.a2 &&
                      userAnswers.a3 === correctAnswers.a3;
      
      console.log('Validation result:', isValid);
      
      if (!isValid) {
        console.log('❌ Invalid security answers provided - REJECTING USER UPDATE');
        return res.status(400).json({ error: 'Invalid security answers' });
      }
      
      console.log('✅ Security answers validation passed');
    }
    
    // Get predefined security answers for admin users
    let hashedSecurityAnswers = null;
    if (role === 'Admin') {
      hashedSecurityAnswers = await getHashedAnswers();
    }
    
    const updated = await updateUser(id, { fullName, username, role, securityAnswers: hashedSecurityAnswers });
    res.json({ message: 'User updated', user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user', details: err.message });
  }
}

async function loginUser(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Remove password from user object before sending
    const { password: _, ...userWithoutPassword } = user;
    res.json({ 
      message: 'Login successful', 
      user: userWithoutPassword,
      token: token
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
    
    if (!answers.a1 || !answers.a2 || !answers.a3) {
      return res.status(400).json({ error: 'All three security answers are required' });
    }

    // Normalize answers (lowercase, trim) but do NOT hash
    const normalizedAnswers = {
      a1: answers.a1.toLowerCase().trim(),
      a2: answers.a2.toLowerCase().trim(),
      a3: answers.a3.toLowerCase().trim()
    };

    const result = await verifySecurityAnswersAndResetPassword(username, normalizedAnswers, newPassword);
    if (!result) {
      return res.status(400).json({ error: 'Invalid security answers' });
    }
    
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

module.exports = { 
  registerUser, 
  getUsers, 
  removeUser, 
  editUser, 
  loginUser,
  getAdminSecurityQuestions,
  resetAdminPassword
}; 