import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  useColorScheme 
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const LoginScreen = () => {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Step 1: Check if user exists
  const checkUserExists = async () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid Phone', 'Enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      // Ensure phone number is a string and remove any spaces
      const formattedPhone = phone.toString().trim();
      console.log('📞 Checking if user exists:', formattedPhone);
      const response = await axios.post("http://10.0.2.2:8000/api/v1/users/check-login", {
        mobileNumber: formattedPhone
      });

      console.log('✅ User check response:', response.data);
      
      if (response.data.statusCode === 200) {
        // User exists, proceed to send OTP
        await sendOtp();
      } else {
        Alert.alert(
          'User Not Found', 
          'No account found with this mobile number. Please register first.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Register', onPress: () => navigation.navigate('Register') }
          ]
        );
      }
    } catch (error) {
      console.log('❌ User check error:', error.response?.data?.message || error.message);
      if (error.response?.status === 404) {
        // This is an expected error when user is not registered
        Alert.alert(
          'Registration Required', 
          'This mobile number is not registered. Would you like to create a new account?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Register Now', onPress: () => navigation.navigate('Register') }
          ]
        );
      } else {
        // Handle other types of errors
        const errorMessage = error.response?.data?.message || 'Unable to connect to the server. Please check your internet connection.';
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Send OTP
  const sendOtp = async () => {
    try {
      console.log('📨 Sending OTP to:', phone);
      const response = await axios.post("http://10.0.2.2:8000/api/v1/otp/send", {
        mobileNumber: phone
      });

      console.log('✅ OTP sent response:', response.data);
      
      if (response.data.responseCode === 200) {
        setVerificationId(response.data.data.verificationId);
        setOtpSent(true);
        Alert.alert('OTP Sent', 'Please check your phone for the OTP code.');
      } else {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('❌ OTP send error:', error, error.response?.data);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to send OTP');
    }
  };

  // Step 3: Verify OTP and Login
  const handleLogin = async () => {
    if (!otp || otp.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit OTP sent to your phone.');
      return;
    }

    setLoading(true);
    try {
      // First verify OTP
      console.log('🔐 Verifying OTP:', otp);
      const otpResponse = await axios.post("http://10.0.2.2:8000/api/v1/otp/verify", {
        mobileNumber: phone,
        verificationId: verificationId,
        code: otp
      });

      console.log('✅ OTP verification response:', otpResponse.data);

      if (otpResponse.data.responseCode === 200) {
        // OTP verified, now login
        console.log('🔑 Logging in user:', phone);
        const loginResponse = await axios.post("http://10.0.2.2:8000/api/v1/users/login", {
          mobileNumber: phone
        });

        console.log('✅ Login response:', loginResponse.data);

        if (loginResponse.data.statusCode === 200) {
          const { user, accessToken, refreshToken } = loginResponse.data.data;
          
          // Store tokens and minimal user data for persistent login
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', refreshToken);
          const minimalUser = { _id: user._id, fullName: user.fullName, role: user.role };
          await AsyncStorage.setItem('user', JSON.stringify(minimalUser));

          Alert.alert('Login Successful', 'Welcome back!', [
            { text: 'OK', onPress: () => navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs', state: { index: 0, routes: [{ name: 'Report' }] } }],
              }) 
            }
          ]);
        } else {
          Alert.alert('Error', loginResponse.data.message || 'Login failed');
        }
      } else {
        Alert.alert('Invalid OTP', 'The OTP you entered is incorrect. Please try again.');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    setOtp('');
    await sendOtp();
  };

  const styles = getStyles(isDark);

  if (otpSent) {
    // OTP Verification Screen
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Verify Mobile Number</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit OTP sent to +91 {phone}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={4}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify & Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={resendOtp}>
            <Text style={styles.linkText}>Didn't receive OTP? Resend</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setOtpSent(false)}
          >
            <Text style={styles.linkText}>← Change Mobile Number</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Mobile Number Entry Screen
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Enter your mobile number to login</Text>

        <TextInput
          style={styles.input}
          placeholder="Mobile Number (10 digits)"
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={phone}
          onChangeText={setPhone}
          keyboardType="numeric"
          maxLength={10}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={checkUserExists}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.linkText}>Don't have an account? Register</Text>
        </TouchableOpacity>

        <View style={styles.quickLinksSection}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinkRow}>
            <TouchableOpacity style={styles.quickLinkButton} onPress={() => navigation.navigate('Map')}>
              <Text style={styles.quickLinkText}>Map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLinkButton} onPress={() => navigation.navigate('Report')}>
              <Text style={styles.quickLinkText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLinkButton} onPress={() => navigation.navigate('Status')}>
              <Text style={styles.quickLinkText}>Status</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickLinkButton} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.quickLinkText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const getStyles = (isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#000' : '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: isDark ? '#1a1a1a' : '#fff',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: isDark ? '#fff' : '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: isDark ? '#ccc' : '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: isDark ? '#2a2a2a' : '#fff',
    color: isDark ? '#fff' : '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#007AFF80',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  quickLinksSection: {
    marginTop: 20,
  },
  sectionTitle: {
    color: isDark ? '#fff' : '#333',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  quickLinkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  quickLinkButton: {
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#ddd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    margin: 4,
    backgroundColor: isDark ? '#2a2a2a' : '#fafafa',
  },
  quickLinkText: {
    color: isDark ? '#fff' : '#333',
    fontSize: 14,
  },
});

export default LoginScreen;

