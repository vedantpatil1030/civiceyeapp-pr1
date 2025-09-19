import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance
const api = axios.create({
  baseURL: 'http://10.0.2.2:8000', // For Android Emulator accessing localhost
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post('http://10.0.2.2:8000/api/v1/users/refresh-token', {
          refreshToken
        });

        if (response.data?.data?.accessToken) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          // Save new tokens
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);

          // Update the failed request with new token and retry
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear all auth data
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        throw new Error('Session expired. Please login again.');
      }
    }

    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API methods for issues
export const issuesAPI = {
  getAllIssues: () => api.get('/api/v1/issues/all'),
  getMyIssues: () => api.get('/api/v1/issues/my-reports'),
  createIssue: (data) => api.post('/api/v1/issues/create', data),
  generateReport: (id) => api.get(`/api/v1/issues/${id}/report`),
};

// API methods for authentication
export const authAPI = {
  login: (email, password) => api.post('/users/login', { email, password }),
  register: (userData) => api.post('/users/register', userData),
  logout: () => api.post('/users/logout'),
  refreshToken: () => api.post('/users/refresh-token'),
};

export default api;