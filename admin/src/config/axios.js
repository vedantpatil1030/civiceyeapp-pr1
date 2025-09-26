import axios from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Log axios configuration
console.log('Axios Instance Config:', {
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  withCredentials: true
});

// Add a request interceptor to automatically add the token
api.interceptors.request.use(
  (config) => {
    // Try to get token from multiple sources
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      // Ensure headers object exists
      config.headers = config.headers || {};
      
      // Set Authorization header with Bearer prefix
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

export default api;
