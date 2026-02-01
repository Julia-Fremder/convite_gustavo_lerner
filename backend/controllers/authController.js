const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const login = async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    // Authenticate against database
    const user = await userService.authenticateUser(username, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      token,
      username: user.username,
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

const verify = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.body?.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.json({ 
        success: true, 
        valid: true,
        username: decoded.username,
        role: decoded.role,
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.json({ 
          success: true, 
          valid: false,
          error: 'Token expired',
        });
      }
      return res.json({ 
        success: true, 
        valid: false,
        error: 'Invalid token',
      });
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

module.exports = {
  login,
  verify,
};
