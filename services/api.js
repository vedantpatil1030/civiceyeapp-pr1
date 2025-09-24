import axios from "axios";
import { getAccessToken, refreshTokens } from "./authService";
//baseURL : "http://10.0.2.2:8000/api/v1",

const api = axios.create({
    baseURL: "http://10.0.2.2:8000/api/v1",  // Android Studio emulator special IP
    timeout: 10000, // 10 second timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

//Attach Token before request
api.interceptors.request.use(async (config) => {
    const token = await getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

//Handle Expired Token and other errors
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;
        
        // Log the error details
        console.log('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            message: error.response?.data?.message,
            data: error.response?.data
        });

        // Special handling for common errors
        if (error.response?.data?.message === 'User already exists, please login') {
            throw error; // Let the component handle the redirection
        }

        // Handle token expiration
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                console.log('🔄 Attempting to refresh token...');
                const newAccessToken = await refreshTokens();
                if (newAccessToken) {
                    console.log('✅ Token refreshed successfully');
                    // Update the failed request with new token
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                } else {
                    console.log('❌ Token refresh failed - no new token received');
                    await clearTokens(); // Clean up any invalid tokens
                    throw new Error('Authentication failed. Please login again.');
                }
            } catch (refreshError) {
                console.error('❌ Token refresh error:', refreshError);
                await clearTokens(); // Clean up any invalid tokens
                throw new Error('Session expired. Please login again.');
            }
        }

        // Handle network errors
        if (!error.response) {
            throw new Error('Network error. Please check your connection.');
        }

        // Handle other errors
        const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
        error.message = errorMessage;
        return Promise.reject(error);
    }
);

export default api;