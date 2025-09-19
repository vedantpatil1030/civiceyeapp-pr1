import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

const AuthLoadingScreen = ({ navigation }) => {
  useEffect(() => {
    const checkLogin = async () => {
      try {
        // Check if we have tokens
        const [accessToken, refreshToken] = await Promise.all([
          AsyncStorage.getItem('accessToken'),
          AsyncStorage.getItem('refreshToken')
        ]);

        if (!accessToken || !refreshToken) {
          throw new Error('No tokens found');
        }

        // Use our configured api instance to validate tokens
        const res = await api.get('/users/me');
        
        if (res.data?.data) {
          const { _id, fullName, role } = res.data.data;
          await AsyncStorage.setItem('user', JSON.stringify({ _id, fullName, role }));
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            return;
          }
        // Not logged in, go to login
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      } catch (error) {
        console.error('Auth check error:', error, error?.response?.data);
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
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