import React from 'react';
import { TouchableOpacity, StyleSheet, useColorScheme, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const AccountIcon = ({ style, navigation }) => {
  // Accept navigation as prop for headerRight, fallback to useNavigation
  const nav = navigation || useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const navigateToAccount = () => {
    nav.navigate('Account');
  };

  return (
    <TouchableOpacity
      style={[styles.container, isDark && styles.containerDark, style]}
      onPress={navigateToAccount}
      activeOpacity={0.7}
    >
      <Text style={[styles.icon, isDark && styles.iconDark]}>👤</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  containerDark: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
  },
  icon: {
    fontSize: 20,
    color: '#007AFF',
  },
  iconDark: {
    color: '#fff',
  },
});

export default AccountIcon;