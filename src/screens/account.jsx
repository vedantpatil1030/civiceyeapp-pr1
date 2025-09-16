import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
  PermissionsAndroid,
  Linking,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AccountScreen = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // User data state
  const [userDetails, setUserDetails] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    aadharNumber: '',
    gender: '',
    avatar: '',
    role: 'CITIZEN',
    createdAt: '',
  });

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setPageLoading(true);
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserDetails(user);
      } else {
        // If no user data in storage, you might want to fetch from API
        Alert.alert('Error', 'No user data found. Please login again.');
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setPageLoading(false);
    }
  };

  // Open edit modal for specific field
  const openEditModal = (field, currentValue) => {
    if (field === 'mobileNumber' || field === 'aadharNumber' || field === 'gender' || field === 'role') {
      Alert.alert('Cannot Edit', `${field} cannot be changed for security reasons.`);
      return;
    }
    setEditField(field);
    setEditValue(currentValue);
    setEditModalVisible(true);
  };

  // Update profile field
  const updateProfileField = async () => {
    if (!editValue.trim()) {
      Alert.alert('Error', 'Please enter a valid value');
      return;
    }

    if (editField === 'email' && !editValue.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.put(
        `http://10.0.2.2:8000/api/v1/users/update-profile`,
        { [editField]: editValue },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        // Update local state
        setUserDetails(prev => ({
          ...prev,
          [editField]: editValue,
        }));

        // Update AsyncStorage
        const updatedUser = { ...userDetails, [editField]: editValue };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

        Alert.alert('Success', 'Profile updated successfully');
        setEditModalVisible(false);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Pick and update avatar
  const updateAvatar = async () => {
    try {
      // Request permission on Android
      if (Platform.OS === 'android') {
        let permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        if (Platform.Version >= 33) {
          permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
        }
        const granted = await PermissionsAndroid.request(permission);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission required', 'Permission to access gallery is required!');
          return;
        }
      }

      // Launch image picker
      launchImageLibrary(
        {
          mediaType: 'photo',
          maxWidth: 300,
          maxHeight: 300,
          quality: 0.7,
        },
        async (response) => {
          if (response.didCancel) return;
          if (response.errorCode) {
            Alert.alert('Error', response.errorMessage || 'Failed to pick image.');
            return;
          }
          if (response.assets && response.assets.length > 0) {
            const imageUri = response.assets[0].uri;
            await uploadAvatar(imageUri);
          }
        }
      );
    } catch (error) {
      console.error('Avatar selection error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Upload avatar to server
  const uploadAvatar = async (imageUri) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });

      const response = await axios.put(
        `http://10.0.2.2:8000/api/v1/users/update-avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        const newAvatarUrl = response.data.data.avatar;
        setUserDetails(prev => ({ ...prev, avatar: newAvatarUrl }));
        
        // Update AsyncStorage
        const updatedUser = { ...userDetails, avatar: newAvatarUrl };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

        Alert.alert('Success', 'Avatar updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const styles = getStyles(isDark);

  if (pageLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={updateAvatar} style={styles.avatarContainer}>
          <Image
            source={{
              uri: userDetails.avatar || 'https://www.svgrepo.com/show/382106/profile-avatar.svg'
            }}
            style={styles.avatar}
          />
          <View style={styles.cameraIcon}>
            <Text style={styles.cameraIconText}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{userDetails.fullName}</Text>
        <Text style={styles.userRole}>{userDetails.role}</Text>
      </View>

      {/* Profile Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>

        {/* Editable Fields */}
        <ProfileItem
          label="Full Name"
          value={userDetails.fullName}
          editable={true}
          onEdit={() => openEditModal('fullName', userDetails.fullName)}
          isDark={isDark}
        />

        <ProfileItem
          label="Email Address"
          value={userDetails.email}
          editable={true}
          onEdit={() => openEditModal('email', userDetails.email)}
          isDark={isDark}
        />

        {/* Non-editable Fields */}
        <ProfileItem
          label="Mobile Number"
          value={userDetails.mobileNumber}
          editable={false}
          isDark={isDark}
        />

        <ProfileItem
          label="Aadhaar Number"
          value={userDetails.aadharNumber}
          editable={false}
          isDark={isDark}
        />

        <ProfileItem
          label="Gender"
          value={userDetails.gender?.charAt(0).toUpperCase() + userDetails.gender?.slice(1)}
          editable={false}
          isDark={isDark}
        />

        <ProfileItem
          label="Member Since"
          value={formatDate(userDetails.createdAt)}
          editable={false}
          isDark={isDark}
        />
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Map')}>
          <Text style={styles.actionIcon}>🗺️</Text>
          <Text style={styles.actionText}>View Civic Issues Map</Text>
          <Text style={styles.chevronIcon}>❯</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <Text style={styles.actionIcon}>🚪</Text>
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>Logout</Text>
          <Text style={styles.chevronIcon}>❯</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {editField}</Text>
            
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`Enter new ${editField}`}
              placeholderTextColor={isDark ? '#666' : '#999'}
              keyboardType={editField === 'email' ? 'email-address' : 'default'}
              autoCapitalize={editField === 'fullName' ? 'words' : 'none'}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={updateProfileField}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Profile Item Component
const ProfileItem = ({ label, value, editable, onEdit, isDark }) => {
  const styles = getStyles(isDark);
  
  return (
    <TouchableOpacity
      style={styles.profileItem}
      onPress={editable ? onEdit : null}
      disabled={!editable}
    >
      <View style={styles.profileItemLeft}>
        <Text style={styles.profileLabel}>{label}</Text>
        <Text style={styles.profileValue}>{value || 'Not set'}</Text>
      </View>
      {editable && (
        <Text style={styles.editIcon}>✏️</Text>
      )}
      {!editable && (
        <Text style={styles.lockIcon}>🔒</Text>
      )}
    </TouchableOpacity>
  );
};

const getStyles = (isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#000' : '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: isDark ? '#fff' : '#333',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: isDark ? '#1a1a1a' : '#fff',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333' : '#e0e0e0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: isDark ? '#333' : '#e0e0e0',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: isDark ? '#000' : '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? '#fff' : '#333',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  section: {
    backgroundColor: isDark ? '#1a1a1a' : '#fff',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDark ? '#fff' : '#333',
    marginBottom: 15,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333' : '#f0f0f0',
  },
  profileItemLeft: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 14,
    color: isDark ? '#ccc' : '#666',
    marginBottom: 5,
  },
  profileValue: {
    fontSize: 16,
    color: isDark ? '#fff' : '#333',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#333' : '#f0f0f0',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: isDark ? '#fff' : '#333',
    marginLeft: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: isDark ? '#1a1a1a' : '#fff',
    borderRadius: 15,
    padding: 25,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: isDark ? '#fff' : '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: isDark ? '#fff' : '#333',
    backgroundColor: isDark ? '#2a2a2a' : '#fff',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: isDark ? '#333' : '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: isDark ? '#fff' : '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AccountScreen;
