const { getPool } = require('../config/database');

const createUsersTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await client.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS password_hash TEXT,
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin',
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
  `);

  // Create index on username for faster lookups
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);
};

const insertUser = async ({ id, username, passwordHash, role }) => {
  const client = await getPool().connect();
  try {
    await client.query(
      `INSERT INTO users (id, username, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      [id, username, passwordHash, role || 'admin']
    );
  } finally {
    client.release();
  }
};

const findUserByUsername = async (username) => {
  const client = await getPool().connect();
  try {
    const { rows } = await client.query(
      `SELECT id, username, password_hash, role, created_at, updated_at
       FROM users
       WHERE username = $1`,
      [username]
    );
    return rows[0] || null;
  } finally {
    client.release();
  }
};

const findUserById = async (id) => {
  const client = await getPool().connect();
  try {
    const { rows } = await client.query(
      `SELECT id, username, password_hash, role, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  } finally {
    client.release();
  }
};

const findAllUsers = async () => {
  const client = await getPool().connect();
  try {
    const { rows } = await client.query(
      `SELECT id, username, role, created_at, updated_at
       FROM users
       ORDER BY created_at ASC`
    );
    return rows;
  } finally {
    client.release();
  }
};

const updateUserPassword = async (id, passwordHash) => {
  const client = await getPool().connect();
  try {
    const { rows } = await client.query(
      `UPDATE users
       SET password_hash = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, username, role, created_at, updated_at`,
      [id, passwordHash]
    );
    return rows[0] || null;
  } finally {
    client.release();
  }
};

const deleteUser = async (id) => {
  const client = await getPool().connect();
  try {
    await client.query(
      `DELETE FROM users WHERE id = $1`,
      [id]
    );
  } finally {
    client.release();
  }
};

const countUsers = async () => {
  const client = await getPool().connect();
  try {
    const { rows } = await client.query('SELECT COUNT(*) as count FROM users');
    return parseInt(rows[0].count);
  } finally {
    client.release();
  }
};

module.exports = {
  createUsersTable,
  insertUser,
  findUserByUsername,
  findUserById,
  findAllUsers,
  updateUserPassword,
  deleteUser,
  countUsers,
};
