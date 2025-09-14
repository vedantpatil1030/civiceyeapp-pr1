import React, { useState } from 'react';
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
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';

const categories = [
  { id: 'INFRASTRUCTURE', name: 'Infrastructure', icon: '🏗️', color: '#ff4757' },
  { id: 'SAFETY', name: 'Safety', icon: '🚨', color: '#ff6b6b' },
  { id: 'ENVIRONMENT', name: 'Environment', icon: '🌱', color: '#2ed573' },
  { id: 'TRANSPORT', name: 'Transport', icon: '🚗', color: '#ffa502' },
  { id: 'CLEANLINESS', name: 'Cleanliness', icon: '🧹', color: '#3742fa' },
  { id: 'GOVERNANCE', name: 'Governance', icon: '🏛️', color: '#5f27cd' },
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
  
  const isDarkMode = useColorScheme() === 'dark';
  
  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff',
  };
  
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const cardBgColor = isDarkMode ? '#1a1a1a' : '#ffffff';
  const borderColor = isDarkMode ? '#333333' : '#e1e8ed';

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
        const newImage = {
          uri: response.assets[0].uri,
          type: response.assets[0].type || 'image/jpeg',
          fileName: response.assets[0].fileName || `photo_${Date.now()}.jpg`,
        };
        setSelectedImages([...selectedImages, newImage]);
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
        const newImages = response.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
        }));
        
        setSelectedImages([...selectedImages, ...newImages]);
        Alert.alert('Success', `${newImages.length} photo(s) added to your report`);
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

    // Use React Native's built-in Geolocation (requires @react-native-community/geolocation or similar)
    // For now, we'll use a simple manual location input
    Alert.alert(
      'Location Options',
      'Choose how to add your location',
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
            setCoordinates({ lat: sampleLat, lng: sampleLng });
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

    setIsSubmitting(true);

    try {
      // Here you would typically send the data to your backend
      // For now, we'll just simulate a successful submission
      setTimeout(() => {
        Alert.alert('Success', 'Your report has been submitted successfully!');
        setTitle('');
        setDescription('');
        setSelectedCategory('');
        setLocation('');
        setCoordinates(null);
        setSelectedImages([]);
        setIsSubmitting(false);
        navigation.goBack();
      }, 1500);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: textColor }]}>Report an Issue</Text>
        
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryContainer: {
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#333333',
  },
  categoryTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  locationButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  locationButtonText: {
    fontSize: 16,
  },
  imageButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: 16,
  },
  imagePreviewContainer: {
    marginBottom: 16,
  },
  imagePreview: {
    width: 80,
    height: 80,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#0984e3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#b2bec3',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default ReportScreen;
