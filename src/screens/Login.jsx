import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';

const LoginScreen = () => {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      if (isFocused) Alert.alert('Invalid Phone', 'Enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    try {
      // --- Call backend API to send OTP ---
      // const response = await fetch('https://your-backend.com/api/send-otp', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone }),
      // });
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message || 'Failed to send OTP');
      // --- End backend call ---

      setOtpSent(true);
      if (isFocused) Alert.alert('OTP Sent', 'An OTP has been sent to your phone.');
    } catch (err) {
      if (isFocused) Alert.alert('Error', err.message || 'Failed to send OTP.');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!otp) {
      if (isFocused) Alert.alert('Missing OTP', 'Please enter the OTP sent to your phone.');
      return;
    }
    setLoading(true);
    try {
      // --- Call backend API to verify OTP and login ---
      // const response = await fetch('https://your-backend.com/api/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phone, otp }),
      // });
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message || 'Login failed');
      // --- End backend call ---

      if (isFocused) Alert.alert('Login Success', 'You are now logged in!');
      // TODO: Navigate to home/dashboard screen after login
    } catch (err) {
      if (isFocused) Alert.alert('Error', err.message || 'Login failed.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={10}
      />
      {!otpSent ? (
        <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Sending OTP...' : 'Get OTP'}</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity
        style={{ marginTop: 24, alignSelf: 'center' }}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={{ color: '#0984e3', textDecorationLine: 'underline' }}>
          Don't have an account? Register
        </Text>
      </TouchableOpacity>
      {/* Link to Report page */}
      <TouchableOpacity
        style={{ marginTop: 16, alignSelf: 'center' }}
        onPress={() => navigation.navigate('Report')}
      >
        <Text style={{ color: '#00b894', textDecorationLine: 'underline' }}>
          Go to Report Issue
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f6fa',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#2d3436',
  },
  input: {
    borderWidth: 1,
    borderColor: '#b2bec3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#0984e3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
