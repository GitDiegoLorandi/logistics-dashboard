import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
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
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Log detailed error information
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: credentials => api.post('/auth/login', credentials),
  register: userData => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

export const deliveryAPI = {
  getAll: params => api.get('/deliveries', { params }),
  getById: id => api.get(`/deliveries/${id}`),
  create: data => api.post('/deliveries', data),
  update: (id, data) => api.put(`/deliveries/${id}`, data),
  delete: id => api.delete(`/deliveries/${id}`),
  updateStatus: (id, status) =>
    api.patch(`/deliveries/${id}/status`, { status }),
  assign: (id, delivererId) =>
    api.patch(`/deliveries/${id}/assign`, { delivererId }),
};

export const delivererAPI = {
  getAll: params => api.get('/deliverers', { params }),
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
