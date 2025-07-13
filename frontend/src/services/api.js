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
  create: async (data) => {
    try {
      const response = await api.post('/deliveries', data);
      return response;
    } catch (error) {
      console.error('Error in deliveryAPI.create:', error);
      throw error;
    }
  },
  update: (id, data) => api.put(`/deliveries/${id}`, data),
  delete: async (id) => {
    try {
      if (!id) {
        throw new Error('Delivery ID is required');
      }
      
      console.log(`API: Deleting delivery with ID: ${id}`);
      const response = await api.delete(`/deliveries/${id}`);
      return response;
    } catch (error) {
      console.error(`Error in deliveryAPI.delete for ID ${id}:`, error);
      throw error;
    }
  },
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
  create: async (data) => {
    try {
      console.log('API: Creating deliverer with data:', data);
      
      // Check if auth token exists
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No authentication token found');
        throw new Error('Authentication required. Please log in.');
      }
      
      const response = await api.post('/deliverers', data);
      console.log('API: Create deliverer response:', response);
      return response;
    } catch (error) {
      console.error('Error in delivererAPI.create:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      throw error;
    }
  },
  update: async (id, data) => {
    try {
      const response = await api.put(`/deliverers/${id}`, data);
      return response;
    } catch (error) {
      console.error(`Error in delivererAPI.update for ID ${id}:`, error);
      throw error;
    }
  },
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
  getStatus: async () => {
    try {
      const response = await api.get('/jobs/status');
      return response || {
        jobStatus: { 
          isRunning: false,
          activeJobs: 0,
          totalJobs: 0,
          successRate: 0,
          lastRun: null,
          jobs: []
        },
        systemHealth: { 
          status: 'unknown',
          issuesCount: 0
        },
        recentRuns: []
      };
    } catch (error) {
      console.error('Error in jobsAPI.getStatus:', error);
      throw error;
    }
  },
  getHealth: async () => {
    try {
      const response = await api.get('/jobs/health');
      return response;
    } catch (error) {
      console.error('Error in jobsAPI.getHealth:', error);
      throw error;
    }
  },
  getPerformance: async () => {
    try {
      const response = await api.get('/jobs/performance');
      return response;
    } catch (error) {
      console.error('Error in jobsAPI.getPerformance:', error);
      throw error;
    }
  },
  getDashboard: async () => {
    try {
      const response = await api.get('/jobs/dashboard');
      return response;
    } catch (error) {
      console.error('Error in jobsAPI.getDashboard:', error);
      throw error;
    }
  },
  runJob: async (jobName) => {
    try {
      const response = await api.post(`/jobs/run/${jobName}`);
      return response;
    } catch (error) {
      console.error(`Error in jobsAPI.runJob for job ${jobName}:`, error);
      throw error;
    }
  },
  startJob: async (jobName) => {
    try {
      const response = await api.post(`/jobs/run/${jobName}`);
      return response;
    } catch (error) {
      console.error(`Error in jobsAPI.startJob for job ${jobName}:`, error);
      throw error;
    }
  },
  stopJob: async (jobName) => {
    try {
      const response = await api.post(`/jobs/stop/${jobName}`);
      return response;
    } catch (error) {
      console.error(`Error in jobsAPI.stopJob for job ${jobName}:`, error);
      throw error;
    }
  },
  startAllJobs: async () => {
    try {
      const response = await api.post('/jobs/start');
      return response;
    } catch (error) {
      console.error('Error in jobsAPI.startAllJobs:', error);
      throw error;
    }
  },
  stopAllJobs: async () => {
    try {
      const response = await api.post('/jobs/stop');
      return response;
    } catch (error) {
      console.error('Error in jobsAPI.stopAllJobs:', error);
      throw error;
    }
  },
};

export default api;
