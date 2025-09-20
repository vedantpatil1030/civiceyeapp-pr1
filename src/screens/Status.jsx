import React, { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AccountIcon from '../components/AccountIcon';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import api from '../../services/api';

const StatusScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [myReports, setMyReports] = useState([]); // Initialize with empty array
  const [loading, setLoading] = useState(true);  // Start with loading true
  const [refreshing, setRefreshing] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';
  
  // Calculate counts for different statuses
  

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchMyIssues();
  }, []);
  
  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#ffffff',
  };
  
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const cardBgColor = isDarkMode ? '#1a1a1a' : '#ffffff';
  const borderColor = isDarkMode ? '#333333' : '#e1e8ed';

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return '#ff4757'; // Red
      case 'IN_PROGRESS':
        return '#ffa502'; // Orange/Yellow
      case 'RESOLVED':
      case 'CLOSED':
        return '#2ed573'; // Green
      default:
        return '#ff4757'; // Default to red
    }
  };

  // Helper function to get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return '#ff4757'; // Red
      case 'MEDIUM':
        return '#ffa502'; // Orange/Yellow
      case 'LOW':
        return '#2ed573'; // Green
      default:
        return '#ff4757'; // Default to red
    }
  };

  // Helper function to get category/type color
  const getCategoryColor = (category) => {
    switch (category) {
      case 'WATER':
        return '#3498db'; // Blue for water issues
      case 'ROADS':
        return '#95a5a6'; // Gray for road issues
      case 'ELECTRICITY':
        return '#f1c40f'; // Yellow for electricity
      case 'SANITATION':
        return '#27ae60'; // Green for sanitation
      case 'INFRASTRUCTURE':
        return '#e67e22'; // Orange for infrastructure
      case 'ENVIRONMENT':
        return '#2ecc71'; // Light green for environment
      case 'OTHER':
        return '#9b59b6'; // Purple for other issues
      default:
        return '#bdc3c7'; // Default light gray
    }
  };

  // Fetch user's issues
  const fetchMyIssues = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/issues/my-reports');  // Updated to match backend route

      console.log('Debug - My Reports Response:', {
        status: response.status,
        dataLength: response.data?.data?.length || 0,
        rawData: response.data,
        dataStructure: response.data ? Object.keys(response.data) : 'no data',
        firstItem: response.data?.data?.[0] || 'no items'
      });

     

      if (!response.data?.data) {
        throw new Error('Invalid response format from server');
      }

      // Ensure we're setting an array
      const reportsData = Array.isArray(response.data.data) ? response.data.data : 
                         Array.isArray(response.data.data.issues) ? response.data.data.issues :
                         [];
      
      console.log('Setting reports:', {
        reportsLength: reportsData.length,
        firstReport: reportsData[0] || 'no first report'
      });

      setMyReports(reportsData);
    } catch (err) {
      console.error('Error fetching user issues:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
        method: err.config?.method,
        headers: err.config?.headers,
        networkError: !err.response,
        timeout: err.code === 'ECONNABORTED'
      });

      // Handle token expiration or invalid token
      if (err.response?.status === 401) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        Alert.alert(
          'Session Expired', 
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
        return;
      }

      // Handle network errors
      if (!err.response) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
        return;
      }

      // Handle other errors
      const errorMessage = err.response?.data?.message || 'Failed to load your issues. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);  // Make sure to reset refreshing state
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyIssues();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMyIssues();
  }, []);

  // Monitor myReports state
  useEffect(() => {
    console.log('MyReports state updated:', {
      length: myReports.length,
      isArray: Array.isArray(myReports),
      firstItem: myReports[0] ? {
        id: myReports[0]._id,
        title: myReports[0].title,
        status: myReports[0].status
      } : 'no items'
    });
  }, [myReports]);

  // Filter reports based on selected filter
  const filteredReports = React.useMemo(() => {
    // Ensure myReports is an array
    if (!Array.isArray(myReports)) return [];
    
    return myReports.filter(report => {
      if (!report) return false;
      if (selectedFilter === 'all') return true;
      
      const statusMap = {
        'pending': ['OPEN'],
        'review': ['IN_PROGRESS'],
        'progress': ['IN_PROGRESS'],
        'completed': ['RESOLVED', 'CLOSED']
      };
      
      return statusMap[selectedFilter]?.includes(report?.status);
    });
  }, [myReports, selectedFilter]);

  // Calculate counts for filters
  const getFilterCounts = () => {
    // Ensure myReports is an array
    const reports = Array.isArray(myReports) ? myReports : [];
    
    const counts = {
      all: reports.length,
      pending: reports.filter(r => r && ['OPEN'].includes(r.status)).length,
      review: reports.filter(r => r && r.status === 'IN_PROGRESS').length,
      progress: reports.filter(r => r && r.status === 'IN_PROGRESS').length,
      completed: reports.filter(r => r && ['RESOLVED', 'CLOSED'].includes(r.status)).length,
    };
    return counts;
  };

  const filterCounts = getFilterCounts();

  const statusFilters = [
    { id: 'all', name: 'All', count: filterCounts.all },
    { id: 'pending', name: 'Pending', count: filterCounts.pending },
    { id: 'review', name: 'Under Review', count: filterCounts.review },
    { id: 'progress', name: 'In Progress', count: filterCounts.progress },
    { id: 'completed', name: 'Completed', count: filterCounts.completed },
  ];

  // Get category color and icon
  const getCategoryInfo = (category) => {
    const categoryData = {
      'INFRASTRUCTURE': { color: '#ff4757', icon: '🏗️' },
      'SAFETY': { color: '#ff6b6b', icon: '🛡️' },
      'ENVIRONMENT': { color: '#2ed573', icon: '🌿' },
      'TRANSPORT': { color: '#ffa502', icon: '🚗' },
      'CLEANLINESS': { color: '#3742fa', icon: '🧹' },
      'GOVERNANCE': { color: '#5f27cd', icon: '📋' },
      'OTHER': { color: '#747d8c', icon: '📝' }
    };
    return categoryData[category] || { color: '#747d8c', icon: '📝' };
  };

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'high': return '⚡⚡⚡';
      case 'medium': return '⚡⚡';
      case 'low': return '⚡';
      default: return '⚡';
    }
  };

  // Handle upvoting an issue
  const handleUpvote = async (reportId) => {
    try {
      await api.post(`/issues/${reportId}/upvote`);
      // Refresh the issues list to get updated upvote count
      await fetchMyIssues();
    } catch (error) {
      console.error('Error upvoting issue:', error);
      Alert.alert('Error', 'Failed to upvote. Please try again.');
    }
  };

  // Handle viewing details of a report
  const handleViewDetails = async (report) => {
    try {
      // Get fresh details including latest updates
      const response = await api.get(`/issues/${report.id}`);
      const updatedReport = response.data?.data;
      
      const latestUpdate = updatedReport.updates && updatedReport.updates.length > 0 
        ? `\n\nLatest Update:\n${updatedReport.updates[updatedReport.updates.length - 1].message}`
        : '';

      Alert.alert(
        `Report Details`,
        `Title: ${updatedReport.title || 'N/A'}\n\nStatus: ${updatedReport.status || 'N/A'}\nCategory: ${updatedReport.category || 'N/A'}\nLocation: ${updatedReport.location || 'N/A'}\n\nDescription:\n${updatedReport.description || 'No description provided'}${latestUpdate}`,
        [
          ...(updatedReport.updates && updatedReport.updates.length > 0 
            ? [{ text: 'View All Updates', onPress: () => showAllUpdates(updatedReport) }]
            : []
          ),
          { text: 'Close', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error fetching issue details:', error);
      Alert.alert('Error', 'Failed to load issue details. Please try again.');
    }
  };

  const showAllUpdates = async (report) => {
    try {
      // Get fresh comments
      const commentsResponse = await api.get(`/issues/${report.id}/comments`);
      const comments = commentsResponse.data?.data?.comments || [];

      if (!comments || comments.length === 0) {
        Alert.alert(
          `Updates for Report #${report.id || ''}`,
          'No updates available for this report.',
          [{ text: 'Close' }]
        );
        return;
      }

      const updatesText = comments
        .map((comment) => `${formatDate(comment.createdAt)}: ${comment.text || 'No message'}`)
        .join('\n\n');
      
      Alert.alert(
        `Updates for Report #${report.id || ''}`,
        updatesText || 'No updates available',
        [{ text: 'Close' }]
      );
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: textColor }]}>Issue Status</Text>
          <Text style={[styles.headerSubtitle, { color: textColor }]}>
            Track your reported issues
          </Text>
        </View>
        <View style={styles.headerRight}>
          <AccountIcon />
        </View>
      </View>

      {/* Summary Stats */}
      <View style={[styles.statsContainer, { backgroundColor: cardBgColor, borderColor }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: textColor }]}>{filterCounts.all}</Text>
          <Text style={[styles.statLabel, { color: textColor }]}>Total Reports</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#3742fa' }]}>{filterCounts.review + filterCounts.progress}</Text>
          <Text style={[styles.statLabel, { color: textColor }]}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#2ed573' }]}>{filterCounts.completed}</Text>
          <Text style={[styles.statLabel, { color: textColor }]}>Resolved</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          {statusFilters.map((filter, index) => (
            <TouchableOpacity
              key={filter.id || `filter-${index}`}
              style={[
                styles.filterButton,
                { borderColor },
                selectedFilter === filter.id && styles.filterButtonSelected
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text style={[
                styles.filterText,
                { color: textColor },
                selectedFilter === filter.id && styles.filterTextSelected
              ]}>
                {filter.name} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Reports List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading your issues...</Text>
        </View>
      ) : (
      <ScrollView 
        style={styles.reportsList} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredReports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: textColor }]}>
              {selectedFilter === 'all' 
                ? "You haven't reported any issues yet." 
                : `No ${statusFilters.find(f => f.id === selectedFilter)?.name.toLowerCase()} issues found.`}
            </Text>
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={() => navigation.navigate('Report')}
            >
              <Text style={styles.reportButtonText}>Report New Issue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredReports.map((report, index) => (
            <TouchableOpacity
              key={report.id || `report-${index}`}
              style={[styles.reportCard, { backgroundColor: cardBgColor, borderColor }]}
              onPress={() => handleViewDetails(report)}
            >
              <View style={styles.reportHeader}>
                <View style={styles.reportInfo}>
                  <Text style={[styles.reportTitle, { color: textColor }]}>{report.title}</Text>
                  <Text style={[styles.reportCategory, { color: getCategoryColor(report.category) }]}>
                    {report.category}
                  </Text>
                </View>
                <View style={styles.reportMeta}>
                  <Text style={[styles.reportId, { color: textColor }]}>#{String(report._id || '')}</Text>
                </View>
              </View>

              <View style={styles.reportStatus}>
                <View style={styles.statusRow}>
                  <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                    ● {String(report.status || '')}
                  </Text>
                  <Text style={[styles.departmentText, { color: textColor }]}>
                    {String(report.assignedDepartment || '')}
                  </Text>
                </View>
                
                <View style={styles.datesRow}>
                  <Text style={[styles.dateText, { color: textColor }]}>
                    Submitted: {formatDate(report.createdAt) || 'N/A'}
                  </Text>
                  <Text style={[styles.dateText, { color: textColor }]}>
                    Updated: {formatDate(report.updatedAt) || 'N/A'}
                  </Text>
                </View>

                <View style={styles.statsRow}>
                  <Text style={[styles.statText, { color: textColor }]}>
                    👍 {(report.upvotes?.length || 0)} upvotes
                  </Text>
                  <Text style={[styles.statText, { color: textColor }]}>
                    💬 {(report.comments?.length || 0)} comments
                  </Text>
                </View>
              </View>

              <View style={styles.latestUpdate}>
                <Text style={[styles.updateLabel, { color: textColor }]}>Latest Update:</Text>
                <Text style={[styles.updateText, { color: textColor }]}>
                  {report.latestUpdate || 'No updates available'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e1e8ed',
    marginHorizontal: 16,
  },
  filtersSection: {
    marginBottom: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  filterButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextSelected: {
    color: '#ffffff',
  },
  reportsList: {
    flex: 1,
  },
  reportCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reportCategory: {
    fontSize: 14,
    fontWeight: '500',
  },
  reportMeta: {
    alignItems: 'flex-end',
  },
  reportId: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  reportStatus: {
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  departmentText: {
    fontSize: 12,
    opacity: 0.7,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 12,
    opacity: 0.7,
  },
  latestUpdate: {
    marginBottom: 8,
  },
  updateLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  updateText: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  reportButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  reportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statText: {
    fontSize: 12,
    opacity: 0.7,
  },
});

export default StatusScreen;
