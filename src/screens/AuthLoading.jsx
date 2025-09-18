import React, { useEffect } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthLoadingScreen = ({ navigation }) => {
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        console.log('ACCESS TOKEN:', token); // Log token to Metro/terminal
        if (token) {
          // Try to fetch user profile
          const res = await axios.get('http://10.0.2.2:8000/api/v1/users/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data && res.data.data) {
            // User is logged in, go to main app
            // Only store minimal user info
            const { _id, fullName, role } = res.data.data;
            await AsyncStorage.setItem('user', JSON.stringify({ _id, fullName, role }));
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            return;
          }
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