import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const AuthLoadingScreen = ({ navigation }) => {
  useEffect(() => {
    const checkLogin = async () => {
      try {
        console.log('🔍 Checking for saved tokens...');
        // Check if we have tokens
        const [accessToken, refreshToken] = await Promise.all([
          AsyncStorage.getItem('accessToken'),
          AsyncStorage.getItem('refreshToken')
        ]);

        console.log('Token check result:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          accessTokenLength: accessToken?.length,
          refreshTokenLength: refreshToken?.length
        });

        // If no tokens, just redirect to login without error
        if (!accessToken || !refreshToken) {
          console.log('❌ No tokens found, redirecting to login');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }

        // Use our configured api instance to validate tokens
        const res = await api.get('/users/me');
        
        if (res.data?.data || res.data?.user) {
          const userData = res.data.data || res.data.user;
          const { _id, fullName, role } = userData;
          await AsyncStorage.setItem('user', JSON.stringify({ _id, fullName, role }));
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
          return;
        }
        
        console.error('Invalid response format:', res.data);
        // Invalid response from server
        throw new Error('Invalid response from server');
      } catch (error) {
        console.error('Auth check error:', {
          message: error.message,
          response: error?.response?.data,
          status: error?.response?.status
        });

        // Only clear tokens if it's an authentication error
        if (error?.response?.status === 401 || error.message === 'Invalid response from server') {
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        }
        
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    };
    checkLogin();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
};

export default AuthLoadingScreen;