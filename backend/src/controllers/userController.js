const { createUser, getAllUsers, deleteUser, updateUser, findUserByUsername } = require('../models/user');
const bcrypt = require('bcrypt');

async function registerUser(req, res) {
  try {
    const { fullName, username, password, role, shift, salary } = req.body;
    if (!fullName || !username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({
      fullName,
      username,
      password: hashedPassword,
      role,
      shift,
      salary,
    });
    res.status(201).json({ message: 'User created', user: { ...user, password: undefined } });
  } catch (err) {
    if (err.code === '23505') {
      // Unique violation (username)
      return res.status(409).json({ error: 'Username already exists' });
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
    // Remove password from user object before sending
    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Login successful', user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

module.exports = { registerUser, getUsers, removeUser, editUser, loginUser }; 