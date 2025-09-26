import React, { useState, useEffect } from 'react';
import AccountIcon from '../components/AccountIcon';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const Home = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    let isMounted = true;
    checkApiConnection();
    return () => {
      isMounted = false;
    };
  }, []);

  const checkApiConnection = async (retryCount = 0) => {
    try {
      if (!retryCount) {
        setLoading(true);
        setError(null);
      }
      
      const response = await api.get('/health', {
        timeout: 5000 // Shorter timeout for health check
      });

      if (response.data?.status === 'ok') {
        await fetchIssues();
      } else {
        throw new Error('Server health check failed');
      }
    } catch (err) {
      console.error('API Connection Error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        attempt: retryCount + 1
      });
      
      if (retryCount < 2) { // Try up to 3 times
        console.log(`Retrying API connection (attempt ${retryCount + 1}/3)`);
        setTimeout(() => checkApiConnection(retryCount + 1), 2000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // Check specific error conditions
      if (err.code === 'ECONNABORTED') {
        setError('Server is not responding. Please try again later.');
      } else if (!err.response) {
        setError('Cannot connect to server. Please check your internet connection.');
      } else {
        setError(`Server error: ${err.response?.data?.message || 'Please try again later.'}`);
      }
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching issues...');
      const response = await api.get('/api/v1/issues/all');
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to fetch issues');
      }
      
      console.log('Response:', response.data);
      setIssues(response.data.data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch issues';
      console.error('Error fetching issues:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError('Error fetching issues: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (issueId) => {
    try {
      const response = await api.post(`/api/v1/issues/${issueId}/upvote`);
      
      if (!response.data?.data) {
        throw new Error('Invalid response from server');
      }
      
      // Update local state with new upvote status
      setIssues(prevIssues => prevIssues.map(issue => {
        if (issue._id === issueId) {
          return {
            ...issue,
            upvotes: response.data.data.upvoted 
              ? [...(issue.upvotes || []), user._id]
              : (issue.upvotes || []).filter(id => id !== user._id),
            upvoteCount: response.data.data.upvoteCount
          };
        }
        return issue;
      }));
    } catch (error) {
      console.error('Upvote error:', {
        message: error.message,
        response: error.response?.data
      });

      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again to continue.', [
          {
            text: 'OK',
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }]
            })
          }
        ]);
        return;
      }

      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to update upvote. Please try again.'
      );
    }
  };

  // Removed duplicate fetchIssues function

  const onRefresh = () => {
    setRefreshing(true);
    fetchIssues();
  };

  const handleComment = async (issueId) => {
    if (!commentText.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      const response = await api.post(`/api/v1/issues/${issueId}/comments`, {
        text: commentText.trim()
      });

      if (!response.data?.data?.comment) {
        throw new Error('Invalid response from server');
      }

      // Get the new comment from the response
      const newComment = response.data.data.comment;

      // Update local state to show the new comment
      setIssues(prevIssues => prevIssues.map(issue => {
        if (issue._id === issueId) {
          return {
            ...issue,
            comments: [...(issue.comments || []), newComment]
          };
        }
        return issue;
      }));
      
      setCommentText('');
      setActiveCommentId(null);
    } catch (error) {
      console.error('Comment error:', {
        message: error.message,
        response: error.response?.data
      });

      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again to continue.', [
          {
            text: 'OK',
            onPress: () => navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }]
            })
          }
        ]);
        return;
      }

      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to add comment. Please try again.'
      );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const renderIssue = ({ item: issue }) => {
    const isUpvoted = issue.upvotes?.some(id => id === user._id);
    
    return (
      <View style={styles.issueCard}>
        <View style={styles.issueHeader}>
          <View style={styles.userInfo}>
            <View style={styles.userTextInfo}>
              
              <Text style={styles.timestamp}>{formatDate(issue.createdAt)}</Text>
            </View>
          </View>
          <View style={[styles.tag, { backgroundColor: getPriorityColor(issue.priority) }]}>
            <Text style={styles.tagText}>{issue.priority}</Text>
          </View>
        </View>

        <Text style={styles.issueTitle}>{issue.title}</Text>
        <Text style={styles.issueDescription}>{issue.description}</Text>

        {issue.images && issue.images.length > 0 && (
          <Image
            source={{ uri: issue.images[0] }}
            style={styles.issueImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.issueFooter}>
          <View style={styles.tagContainer}>
            <View style={styles.typeTag}>
              <Text style={styles.typeText}>{issue.type}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: getStatusColor(issue.status) }]}>
              <Text style={styles.tagText}>{issue.status}</Text>
            </View>
          </View>
          
          <View style={styles.interactionContainer}>
            <TouchableOpacity 
              style={[styles.interactionButton, isUpvoted && styles.upvotedButton]}
              onPress={() => handleUpvote(issue._id)}
            >
              <Icon 
                name={isUpvoted ? "thumb-up" : "thumb-up-outline"} 
                size={20} 
                color={isUpvoted ? "#007AFF" : "#666"}
              />
              <Text style={[styles.interactionText, isUpvoted && styles.upvotedText]}>
                {issue.upvotes?.length || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.interactionButton}
              onPress={() => setActiveCommentId(activeCommentId === issue._id ? null : issue._id)}
            >
              <Icon name="comment-outline" size={20} color="#666" />
              <Text style={styles.interactionText}>
                {issue.comments?.length || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeCommentId === issue._id && (
          <View style={styles.commentSection}>
            <View style={styles.commentList}>
              {issue.comments?.map((comment, index) => (
                <View key={index} style={styles.commentItem}>
                  <Text style={styles.commentUser}>{comment.user.username}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.commentInput}>
              <TextInput
                style={styles.input}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="#999"
                multiline
              />
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={() => handleComment(issue._id)}
              >
                <Icon name="send" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'REPORTED':
        return '#D88C00';
      case 'ASSIGNED_DEPT':
        return '#4040B2';
      case 'ASSIGNED_STAFF':
        return '#4040B2';
      case 'IN_PROGRESS':
        return '#0A3D91';
      case 'COMPLETED':
        return '#1A844C';
      case 'VERIFIED':
        return '#1A844C';
      case 'RESOLVED':
        return '#1A844C';
      default:
        return '#636366';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return '#D70015';
      case 'MEDIUM':
        return '#D88C00';
      case 'LOW':
        return '#1A844C';
      default:
        return '#636366';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Issues</Text>
        <View style={styles.headerRight}>
          
          <AccountIcon />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A3D91" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchIssues}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={issues}
          renderItem={renderIssue}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.issuesList}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchIssues} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No issues reported yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },

  // Header Section
  header: {
    backgroundColor: '#1C2128',
    borderBottomWidth: 1,
    borderBottomColor: '#2D333B',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F0F6FC',
    letterSpacing: -0.3,
    flex: 1,
  },
  headerRight: {
    paddingLeft: 16,
  },

  // Issues List
  issuesList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },

  // Issue Card
  issueCard: {
    backgroundColor: '#21262D',
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#30363D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },

  // Issue Header
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#30363D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7D8590',
  },
  userTextInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F0F6FC',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 13,
    color: '#7D8590',
  },

  // Issue Content
  issueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F0F6FC',
    marginBottom: 8,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  issueDescription: {
    fontSize: 15,
    color: '#C9D1D9',
    marginBottom: 16,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  issueImage: {
    width: '100%',
    height: Math.min(width * 0.6, 240),
    marginBottom: 16,
  },

  // Issue Footer
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#30363D',
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  typeTag: {
    backgroundColor: '#1F6FEB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tag: {
    backgroundColor: '#30363D',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#C9D1D9',
  },

  // Priority Tags
  priorityHigh: {
    backgroundColor: '#DA3633',
  },
  priorityMedium: {
    backgroundColor: '#FB8500',
  },
  priorityLow: {
    backgroundColor: '#238636',
  },

  // Interaction Buttons
  interactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  upvotedButton: {
    backgroundColor: '#1F6FEB',
    borderColor: '#1F6FEB',
  },
  interactionText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '500',
    color: '#7D8590',
  },
  upvotedText: {
    color: '#FFFFFF',
  },

  // Action Buttons
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    padding: 4,
  },
  actionButtonActive: {
    opacity: 1,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#7D8590',
  },
  actionTextActive: {
    color: '#1F6FEB',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Comments Section
  commentSection: {
    backgroundColor: '#1C2128',
    borderTopWidth: 1,
    borderTopColor: '#30363D',
    padding: 16,
  },
  commentList: {
    marginBottom: 16,
  },
  commentsList: {
    marginBottom: 16,
  },
  commentItem: {
    backgroundColor: '#21262D',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F0F6FC',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#C9D1D9',
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#7D8590',
  },

  // Comment Input
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#21262D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363D',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    color: '#F0F6FC',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: '#238636',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginLeft: 8,
  },
  commentButton: {
    backgroundColor: '#238636',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  commentButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1419',
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0F1419',
  },
  errorText: {
    fontSize: 16,
    color: '#F85149',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#238636',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Empty States
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    margin: 16,
    backgroundColor: '#21262D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  emptyText: {
    fontSize: 16,
    color: '#7D8590',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default Home;