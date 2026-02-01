const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://convite-gustavo-lerner.onrender.com';
const AUTH_TOKEN_KEY = 'admin_auth_token';
const AUTH_USERNAME_KEY = 'admin_username';
const AUTH_EXPIRES_KEY = 'admin_token_expires';

export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success && data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USERNAME_KEY, data.username);
      
      // Calculate expiration time
      const expiresIn = data.expiresIn || '24h';
      const hours = expiresIn.includes('h') ? parseInt(expiresIn) : 24;
      const expiresAt = Date.now() + (hours * 60 * 60 * 1000);
      localStorage.setItem(AUTH_EXPIRES_KEY, expiresAt.toString());
      
      return true;
    }

    return false;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USERNAME_KEY);
  localStorage.removeItem(AUTH_EXPIRES_KEY);
};

export const isAuthenticated = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const expiresAt = localStorage.getItem(AUTH_EXPIRES_KEY);
  
  if (!token) {
    return false;
  }
  
  // Check if token is expired
  if (expiresAt && Date.now() > parseInt(expiresAt)) {
    logout();
    return false;
  }
  
  return true;
};

export const getUsername = () => {
  return localStorage.getItem(AUTH_USERNAME_KEY);
};

export const getToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
