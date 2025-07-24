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
    const token = localStorage.getItem('authToken');
    if (token) {
      // Use standardized 'authToken' key
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
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
      
      // Log minimal error information
      console.error(`API Error: ${status} - ${error.config?.url}`);
      
      // Return normalized error object like http.js does
      return Promise.reject({
        status,
        message: data?.message || 'An error occurred',
        errors: data?.errors || {},
        data,
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Error: No response received');
      
      return Promise.reject({
        status: 0,
        message: 'No response received from server',
        errors: {},
      });
    } else {
      // Error in setting up the request
      console.error('API Error: Request setup failed');
      
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
      // Check if auth token exists
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      return await api.post('/deliveries', data);
    } catch (error) {
      console.error('Error in deliveryAPI.create');
      throw error;
    }
  },
  update: (id, data) => api.put(`/deliveries/${id}`, data),
  delete: async (id) => {
    try {
      if (!id) {
        throw new Error('Delivery ID is required');
      }
      
      return await api.delete(`/deliveries/${id}`);
    } catch (error) {
      console.error(`Error deleting delivery: ${error.message}`);
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
      // Check if auth token exists
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      return await api.post('/deliverers', data);
    } catch (error) {
      console.error('Error in delivererAPI.create');
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
  getProfile: async () => {
    try {
      // First try to get user from localStorage
      const storedUser = localStorage.getItem('user');
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        
        // If we have a stored user, use it but also try to refresh from API
        try {
          // Try to get fresh data from API in the background
          const response = await api.get('/users/profile');
          
          // If successful, update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(response));
          return response;
        } catch (apiError) {
          // If API call fails but we have stored user data, use the stored data
          return userData;
        }
      }
      
      // If no stored user, check for token and try API call
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Make API call
      const response = await api.get('/users/profile');
      
      // Store the fresh data
      localStorage.setItem('user', JSON.stringify(response));
      return response;
    } catch (error) {
      console.warn('Error fetching user profile');
      throw error;
    }
  },
  getById: id => api.get(`/users/${id}`),
  updateProfile: data => api.put('/users/profile', data),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  changePassword: data => api.put('/users/change-password', data),
  deactivate: id => api.put(`/users/${id}/deactivate`),
  delete: id => api.delete(`/users/${id}`),
  // Add the create method for admin user creation
  create: userData => api.post('/users', userData),
};



export const jobsAPI = {
  getStatus: async () => {
    try {
      const response = await api.get('/jobs/status');
      
      // Return null/empty response handling
      if (!response) {
        throw new Error('Empty response from jobs status API');
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching jobs status');
      
      // Return fallback data on error to prevent UI crashes
      return {
        isRunning: false,
        totalJobs: 0,
        activeJobs: 0,
        successRate: 0,
        lastRun: null,
        jobs: [],
        systemHealth: { 
          status: 'unknown',
          issuesCount: 0
        },
        recentRuns: []
      };
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
