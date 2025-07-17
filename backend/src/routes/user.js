const express = require('express');
const { registerUser, getUsers, removeUser, editUser, loginUser } = require('../controllers/userController');

const router = express.Router();

// POST /api/users - Register a new user
router.post('/', registerUser);

// GET /api/users - Get all users
router.get('/', getUsers);

// DELETE /api/users/:id - Delete a user
router.delete('/:id', removeUser);

// PUT /api/users/:id - Edit a user
router.put('/:id', editUser);

// POST /api/users/login - User login
router.post('/login', loginUser);

module.exports = router; 