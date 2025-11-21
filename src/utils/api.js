// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const api = {
  // Auth
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  },

  // Dashboard
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Products
  getProducts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/products?${queryString}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  updateProduct: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  },

  deleteProduct: async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  // Sellers
  getSellers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/sellers?${queryString}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  approveSeller: async (id) => {
    const response = await fetch(`${API_BASE_URL}/sellers/${id}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ paymentVerified: true })
    });
    return response.json();
  },

  rejectSeller: async (id) => {
    const response = await fetch(`${API_BASE_URL}/sellers/${id}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};
