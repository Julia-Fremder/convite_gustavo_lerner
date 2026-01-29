/* global process, URLSearchParams */

/**
 * API Client Service
 * Centralized HTTP request handler for all API calls
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

/**
 * Generic request handler with error handling
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      headers: defaultHeaders,
      ...options,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMessage = data.error || data.details || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
};

/**
 * Data/Confirmations APIs
 */
export const confirmationAPI = {
  post: (payload) =>
    request('/api/save-data', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getByEmail: (email) => {
    const params = new URLSearchParams({ email });
    return request(`/api/confirmations?${params.toString()}`);
  },
};

/**
 * Payment APIs
 */
export const paymentAPI = {
  // Pix payment
  generatePix: (payload) =>
    request('/api/pix', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // MBWay payment
  generateMbway: (payload) =>
    request('/api/mbway', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Payment records
  create: (payload) =>
    request('/api/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  list: (email) => {
    const params = new URLSearchParams();
    if (email) params.set('email', email);
    const query = params.toString();
    return request(`/api/payments${query ? `?${query}` : ''}`);
  },

  update: (id, payload) =>
    request(`/api/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

/**
 * Health Check API
 */
export const healthAPI = {
  check: () => request('/api/health'),
};

/**
 * Content API
 */
export const contentAPI = {
  fetch: async () => {
    try {
      const publicUrl = process.env.PUBLIC_URL || '';
      const response = await fetch(`${publicUrl}/content.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Content API Error:', error.message);
      throw error;
    }
  },
};

export default {
  confirmationAPI,
  paymentAPI,
  healthAPI,
  contentAPI,
};
