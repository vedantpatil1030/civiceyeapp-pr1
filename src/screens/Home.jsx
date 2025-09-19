import React, { useState, useEffect } from 'react';
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
    fetchIssues();
  }, []);

  const handleUpvote = async (issueId) => {
    try {
      const response = await api.post(`/api/v1/issues/${issueId}/upvote`);
      const { upvoted, upvoteCount } = response.data.data;
      
      // Update local state
      setIssues(issues.map(issue => {
        if (issue._id === issueId) {
          return {
            ...issue,
            upvotes: upvoted 
              ? [...(issue.upvotes || []), user._id]
              : (issue.upvotes || []).filter(id => id !== user._id)
          };
        }
        return issue;
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to update upvote. Please try again.');
    }
  };

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/v1/issues/all');
      console.log('Debug - API Response:', {
        status: response.status,
        dataLength: response.data?.data?.issues?.length || 0
      });
      
      const issues = response.data?.data?.issues || [];
      setIssues(issues);
      setError(null);
    } catch (err) {
      console.error('Error fetching issues:', err);
      
      if (err.message === 'Session expired. Please login again.') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }]
        });
        return;
      }

      const errorMessage = err.response?.data?.message || 'Failed to load issues. Please try again.';
      setError(errorMessage);
      
      if (err.response?.status === 401) {
        Alert.alert(
          'Authentication Error', 
          'Please login again to continue.',
          [
            { 
              text: 'OK', 
              onPress: () => navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }]
              })
            }
          ]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

      // Get the new comment from the response
      const newComment = response.data.data.comment;

      // Update local state to show the new comment
      setIssues(issues.map(issue => {
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
      console.error('Comment error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add comment. Please try again.';
      Alert.alert('Error', errorMessage);
      
      if (error.response?.status === 401) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }]
        });
      }
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
              <Text style={styles.userName}>Report #{issue._id.slice(-4)}</Text>
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
        return '#FF9500';
      case 'ASSIGNED_DEPT':
        return '#5856D6';
      case 'ASSIGNED_STAFF':
        return '#5856D6';
      case 'IN_PROGRESS':
        return '#007AFF';
      case 'COMPLETED':
        return '#34C759';
      case 'VERIFIED':
        return '#34C759';
      case 'RESOLVED':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return '#FF3B30';
      case 'MEDIUM':
        return '#FF9500';
      case 'LOW':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Issues</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
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
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  issuesList: {
    padding: 16,
  },
  issueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTextInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  timestamp: {
    fontSize: 14,
    color: '#8E8E93',
  },
  issueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  issueDescription: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 12,
  },
  issueImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeTag: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  typeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '500',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  issuesList: {
    padding: 16,
  },
  issueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
  },
  userTextInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  timestamp: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  issueTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  issueDescription: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 12,
  },
  issueImage: {
    width: '100%',
    height: width * 0.6,
    borderRadius: 8,
    marginBottom: 12,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
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
    color: '#8E8E93',
  },
  actionTextActive: {
    color: '#007AFF',
  },
  interactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 16,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  upvotedButton: {
    backgroundColor: '#E1F0FF',
  },
  interactionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  upvotedText: {
    color: '#007AFF',
  },
  commentSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  commentList: {
    marginBottom: 12,
  },
  commentItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#000000',
  },
  commentTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 8,
    color: '#000000',
  },
  sendButton: {
    padding: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  commentSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  commentInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    minHeight: 40,
  },
  commentButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  commentButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  commentsList: {
    marginTop: 12,
  },
  commentItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  commentUser: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default Home;
