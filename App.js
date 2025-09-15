import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RegisterScreen from './src/screens/Register';
import LoginScreen from './src/screens/Login';
import ReportScreen from './src/screens/Report';
import StatusScreen from './src/screens/Status';
import MapScreen from './src/screens/Map';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Register">
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Report" component={ReportScreen} />
        <Stack.Screen name="Status" component={StatusScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}