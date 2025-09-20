import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import AccountIcon from '../components/AccountIcon';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  useColorScheme,
  Image,
  Dimensions,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';

const categories = [
  { id: 'INFRASTRUCTURE', name: 'Infrastructure', icon: '🏗️', color: '#ff4757' },
  { id: 'SAFETY', name: 'Safety', icon: '🚨', color: '#ff6b6b' },
  { id: 'ENVIRONMENT', name: 'Environment', icon: '🌱', color: '#2ed573' },
  { id: 'TRANSPORT', name: 'Transport', icon: '🚗', color: '#ffa502' },
  { id: 'CLEANLINESS', name: 'Cleanliness', icon: '🧹', color: '#3742fa' },
  { id: 'GOVERNANCE', name: 'Governance', icon: '🏛️', color: '#161120ff' },
  { id: 'OTHER', name: 'Other', icon: '📝', color: '#747d8c' },
];

const ReportScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [audioFile, setAudioFile] = useState(null);
  const [accessToken, setAccessToken] = useState('');

  // If you need to perform cleanup or initialization, use useEffect properly.
  // Example placeholder (remove or adjust as needed):
  // useEffect(() => {
  //   // Initialization code here
  //   return () => {
  //     // Cleanup code here
  //   };
  // }, []);
  
  const isDarkMode = useColorScheme() === 'dark';
  
  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff',
  };
  
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const cardBgColor = isDarkMode ? '#1a1a1a' : '#ffffff';
  const borderColor = isDarkMode ? '#333333' : '#e1e8ed';

  const checkPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);

        const recordAudioGranted =
          grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED;
        const writeStorageGranted =
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED;

        if (!recordAudioGranted || !writeStorageGranted) {
          Alert.alert('Permissions Required', 'App needs microphone and storage permissions to record audio.');
          return false;
        }
        return true;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const onStartRecord = async () => {
    try {
      const hasPermission = await checkPermission();
      if (!hasPermission) return;

      // Clean up any existing recording session
      if (isRecording || recordBackListener.current) {
        await onStopRecord();
      }

      const audioPath = Platform.select({
        ios: 'issue_report.m4a',
        android: `${Platform.OS === 'android' ? 'sdcard/' : ''}issue_report.mp4`,
      });

      // Make sure we have a valid recorder instance
      if (!audioRecorderPlayer.current) {
        audioRecorderPlayer.current = new AudioRecorderPlayer();
      }

      await audioRecorderPlayer.current.startRecorder(audioPath);
      
      // Store the listener reference so we can remove it later
      recordBackListener.current = audioRecorderPlayer.current.addRecordBackListener((e) => {
        setRecordedTime(audioRecorderPlayer.current.mmssss(Math.floor(e.currentPosition)));
      });
      
      setIsRecording(true);
    } catch (error) {
      console.error('Recording failed to start:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const onStopRecord = async () => {
    try {
      if (!audioRecorderPlayer.current) return;

      let result = null;
      if (isRecording) {
        result = await audioRecorderPlayer.current.stopRecorder();
      }

      if (recordBackListener.current) {
        audioRecorderPlayer.current.removeRecordBackListener();
        recordBackListener.current = null;
      }

      setIsRecording(false);
      if (result) {
        setAudioFile(result);
        setDescription('Audio description recorded');
      }
    } catch (error) {
      console.error('Recording failed to stop:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  // Handle image selection
  const handleImagePicker = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Photo Library', onPress: openImageLibrary },
        { text: 'Skip Photo', onPress: () => Alert.alert('Info', 'You can submit your report without a photo') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Show permission settings dialog
  const showPermissionSettingsDialog = (permissionType) => {
    Alert.alert(
      'Permission Required',
      `${permissionType} permission is required for this feature. You can enable it in Settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => {
            if (Platform.OS === 'android') {
              Linking.openSettings();
            } else {
              Linking.openURL('app-settings:');
            }
          }
        }
      ]
    );
  };

  // Open camera
  const openCamera = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera access to take a photo.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.DENIED) {
          Alert.alert('Permission Denied', 'Camera permission was denied. You can still submit your report without a photo or try using Photo Library instead.');
          return;
        }
        
        if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          showPermissionSettingsDialog('Camera');
          return;
        }
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Camera permission is required to take photos. Try using Photo Library instead.');
          return;
        }
      } catch (err) {
        console.warn(err);
        Alert.alert('Error', 'Failed to request camera permission. Try using Photo Library instead.');
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      saveToPhotos: false,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
        return;
      }
      
      if (response.errorMessage) {
        if (response.errorMessage.includes('permission')) {
          showPermissionSettingsDialog('Camera');
        } else {
          Alert.alert('Camera Error', 'Unable to take photo. Try using Photo Library instead or submit without a photo.');
        }
        return;
      }

      if (response.assets && response.assets[0]) {
        setSelectedImages([...selectedImages, response.assets[0]]);
        Alert.alert('Success', 'Photo has been added to your report');
      }
    });
  };

  // Open image library
  const openImageLibrary = async () => {
    if (Platform.OS === 'android') {
      try {
        // For Android 13+ (API 33+), use READ_MEDIA_IMAGES which maps to "Photos and videos" permission
        // For older versions, use READ_EXTERNAL_STORAGE
        let permission;
        let permissionName;
        
        if (Platform.Version >= 33) {
          permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
          permissionName = 'Photos and Videos';
        } else {
          permission = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
          permissionName = 'Storage';
        }
        
        // First check if we already have permission
        const hasPermission = await PermissionsAndroid.check(permission);
        console.log(`${permissionName} permission status:`, hasPermission);
        
        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(permission, {
            title: `${permissionName} Access`,
            message: `This app needs access to your ${permissionName.toLowerCase()} to select photos for your report.`,
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'Allow',
          });
          
          console.log('Permission request result:', granted);
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Permission Needed', 
              `To select photos from your gallery, please:\n\n1. Go to Settings > Apps > [Your App Name] > Permissions\n2. Enable "${permissionName}" permission\n\nOr you can use the Camera option instead.`,
              [
                { text: 'Use Camera Instead', onPress: openCamera },
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
                { text: 'Skip Photos', style: 'cancel' }
              ]
            );
            return;
          }
        }
      } catch (err) {
        console.warn('Permission error:', err);
        Alert.alert('Permission Error', 'Could not request permission. Try using Camera instead.');
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 5 - selectedImages.length,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) return;
      
      if (response.errorMessage) {
        console.log('ImagePicker Error:', response.errorMessage);
        
        // Handle specific permission-related errors
        if (response.errorMessage.includes('permission') || response.errorMessage.includes('Permission')) {
          Alert.alert(
            'Photos Access Required',
            'Please enable "Photos and videos" permission in your device settings:\n\n1. Open Settings\n2. Go to Apps > [Your App]\n3. Tap Permissions\n4. Enable "Photos and videos"',
            [
              { text: 'Use Camera', onPress: openCamera },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
              { text: 'Skip', style: 'cancel' }
            ]
          );
        } else {
          Alert.alert('Photo Library Error', 'Unable to access photo library. Try using Camera instead or submit without a photo.');
        }
        return;
      }

      if (response.assets) {
        setSelectedImages([...selectedImages, ...response.assets]);
        Alert.alert('Success', `${response.assets.length} photo(s) added to your report`);
      }
    });
  };

  // Remove selected image
  const removeImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  // Get current GPS location
  const getCurrentLocation = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'We need access to your location to help identify issue locations accurately',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        
        if (granted === PermissionsAndroid.RESULTS.DENIED) {
          Alert.alert('Permission Denied', 'Location permission was denied. Please enter your location manually in the text field below.');
          return;
        }
        
        if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          showPermissionSettingsDialog('Location');
          return;
        }
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Location permission is required to use GPS. Please enter your location manually.');
          return;
        }
      } catch (err) {
        console.warn(err);
        Alert.alert('Error', 'Failed to request location permission. Please enter your location manually.');
        return;
      }
    }

    // Use Geolocation to get current position
    try {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoordinates({ latitude, longitude });
          setLocation(`GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          
          // Optionally: Use reverse geocoding to get address
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(res => res.json())
            .then(data => {
              if (data.display_name) {
                setLocation(data.display_name);
              }
            })
            .catch(err => {
              console.warn('Reverse geocoding failed:', err);
              // Keep the coordinates-only location as fallback
            });
        },
        (error) => {
          console.warn('GPS Error:', error);
          Alert.alert(
            'Location Error',
            'Could not get your current location. Would you like to:',
            [
              {
                text: 'Enter Manually',
                onPress: () => {
                  Alert.alert('Manual Entry', 'Please use the text field below to enter your location manually.');
                }
              },
              {
                text: 'Use Sample Location',
                onPress: () => {
                  const sampleLat = 12.9716;
                  const sampleLng = 77.5946;
                  setCoordinates({ latitude: sampleLat, longitude: sampleLng });
                  setLocation(`GPS: ${sampleLat.toFixed(6)}, ${sampleLng.toFixed(6)} (Bangalore - Sample)`);
                  Alert.alert('Success', 'Sample location has been added to your report');
                }
              },
              {
                text: 'Cancel',
                style: 'cancel'
              }
            ]
          );
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      console.error('Geolocation error:', error);
      Alert.alert('Error', 'Failed to get location. Please enter your location manually.');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !selectedCategory) {
      Alert.alert('Missing Information', 'Please fill in title, description, and category.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Location Required', 'Please add your location before submitting.');
      return;
    }
    if (!coordinates?.latitude || !coordinates?.longitude) {
      Alert.alert('Location Error', 'Please ensure your location includes GPS coordinates.');
      return;
    }
    if (!accessToken) {
      Alert.alert('Authentication Error', 'Please log in to submit a report.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create form data for multipart upload
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('type', selectedCategory);
      formData.append('address', location.trim());
      formData.append('latitude', coordinates.latitude.toString());
      formData.append('longitude', coordinates.longitude.toString());

      // Add images if any
      if (selectedImages.length > 0) {
        selectedImages.forEach((image, index) => {
          formData.append('images', {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: image.fileName || `image-${index}.jpg`
          });
        });
      }

      // Audio recording temporarily disabled
      /*
      if (audioFile) {
        formData.append('audio', {
          uri: audioFile,
          type: 'audio/mp4',
          name: 'audio_description.m4a'
        });
      }
      */

      // Make request to backend
      // Debug log
      console.log('Submitting with data:', {
        title: title.trim(),
        description: description.trim(),
        type: selectedCategory,
        address: location.trim(),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        imageCount: selectedImages.length,
        hasAudioDescription: !!audioFile
      });

      const response = await api.post('/issues/report', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.data?.data) {
        // Clear form first
        setTitle('');
        setDescription('');
        setSelectedCategory('');
        setLocation('');
        setCoordinates(null);
        setSelectedImages([]);
        
        // Show success message and navigate
        Alert.alert(
          'Success', 
          'Your report has been submitted successfully! Our team will review it shortly.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Submit Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });

      let errorMessage = 'Failed to submit report. Please try again.';
      
      if (error.response) {
        // Server responded with error
        if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid data provided. Please check your inputs.';
        } else {
          errorMessage = error.response.data?.message || 'Server error. Please try again.';
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Could not reach the server. Please check your internet connection.';
      }

      Alert.alert(
        'Error',
        errorMessage,
        [
          { 
            text: 'OK',
            onPress: () => {
              if (error.response?.status === 401) {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }]
                });
              }
            }
          },
          {
            text: 'Try Again',
            onPress: handleSubmit
          }
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Report Issue</Text>
          <Text style={[styles.headerSubtitle, { color: textColor }]}>
            Help improve your community
          </Text>
        </View>
        <View style={styles.headerRight}>
          <AccountIcon />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Show access token for debugging */}
        
        <View style={[styles.card, { backgroundColor: cardBgColor, borderColor }]}>
          <TextInput
            style={[styles.input, { color: textColor, borderColor }]}
            placeholder="Title"
            placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={[styles.textArea, { color: textColor, borderColor }]}
            placeholder="Description"
            placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <Text style={[styles.label, { color: textColor }]}>Category</Text>
          <View style={[styles.categoryContainer, { borderColor }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat.id && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === cat.id && styles.categoryTextSelected
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={[styles.locationButton, { borderColor }]}
            onPress={getCurrentLocation}
          >
            <Text style={[styles.locationButtonText, { color: textColor }]}>
              {location || 'Add Location (GPS)'}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { color: textColor, borderColor }]}
            placeholder="Or enter location manually"
            placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
            value={location}
            onChangeText={setLocation}
          />

          <TouchableOpacity
            style={[styles.imageButton, { borderColor }]}
            onPress={handleImagePicker}
          >
            <Text style={[styles.imageButtonText, { color: textColor }]}>
              Add Photos (Max 5) - Optional
            </Text>
          </TouchableOpacity>

        <Text style={[styles.helpText, { color: textColor }]}>
          Note: Photos are optional. You can submit your report without images if camera/storage permissions are not available.
        </Text>

        {/* Audio Recording Section - Temporarily disabled
        <View collapsable={false} removeClippedSubviews={true}>
          <AudioRecorder
            key="audioRecorder"
            onAudioRecorded={(file) => {
              setAudioFile(file);
              setDescription('Audio description recorded');
            }}
            onAudioRemoved={() => {
              setAudioFile(null);
              if (description === 'Audio description recorded') {
                setDescription('');
              }
            }}
          />
        </View>
        */}
        </View>

        {selectedImages.length > 0 && (
          <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagePreviewContainer}
            >
              {selectedImages.map((img, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri: img.uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Text style={styles.removeImageText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#2C2C2E', // Dark gray outer background
  },

  // Header Section
 header: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#656572',
    borderBottomWidth: 2,
    borderBottomColor: '#48484A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    // Add gradient-like effect with subtle border
    borderTopWidth: 1,
    borderTopColor: '#7A7A85',
  },
  headerContent: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F0F6FC',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#7D8590',
    opacity: 0.9,
  },

  // Scroll Content
  scrollContent: {
    padding: 20,
  },

  // Main Title
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F0F6FC',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  // Card Container
  card: {
    backgroundColor: '#3A3A3C', // Slightly lighter than container
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#48484A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },

  // Form Labels
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F0F6FC',
    marginBottom: 10,
    letterSpacing: 0.1,
  },

  // Input Fields
  input: {
    backgroundColor: '#C7C7CC', // Light gray for inputs
    borderWidth: 1,
    borderColor: '#8E8E93',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    color: '#000000', // Dark text for contrast
    minHeight: 48,
  },
  textArea: {
    backgroundColor: '#C7C7CC', // Light gray for text area
    borderWidth: 1,
    borderColor: '#8E8E93',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    color: '#000000', // Dark text for contrast
    minHeight: 120,
    textAlignVertical: 'top',
  },

  // Category Section
  categoryContainer: {
    marginBottom: 20,
    backgroundColor: '#C7C7CC', // Light gray for category container
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#8E8E93',
    padding: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8E8E93', // Darker gray for unselected
    borderWidth: 1,
    borderColor: '#8E8E93',
  },
  categoryButtonSelected: {
    backgroundColor: '#1F6FEB',
    borderColor: '#1F6FEB',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
    color: '#FFFFFF', // White text on darker background
  },
  categoryIconSelected: {
    color: '#FFFFFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#FFFFFF', // White text on darker background
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Location Button
  locationButton: {
    backgroundColor: '#C7C7CC', // Light gray for location button
    borderWidth: 1,
    borderColor: '#8E8E93',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
  },
  locationButtonText: {
    fontSize: 16,
    color: '#000000', // Dark text for contrast
    fontWeight: '500',
  },

  // Image Upload Section
  imageButton: {
    backgroundColor: '#C7C7CC', // Light gray for image button
    borderWidth: 1,
    borderColor: '#8E8E93',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
  },
  imageButtonText: {
    fontSize: 16,
    color: '#000000', // Dark text for contrast
    fontWeight: '500',
  },

  // Image Preview
  imagePreviewContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imagePreview: {
    width: 80,
    height: 80,
    marginRight: 12,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#30363D',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 16,
  },

  // Submit Button
  submitButton: {
    backgroundColor: '#238636',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#238636',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#30363D',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Help Text
  helpText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#7D8590',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Focus States (for better UX)
  inputFocused: {
    borderColor: '#007AFF', // iOS blue for focus
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // Error States
  inputError: {
    borderColor: '#F85149',
  },
  errorText: {
    fontSize: 13,
    color: '#F85149',
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
});

export default ReportScreen;