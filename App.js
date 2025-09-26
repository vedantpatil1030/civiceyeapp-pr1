import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import RegisterScreen from './src/screens/Register';
import LoginScreen from './src/screens/Login';
import ReportScreen from './src/screens/Report';
import StatusScreen from './src/screens/Status';
import MapScreen from './src/screens/Map';
import AccountScreen from './src/screens/account';
import AccountIcon from './src/components/AccountIcon';
import AuthLoadingScreen from './src/screens/AuthLoading';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

import TabNavigator from './src/navigation/TabNavigator';

// Tab Navigator for main app screens
function MainTabs() {
  return (
    <TabNavigator />
  );
}

import { AuthProvider } from './src/contexts/AuthContext';

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AuthLoading">
        <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Account" component={AccountScreen} options={{ title: 'My Account' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}