import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

const AudioRecorderWrapper = ({ children }) => {
  const [key, setKey] = useState(0);

  // Force remount of child components
  const resetComponent = useCallback(() => {
    setKey(prevKey => prevKey + 1);
  }, []);

  return (
    <View 
      style={styles.container} 
      key={key}
      collapsable={false}
      removeClippedSubviews={true}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export default AudioRecorderWrapper;