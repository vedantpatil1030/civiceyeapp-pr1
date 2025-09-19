// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// API endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  
  // Users
  USERS: '/users',
  USER_BY_ID: (id) => `/users/${id}`,
  
  // Issues
  ISSUES: '/issues',
  ISSUE_BY_ID: (id) => `/issues/${id}`,
  ISSUE_STATUS: (id) => `/issues/${id}/status`,
  
  // Departments
  DEPARTMENTS: '/departments',
  DEPARTMENT_BY_ID: (id) => `/departments/${id}`,
};

// API request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// API response status codes
export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};