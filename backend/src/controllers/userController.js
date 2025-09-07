const { createUser, getAllUsers, deleteUser, updateUser, findUserByUsername, findUserByEmail, findUserByResetToken, setPasswordResetToken, updateUserPassword } = require('../models/user');
const bcrypt = require('bcrypt');
const { generateToken } = require('../middleware/auth');
const { generateResetToken, sendPasswordResetEmail, sendPasswordResetConfirmation } = require('../services/emailService');

async function registerUser(req, res) {
  try {
    const { fullName, username, email, password, role, shift, salary } = req.body;
    if (!fullName || !username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({
      fullName,
      username,
      email,
      password: hashedPassword,
      role,
      shift,
      salary,
    });
    res.status(201).json({ message: 'User created', user: { ...user, password: undefined } });
  } catch (err) {
    if (err.code === '23505') {
      // Unique violation (username or email)
      return res.status(409).json({ error: 'Username or email already exists' });
    }
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
    const { fullName, username, role, shift, salary } = req.body;
    const updated = await updateUser(id, { fullName, username, role, shift, salary });
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

// Request password reset
async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }
    
    // Generate reset token
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Save reset token to database
    await setPasswordResetToken(user.id, resetToken, resetExpires);
    
    // Send reset email
    const emailResult = await sendPasswordResetEmail(user.email, resetToken, user.username);
    
    if (emailResult.success) {
      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } else {
      console.error('Failed to send reset email:', emailResult.error);
      res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
    }
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

// Reset password with token
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    
    // Find user by reset token
    const user = await findUserByResetToken(token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear reset token
    await updateUserPassword(user.id, hashedPassword);
    
    // Send confirmation email
    await sendPasswordResetConfirmation(user.email, user.username);
    
    res.json({ message: 'Password has been successfully reset' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

// Verify reset token
async function verifyResetToken(req, res) {
  try {
    const { token } = req.params;
    
    const user = await findUserByResetToken(token);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    res.json({ message: 'Token is valid', username: user.username });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

module.exports = { 
  registerUser, 
  getUsers, 
  removeUser, 
  editUser, 
  loginUser, 
  requestPasswordReset, 
  resetPassword, 
  verifyResetToken 
}; 