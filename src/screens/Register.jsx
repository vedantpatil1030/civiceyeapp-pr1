import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, Platform, PermissionsAndroid, Linking } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker'; // For bare RN, use react-native-image-picker.
import { useNavigation, useIsFocused } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Uncomment when ready to use

const defaultAvatar = 'https://www.svgrepo.com/show/382106/profile-avatar.svg';

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [gender, setGender] = useState('');
  
  const [avatarUrl, setAvatarUrl] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // Function to pick image from gallery
  const pickAvatar = async () => {
    // Request permission on Android
    if (Platform.OS === 'android') {
      let permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
      if (Platform.Version >= 33) {
        permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
      }
      const granted = await PermissionsAndroid.request(
        permission,
        {
          title: 'Permission Required',
          message: 'App needs access to your photos to select an avatar.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        if (isFocused) {
          Alert.alert(
            'Permission required',
            'Permission to access gallery is required! Please enable it from app settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
        }
        return;
      }
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        if (isFocused) Alert.alert('Permission required', 'Permission to access gallery is required!');
        return;
      }
    }
    // Launch image picker
    launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 300,
        maxHeight: 300,
        quality: 0.5,
        includeBase64: false,
      },
      (response) => {
        if (response.didCancel) {
          // User cancelled image picker
          return;
        } else if (response.errorCode) {
          if (isFocused) Alert.alert('Error', response.errorMessage || 'Failed to pick image.');
          return;
        } else if (response.assets && response.assets.length > 0) {
          setAvatarUrl(response.assets[0].uri);
        }
      }
    );
  };

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
      // --- End backend call 

      setOtpSent(true);
      if (isFocused) Alert.alert('OTP Sent', 'An OTP has been sent to your phone.');
    } catch (err) {
      if (isFocused) Alert.alert('Error', err.message || 'Failed to send OTP.');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (aadhaar.length !== 12) {
      if (isFocused) Alert.alert('Invalid Aadhaar', 'Enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (!otp) {
      if (isFocused) Alert.alert('Missing OTP', 'Please enter the OTP sent to your phone.');
      return;
    }
    if (!gender) {
      if (isFocused) Alert.alert('Missing Gender', 'Please select your gender.');
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
      //     gender,
      //     avatarUrl, // Send avatar URI or upload to server as needed
      //     otp,
      //   }),
      // });
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message || 'Registration failed');
      // // Save token to AsyncStorage for persistent login
      // await AsyncStorage.setItem('authToken', data.token);
      // --- End backend call ---

      if (isFocused) Alert.alert('Registered', 'Registration successful!');
    } catch (err) {
      if (isFocused) Alert.alert('Error', err.message || 'Registration failed.');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Add Login navigation option */}
      <TouchableOpacity
        style={{ marginBottom: 18, alignSelf: 'center' }}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={{ color: '#0984e3', textDecorationLine: 'underline' }}>
          Already registered? Login
        </Text>
      </TouchableOpacity>
      <Text style={styles.title}>Government App Registration</Text>
      <TouchableOpacity onPress={pickAvatar}>
        <Image
          source={{ uri: avatarUrl || defaultAvatar }}
          style={styles.avatar}
        />
        <Text style={{ textAlign: 'center', color: '#0984e3', marginBottom: 10 }}>
          Select Avatar
        </Text>
      </TouchableOpacity>
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
      {/* Gender Radio Buttons */}
      <Text style={styles.genderLabel}>Gender</Text>
      <View style={styles.genderContainer}>
        {genderOptions.map(option => (
          <TouchableOpacity
            key={option.value}
            style={styles.genderOption}
            onPress={() => setGender(option.value)}
          >
            <View style={[
              styles.radioOuter,
              gender === option.value && styles.radioOuterSelected
            ]}>
              {gender === option.value && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.genderText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
    marginBottom: 4,
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
  genderLabel: {
    marginBottom: 6,
    marginLeft: 2,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'center',
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#b2bec3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  radioOuterSelected: {
    borderColor: '#0984e3',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0984e3',
  },
  genderText: {
    fontSize: 16,
    color: '#2d3436',
  },
});

export default RegisterScreen;