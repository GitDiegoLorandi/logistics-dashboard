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
      console.log(`Request to ${config.url}: Adding Authorization header with token`);
      console.log(`Token first 15 chars: ${token.substring(0, 15)}...`);
      
      try {
        // Log the token's payload (without verification)
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        
        // Check the specific format of userId to help debug the issue
        if (payload.userId) {
          console.log(`UserId in token: ${payload.userId}`);
          console.log(`UserId type: ${typeof payload.userId}`);
          console.log(`UserId length: ${payload.userId.length}`);
          console.log(`Is valid MongoDB ObjectId: ${/^[0-9a-fA-F]{24}$/.test(payload.userId)}`);
        } else if (payload.id) {
          console.log(`Id in token: ${payload.id}`);
          console.log(`Id type: ${typeof payload.id}`);
          console.log(`Id length: ${payload.id.length}`);
          console.log(`Is valid MongoDB ObjectId: ${/^[0-9a-fA-F]{24}$/.test(payload.id)}`);
        } else if (payload.sub) {
          console.log(`Sub in token: ${payload.sub}`);
          console.log(`Sub type: ${typeof payload.sub}`);
          console.log(`Sub length: ${payload.sub.length}`);
          console.log(`Is valid MongoDB ObjectId: ${/^[0-9a-fA-F]{24}$/.test(payload.sub)}`);
        } else {
          console.warn('Warning: Token does not contain userId, id, or sub in payload');
        }
      } catch (e) {
        console.error('Error parsing token:', e);
      }
      
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log(`Request to ${config.url}: No auth token found`);
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
    console.log('Login response received:', data);
    // Store token in localStorage
    if (data.token) {
      console.log('Storing auth token in localStorage');
      localStorage.setItem('authToken', data.token);
      
      // Store user data if available
      if (data.user) {
        console.log('Storing user data in localStorage:', data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } else {
      console.warn('No token received in login response');
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
      console.log('deliveryAPI.create: Creating delivery with data:', data);
      
      // Check if auth token exists
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('deliveryAPI.create: No authentication token found');
        throw new Error('Authentication required. Please log in.');
      }
      console.log('deliveryAPI.create: Auth token found, length:', token.length);
      
      // Log the request details
      console.log('deliveryAPI.create: Making POST request to /deliveries');
      console.log('deliveryAPI.create: Request headers will include Authorization: Bearer [token]');
      
      // Make the API call with detailed logging
      console.log('deliveryAPI.create: About to make axios POST request');
      try {
        const response = await api.post('/deliveries', data);
        console.log('deliveryAPI.create: Create delivery response:', response);
        return response;
      } catch (axiosError) {
        console.error('deliveryAPI.create: Axios error during POST request:', axiosError);
        throw axiosError;
      }
    } catch (error) {
      console.error('Error in deliveryAPI.create:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
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
      console.log('API: Auth token found, length:', token.length);
      
      // Log the request details
      console.log('API: Making POST request to /deliverers');
      console.log('API: Request headers will include Authorization: Bearer [token]');
      
      // Make the API call with detailed logging
      console.log('API: About to make axios POST request');
      try {
        const response = await api.post('/deliverers', data);
        console.log('API: Create deliverer response:', response);
        return response;
      } catch (axiosError) {
        console.error('API: Axios error during POST request:', axiosError);
        throw axiosError;
      }
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
  getProfile: async () => {
    try {
      console.log('Fetching user profile...');
      // First try to get user from localStorage
      const storedUser = localStorage.getItem('user');
      
      if (storedUser) {
        console.log('Found user data in localStorage');
        const userData = JSON.parse(storedUser);
        
        // If we have a stored user, use it but also try to refresh from API
        try {
          // Try to get fresh data from API in the background
          const response = await api.get('/users/profile');
          console.log('User profile refreshed from API:', response);
          
          // If successful, update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(response));
          return response;
        } catch (apiError) {
          // If API call fails but we have stored user data, use the stored data
          console.warn('Could not refresh user profile from API, using stored data');
          console.warn('API error:', apiError);
          return userData;
        }
      }
      
      // If no stored user, check for token and try API call
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('No authentication token found when fetching user profile');
        throw new Error('Authentication required');
      }
      
      // Make API call
      const response = await api.get('/users/profile');
      console.log('User profile fetched successfully:', response);
      
      // Store the fresh data
      localStorage.setItem('user', JSON.stringify(response));
      return response;
    } catch (error) {
      console.warn('Error fetching user profile:', error);
      console.warn('Status code:', error.status || 'No status code');
      console.warn('Error message:', error.message || 'No error message');
      
      // Check if we can use authAPI to get current user
      try {
        const currentUser = await authAPI.getCurrentUser();
        console.log('Retrieved user from auth API:', currentUser);
        localStorage.setItem('user', JSON.stringify(currentUser));
        return currentUser;
      } catch (authError) {
        console.warn('Could not retrieve user from auth API:', authError);
        
        // Last resort: return mock data only if everything else fails
        const mockUser = {
          id: 'mock-user-id',
          firstName: 'Demo',
          lastName: 'User',
          email: 'demo@example.com',
          phone: '555-123-4567',
          role: 'admin',
          avatar: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        console.log('Using mock user data as last resort:', mockUser);
        return mockUser;
      }
    }
  },
  getById: id => api.get(`/users/${id}`),
  updateProfile: data => api.put('/users/profile', data),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  changePassword: data => api.put('/users/change-password', data),
  deactivate: id => api.put(`/users/${id}/deactivate`),
  delete: id => api.delete(`/users/${id}`),
};



export const jobsAPI = {
  getStatus: async () => {
    try {
      console.log('jobsAPI.getStatus: Making GET request to /jobs/status');
      
      // Check if auth token exists
      const token = localStorage.getItem('authToken');
      console.log('jobsAPI.getStatus: Auth token exists:', !!token);
      
      const response = await api.get('/jobs/status');
      console.log('jobsAPI.getStatus: Response received:', response);
      
      // The backend should now return data in exactly the format we need
      if (!response) {
        throw new Error('Empty response from jobs status API');
      }
      
      return response;
    } catch (error) {
      console.error('Error in jobsAPI.getStatus:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
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
