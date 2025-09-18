import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
// import { issuesAPI } from '../services/api';
// import { useAuth } from '../contexts/AuthContext';

const StatusScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Fetch user's issues from backend
  // (removed duplicate fetchMyIssues definition here)

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

  // Fetch user's issues
  const fetchMyIssues = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Error', 'No access token found. Please login again.');
        setLoading(false);
        return;
      }
      const response = await axios.get('http://10.0.2.2:8000/api/v1/issues/my-reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyReports(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user issues:', error?.response?.data || error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to load your issues. Please try again.');
      setLoading(false);
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

  // Filter reports based on selected filter
  const filteredReports = myReports.filter(report => {
    if (selectedFilter === 'all') return true;
    
    const statusMap = {
      'pending': ['OPEN'],
      'review': ['IN_PROGRESS'],
      'progress': ['IN_PROGRESS'],
      'completed': ['RESOLVED', 'CLOSED']
    };
    
    return statusMap[selectedFilter]?.includes(report.status);
  });

  // Calculate counts for filters
  const getFilterCounts = () => {
    const counts = {
      all: myReports.length,
      pending: myReports.filter(r => ['OPEN'].includes(r.status)).length,
      review: myReports.filter(r => r.status === 'IN_PROGRESS').length,
      progress: myReports.filter(r => r.status === 'IN_PROGRESS').length,
      completed: myReports.filter(r => ['RESOLVED', 'CLOSED'].includes(r.status)).length,
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

  // Get category color (similar to Report.jsx categories)
  const getCategoryColor = (category) => {
    const categoryColors = {
      'INFRASTRUCTURE': '#ff4757',
      'SAFETY': '#ff6b6b',
      'ENVIRONMENT': '#2ed573',
      'TRANSPORT': '#ffa502',
      'CLEANLINESS': '#3742fa',
      'GOVERNANCE': '#5f27cd',
      'OTHER': '#747d8c'
    };
    return categoryColors[category] || '#747d8c';
  };

  // Handle viewing details of a report
  const handleViewDetails = (report) => {
    Alert.alert(
      `Report Details`,
      `Title: ${report.title}\n\nStatus: ${report.status}\nCategory: ${report.category}\nLocation: ${report.location}\n\nDescription:\n${report.description}\n\nLatest Update:\n${report.updates[report.updates.length - 1].message}`,
      [
        { text: 'View All Updates', onPress: () => showAllUpdates(report) },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  const showAllUpdates = (report) => {
    const updatesText = report.updates
      .map(update => `${update.date}: ${update.message}`)
      .join('\n\n');
    
    Alert.alert(
      `Updates for Report #${report.id}`,
      updatesText,
      [{ text: 'Close' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Issue Status</Text>
        <Text style={[styles.headerSubtitle, { color: textColor }]}>
          Track your reported issues
        </Text>
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
          {statusFilters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
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
          filteredReports.map((report) => (
            <TouchableOpacity
              key={report.id}
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
                  <Text style={[styles.reportId, { color: textColor }]}>#{report.id}</Text>
                </View>
              </View>

              <View style={styles.reportStatus}>
                <View style={styles.statusRow}>
                  <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                    ● {report.status}
                  </Text>
                  <Text style={[styles.departmentText, { color: textColor }]}>
                    {report.assignedDepartment}
                  </Text>
                </View>
                
                <View style={styles.datesRow}>
                  <Text style={[styles.dateText, { color: textColor }]}>
                    Submitted: {report.submittedDate}
                  </Text>
                  <Text style={[styles.dateText, { color: textColor }]}>
                    Updated: {report.lastUpdate}
                  </Text>
                </View>

                <View style={styles.statsRow}>
                  <Text style={[styles.statText, { color: textColor }]}>
                    👍 {report.upvotes} upvotes
                  </Text>
                  <Text style={[styles.statText, { color: textColor }]}>
                    💬 {report.comments} comments
                  </Text>
                </View>
              </View>

              <View style={styles.latestUpdate}>
                <Text style={[styles.updateLabel, { color: textColor }]}>Latest Update:</Text>
                <Text style={[styles.updateText, { color: textColor }]}>
                  {report.updates[report.updates.length - 1].message}
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
    alignItems: 'center',
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
