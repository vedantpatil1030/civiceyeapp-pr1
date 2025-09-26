import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance
const api = axios.create({
  baseURL: 'http://10.0.2.2:8000', // For Android Emulator accessing localhost
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  validateStatus: status => status >= 200 && status < 500, // Handle all non-500 errors in responses
  // Add retry configuration
  retry: 3,
  retryDelay: (retryCount) => retryCount * 1000, // 1s, 2s, 3s
  shouldRetry: (error) => {
    const shouldRetry = !error.response || error.code === 'ECONNABORTED';
    return shouldRetry;
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
        // If refresh fails, clear all auth data and provide detailed error
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        console.error('Token refresh failed:', {
          message: refreshError.message,
          response: refreshError.response?.data,
          status: refreshError.response?.status
        });
        return Promise.reject(new Error('Your session has expired. Please login again.'));
      }
    }

    // Enhanced error handling for different scenarios
    if (!error.response) {
      // Network error
      console.error('Network Error:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout
        }
      });
      
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('Request timed out. Please try again.'));
      }
      
      if (!navigator.onLine) {
        return Promise.reject(new Error('No internet connection. Please check your network.'));
      }
      
      return Promise.reject(new Error('Network error. Unable to connect to server.'));
    }

    // Log API errors with detailed information
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Return a more user-friendly error message
    const errorMessage = error.response?.data?.message || 'An unexpected error occurred. Please try again.';
    return Promise.reject(new Error(errorMessage));
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