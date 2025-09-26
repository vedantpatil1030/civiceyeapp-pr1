import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const [accessToken, userStr] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('user')
      ]);

      if (accessToken && userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      await handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = async (error) => {
    console.error('Auth error:', error);
    await handleLogout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }]
    });
    return {
      success: false,
      error: error.response?.data?.message || 'Authentication failed. Please login again.'
    };
  };

  const login = async (phone, otp) => {
    try {
      // First verify OTP
      const otpResponse = await api.post('/api/v1/otp/verify', {
        mobileNumber: phone,
        code: otp
      });

      if (otpResponse.data.responseCode === 200) {
        // OTP verified, now login
        const loginResponse = await api.post('/api/v1/users/login', {
          mobileNumber: phone
        });

        if (loginResponse.data.statusCode === 200) {
          const { user, accessToken, refreshToken } = loginResponse.data.data;
          
          // Store tokens and user data
          await AsyncStorage.multiSet([
            ['accessToken', accessToken],
            ['refreshToken', refreshToken],
            ['user', JSON.stringify(user)]
          ]);
          
          setUser(user);
          return { success: true };
        }
      }
      throw new Error(otpResponse.data.message || 'Login failed');
    } catch (error) {
      return handleAuthError(error);
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;