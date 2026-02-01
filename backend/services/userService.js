const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const usersRepo = require('../repositories/usersRepository');

const SALT_ROUNDS = 10;

const createUser = async ({ username, password, role }) => {
  // Validation
  if (!username || typeof username !== 'string') {
    throw new Error('Username is required');
  }

  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Check if user already exists
  const existingUser = await usersRepo.findUserByUsername(username);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const userId = uuidv4();
  await usersRepo.insertUser({
    id: userId,
    username: username.toLowerCase().trim(),
    passwordHash,
    role: role || 'admin',
  });

  return { id: userId, username: username.toLowerCase().trim(), role: role || 'admin' };
};

const authenticateUser = async (username, password) => {
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  const user = await usersRepo.findUserByUsername(username.toLowerCase().trim());
  
  if (!user) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  
  if (!isValidPassword) {
    return null;
  }

  // Return user without password hash
  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
};

const getUserById = async (id) => {
  const user = await usersRepo.findUserById(id);
  if (!user) {
    return null;
  }
  
  // Return without password hash
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
};

const listUsers = async () => {
  return await usersRepo.findAllUsers();
};

const changePassword = async (userId, newPassword) => {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  return await usersRepo.updateUserPassword(userId, passwordHash);
};

const removeUser = async (userId) => {
  // Ensure at least one user remains
  const userCount = await usersRepo.countUsers();
  if (userCount <= 1) {
    throw new Error('Cannot delete the last user');
  }

  await usersRepo.deleteUser(userId);
};

module.exports = {
  createUser,
  authenticateUser,
  getUserById,
  listUsers,
  changePassword,
  removeUser,
};
