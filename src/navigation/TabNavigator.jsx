import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthProvider } from '../contexts/AuthContext';

// Import screens
import Home from '../screens/Home';
import Report from '../screens/Report';
import Map from '../screens/Map';
import Status from '../screens/Status';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <AuthProvider>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={Home}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="home" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Report"
          component={Report}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="plus-circle" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Map"
          component={Map}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="map" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Status"
          component={Status}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="clipboard-list" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingBottom: 5,
    paddingTop: 5,
  },
});

export default TabNavigator;