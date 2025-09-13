import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';


const defaultAvatar = 'https://www.svgrepo.com/show/382106/profile-avatar.svg';

const RegisterScreen = () => {
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false); 

  
  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid Phone', 'Enter a valid 10-digit phone number.');
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
      Alert.alert('OTP Sent', 'An OTP has been sent to your phone.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send OTP.');
    }
    setLoading(false);
  };

  
  const handleRegister = async () => {
    if (aadhaar.length !== 12) {
      Alert.alert('Invalid Aadhaar', 'Enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (!otp) {
      Alert.alert('Missing OTP', 'Please enter the OTP sent to your phone.');
      return;
    }
    setLoading(true);
    try {
      // --- Call backend API to register user ---
      // const response = await fetch('https://your-backend.com/api/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     name,
      //     email,
      //     phone,
      //     aadhaar,
      //     password,
      //     avatarUrl,
      //     otp,
      //   }),
      // });
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message || 'Registration failed');
      // --- End backend call ---

      Alert.alert('Registered', 'Registration successful!');
      
    } catch (err) {
      Alert.alert('Error', err.message || 'Registration failed.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Government App Registration</Text>
      <Image
        source={{ uri: avatarUrl || defaultAvatar }}
        style={styles.avatar}
      />
      {/* TODO: Add avatar upload/picker if needed */}
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={10}
      />
      <TextInput
        style={styles.input}
        placeholder="Aadhaar Number"
        value={aadhaar}
        onChangeText={setAadhaar}
        keyboardType="number-pad"
        maxLength={12}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {!otpSent ? (
        <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Sending OTP...' : 'Send OTP'}</Text>
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
          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Register'}</Text>
          </TouchableOpacity>
        </>
      )}
      {/* TODO: Add Terms & Conditions, Privacy Policy links */}
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
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: 'center',
    marginBottom: 16,
    backgroundColor: '#dfe6e9',
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

export default RegisterScreen;