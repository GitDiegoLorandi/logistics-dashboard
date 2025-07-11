import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Centralized HTTP client for API requests
 * Includes interceptors for authentication, error handling, and request/response transformation
 */
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds (increased from 10000)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    // Use standardized 'authToken' key
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  response => response.data, // Extract data directly like http.js does
  error => {
    if (error.response) {
      // Server responded with an error status code
      const { status, data } = error.response;
      
      // Handle authentication errors
      if (status === 401) {
        // Token expired or invalid
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      // Log detailed error information
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status,
        statusText: error.response?.statusText,
        data,
      });
      
      // Return normalized error object like http.js does
      return Promise.reject({
        status,
        message: data?.message || 'An error occurred',
        errors: data?.errors || {},
        data,
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Error: No response received', {
        url: error.config?.url,
        method: error.config?.method,
      });
      
      return Promise.reject({
        status: 0,
        message: 'No response received from server',
        errors: {},
      });
    } else {
      // Error in setting up the request
      console.error('API Error: Request setup failed', error.message);
      
      return Promise.reject({
        status: 0,
        message: error.message || 'Request setup failed',
        errors: {},
      });
    }
  }
);

// API endpoints
export const authAPI = {
  login: credentials => api.post('/auth/login', credentials).then(data => {
    // Store token in localStorage
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      
      // Store user data if available
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    }
    return data;
  }),
  register: userData => api.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return api.post('/auth/logout');
  },
  getCurrentUser: () => api.get('/auth/me'),
  isAuthenticated: () => !!localStorage.getItem('authToken'),
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export const deliveryAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/deliveries', { params });
      
      // Handle both paginated and non-paginated responses
      if (Array.isArray(response)) {
        return {
          docs: response,
          totalDocs: response.length,
          totalPages: 1,
          page: 1
        };
      }
      return response || { docs: [], totalDocs: 0, totalPages: 0, page: 1 };
    } catch (error) {
      throw error;
    }
  },
  getById: id => api.get(`/deliveries/${id}`),
  create: data => api.post('/deliveries', data),
  update: (id, data) => api.put(`/deliveries/${id}`, data),
  delete: id => api.delete(`/deliveries/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/deliveries/${id}/status`, { status }),
  assign: (id, delivererId) =>
    api.patch(`/deliveries/${id}/assign`, { delivererId }),
  getAvailable: () => api.get('/deliveries/available'),
};

export const delivererAPI = {
  getAll: async (params) => {
    try {
      const response = await api.get('/deliverers', { params });
      // Handle both paginated and non-paginated responses
      return response || [];
    } catch (error) {
      throw error;
    }
  },
  getById: id => api.get(`/deliverers/${id}`),
  create: data => api.post('/deliverers', data),
  update: (id, data) => api.put(`/deliverers/${id}`, data),
  delete: id => api.delete(`/deliverers/${id}`),
  getStats: (id, params) => api.get(`/deliverers/${id}/stats`, { params }),
  updateStatus: (id, status) =>
    api.patch(`/deliverers/${id}/status`, { status }),
  assignDelivery: (id, deliveryId) =>
    api.patch(`/deliverers/${id}/assign`, { deliveryId }),
  getAvailableDeliveries: () => api.get('/deliveries/available'),
};

export const userAPI = {
  getAll: params => api.get('/users', { params }),
  getProfile: () => api.get('/users/profile'),
  getById: id => api.get(`/users/${id}`),
  updateProfile: data => api.put('/users/profile', data),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  changePassword: data => api.put('/users/change-password', data),
  deactivate: id => api.put(`/users/${id}/deactivate`),
  delete: id => api.delete(`/users/${id}`),
};

export const statisticsAPI = {
  getOverall: () => api.get('/statistics/overall'),
  getByStatus: () => api.get('/statistics/status'),
  getByDateRange: params => api.get('/statistics/date-range', { params }),
  getDelivererPerformance: () => api.get('/statistics/deliverers'),
  getTrends: () => api.get('/statistics/trends'),
  getPriority: () => api.get('/statistics/priority'),
};

export const jobsAPI = {
  getStatus: () => api.get('/jobs/status'),
  getHealth: () => api.get('/jobs/health'),
  getPerformance: () => api.get('/jobs/performance'),
  getDashboard: () => api.get('/jobs/dashboard'),
  runJob: jobName => api.post(`/jobs/run/${jobName}`),
  startAllJobs: () => api.post('/jobs/start'),
  stopAllJobs: () => api.post('/jobs/stop'),
};

export default api;
