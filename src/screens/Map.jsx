import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Modal,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LeafletView } from 'react-native-leaflet-view';
import AccountIcon from '../components/AccountIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockDataService } from '../utils/mockData/mockDataService';




const MapScreen = ({ navigation }) => {
    // Use the same working Delhi coordinates
    const markerPosition = { lat: 28.6139, lng: 77.2090 };
    const mapZoom = 6;

    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);


    const isDarkMode = useColorScheme() === 'dark';
    const { width, height } = Dimensions.get('window');

    const backgroundStyle = {
        backgroundColor: isDarkMode ? '#000000' : '#ffffff',
    };

    const textColor = isDarkMode ? '#ffffff' : '#000000';
    const borderColor = isDarkMode ? '#333333' : '#dddddd';
    const cardBgColor = isDarkMode ? '#1e1e1e' : '#ffffff';

    // Loading component
    const LoadingOverlay = () => (
        <View style={[styles.loadingOverlay, { backgroundColor: cardBgColor }]}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={[styles.loadingText, { color: textColor }]}>Loading issues...</Text>
        </View>
    );

    // Fetch mock issues
    useEffect(() => {
        const fetchIssues = async () => {
            setLoading(true);
            try {
                // Get mock issues from our service
                const mockIssues = mockDataService.getIssues();
                setIssues(mockIssues);
            } catch (err) {
                console.error('Error loading mock issues:', err);
                Alert.alert('Error', 'Failed to load issues. Please try again.');
                setIssues([]);
            }
            setLoading(false);
        };
        fetchIssues();

        // Refresh data every 30 seconds
        const interval = setInterval(fetchIssues, 30000);
        return () => clearInterval(interval);
    }, []);

    // Filter issues based on selected filter
    const filteredIssues = Array.isArray(issues) ? (
        selectedFilter === 'all'
            ? issues
            : issues.filter(issue => {
                const category = (issue.type || issue.category || '').toLowerCase();
                return category === selectedFilter.toLowerCase();
              })
    ) : [];

    // Filter options
    const filters = [
        { id: 'all', name: 'All Issues', icon: '🗺️', color: '#2196F3' },
        { id: 'infrastructure', name: 'Infrastructure', icon: '🏗️', color: '#ff9800' },
        { id: 'safety', name: 'Safety', icon: '🛡️', color: '#f44336' },
        { id: 'INFRASTRUCTURE', name: 'Infrastructure', icon: '🏗️', color: '#ff4757' },
        { id: 'SAFETY', name: 'Safety', icon: '🛡️', color: '#ffa502' },
        { id: 'ENVIRONMENT', name: 'Environment', icon: '🌿', color: '#4caf50' },
        { id: 'CLEANLINESS', name: 'Cleanliness', icon: '🧹', color: '#9c27b0' },
        { id: 'TRANSPORT', name: 'Transport', icon: '🚗', color: '#607d8b' },
    ];

    // Get category icon - moved before mapMarkers creation
    const getCategoryIcon = (category) => {
        const icons = {
            INFRASTRUCTURE: '🏗️',
            SAFETY: '🛡️',
            ENVIRONMENT: '🌿',
            CLEANLINESS: '🧹',
            TRANSPORT: '🚗'
        };
        return icons[category] || '📝';
    };

    // Format date helper function
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Create detailed pin-style markers
    const mapMarkers = filteredIssues.map(issue => {
        let pinColor;
        let statusIcon;
        
        // Set color and icon based on status
        switch (issue.status) {
            case 'REPORTED':
                pinColor = '#ff4757';
                statusIcon = '⚠️';
                break;
            case 'IN_PROGRESS':
                pinColor = '#ffa502';
                statusIcon = '🔧';
                break;
            case 'RESOLVED':
                pinColor = '#2ed573';
                statusIcon = '✅';
                break;
            case 'ASSIGNED_DEPT':
                pinColor = '#1e90ff';
                statusIcon = '👥';
                break;
            case 'ASSIGNED_STAFF':
                pinColor = '#7bed9f';
                statusIcon = '👤';
                break;
            case 'VERIFIED':
                pinColor = '#2ed573';
                statusIcon = '✔️';
                break;
            default:
                pinColor = '#ff4757';
                statusIcon = '⚠️';
        }
        const status = (issue.status || '').toLowerCase();
        if (status === 'in_progress' || status === 'in-progress') {
            pinColor = '#ffa502'; // Orange
            statusIcon = '⏳';
        }
        if (status === 'resolved' || status === 'completed' || status === 'closed') {
            pinColor = '#2ed573'; // Green  
            statusIcon = '✅';
        }
        
        // Enhanced priority visualization
        let priorityRing = '';
        let priorityIcon = '⚡';
        if (issue.priority === 'high') {
            priorityRing = '3px solid #ff0000';
            priorityIcon = '⚡⚡⚡';
        } else if (issue.priority === 'medium') {
            priorityRing = '2px solid #ffa500';
        } else {
            priorityRing = '1px solid #888888';
        }
        return {
            position: issue.location?.coordinates ? 
                { lat: issue.location.coordinates[1], lng: issue.location.coordinates[0] } :
                { lat: 28.6139, lng: 77.2090 }, // Default to Delhi if no coordinates
            icon: `
                <div style="
                    position: relative;
                    width: 40px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transform: translateY(-25px);
                ">
                    <!-- Pin Shadow -->
                    <div style="
                        position: absolute;
                        bottom: -5px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 10px;
                        height: 4px;
                        background-color: rgba(0,0,0,0.3);
                        border-radius: 50%;
                        filter: blur(1px);
                    "></div>
                    <!-- Pin Body -->
                    <div style="
                        position: absolute;
                        top: 0;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 30px;
                        height: 30px;
                        background-color: ${pinColor};
                        border-radius: 50% 50% 50% 0;
                        transform: translateX(-50%) rotate(-45deg);
                        border: ${priorityRing};
                        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
                    "></div>
                    <!-- Pin Icon -->
                    <div style="
                        position: absolute;
                        top: 5px;
                        left: 50%;
                        transform: translateX(-50%);
                        font-size: 12px;
                        z-index: 10;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    ">
                        ${statusIcon}
                    </div>
                    
                    <!-- Category Badge -->
                    <div style="
                        position: absolute;
                        bottom: 15px;
                        left: 50%;
                        transform: translateX(-50%);
                        background-color: white;
                        border: 1px solid #ddd;
                        border-radius: 10px;
                        padding: 2px 6px;
                        font-size: 8px;
                        font-weight: bold;
                        color: #333;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                        white-space: nowrap;
                    ">
                        ${getCategoryIcon(issue.category)}
                    </div>
                </div>
            `,
            size: [40, 50],
            id: issue._id ? issue._id.toString() : String(Math.random())
        };
    });

    // Handle marker clicks - fixed for LeafletView format
    const handleMessage = (message) => {
        try {
            console.log('Raw message received:', message);
            
            // LeafletView sends message directly, not in nativeEvent.data
            let data;
            if (message.nativeEvent && message.nativeEvent.data) {
                try {
                    // Try parsing as string first
                    data = JSON.parse(message.nativeEvent.data);
                } catch (e) {
                    console.log('Error parsing message data:', e);
                    data = message.nativeEvent.data;
                }
            } else if (typeof message === 'object' && message.event) {
                // Message is already an object
                data = message;
            } else {
                console.log('Invalid message structure:', message);
                return;
            }

            console.log('Parsed message data:', data);
            
            // Handle LeafletView's onMapMarkerClicked event
            if (data.event === 'onMapMarkerClicked') {
                const markerId = data.payload?.mapMarkerID;
                console.log('Marker clicked with ID:', markerId);
                
                const issue = filteredIssues.find(issue => issue.id.toString() === markerId);
                if (issue) {
                    console.log('Found issue:', issue.title);
                    setSelectedIssue(issue);
                    setModalVisible(true);
                } else {
                    console.log('No issue found for marker ID:', markerId);
                }
            } else if (data.event === 'onMoveEnd') {
                // Ignore map move events
                console.log('Map moved, ignoring');
            } else {
                console.log('Unknown event:', data.event);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
            console.error('Message that caused error:', message);
        }
    };

    // JavaScript code to inject into the map for marker interactions
    const injectedJavaScript = `
        // Global function to handle marker clicks
        window.handleMarkerClick = function(markerId) {
            console.log('Marker clicked via onclick:', markerId);
            try {
                const message = {
                    event: 'onMarkerClicked',
                    payload: {
                        markerId: markerId
                    }
                };
                window.ReactNativeWebView.postMessage(JSON.stringify(message));
            } catch (error) {
                console.error('Error in handleMarkerClick:', error);
            }
        };

        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded, marker click handler is ready');
        });
        
        true; // This is required for injected JavaScript
    `;

    // Get statistics by status
    const getStatsByStatus = (status) => {
        const count = filteredIssues.filter(issue => issue.status === status).length;
        return { count };
    };

    // Get statistics by category
    const getStatsByCategory = (category) => {
        return {
            total: filteredIssues.filter(issue => issue.type === category || issue.category === category).length,
            high: filteredIssues.filter(issue => (issue.type === category || issue.category === category) && issue.priority === 'high').length,
            resolved: filteredIssues.filter(issue => (issue.type === category || issue.category === category) && issue.status === 'resolved').length
        };
    };

    // Debug logging
    useEffect(() => {
        console.log('=== MAP WITH FULL UI DEBUG ===');
        console.log('Map center:', markerPosition);
        console.log('Zoom level:', mapZoom);
        console.log('Total markers:', mapMarkers.length);
        console.log('Filtered issues:', filteredIssues.length);
        console.log('Selected filter:', selectedFilter);
        console.log('=============================');
    }, [selectedFilter]);

    // Debug modal state changes
    useEffect(() => {
        console.log('Modal visibility changed:', modalVisible);
        console.log('Selected issue:', selectedIssue?.title || 'None');
    }, [modalVisible, selectedIssue]);

    return (
        <SafeAreaView style={[styles.container, backgroundStyle]}>
            {/* Header with Account Icon */}
            <View style={styles.headerContainer}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: textColor }]}>🗺️ India Civic Issues Map</Text>
                    <Text style={[styles.subtitle, { color: textColor }]}>
                        Interactive map showing civic issues across major cities
                    </Text>
                </View>
                <View style={styles.accountIconContainer}>
                    <AccountIcon />
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filtersSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {filters.map((filter) => (
                        <TouchableOpacity
                            key={filter.id}
                            style={[
                                styles.filterButton,
                                { borderColor },
                                selectedFilter === filter.id && { backgroundColor: filter.color, borderColor: filter.color }
                            ]}
                            onPress={() => setSelectedFilter(filter.id)}
                        >
                            <Text style={[
                                styles.filterText,
                                { color: textColor },
                                selectedFilter === filter.id && { color: '#ffffff' }
                            ]}>
                                {filter.icon} {filter.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Map Component */}
            {loading ? (
                <View style={styles.mapContainer}>
                    <View style={styles.loadingContainer}>
                        <Text style={[styles.loadingText, { color: textColor }]}>Loading map...</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.mapContainer} key="map-container">
                    <LeafletView
                        key="leaflet-view"
                        mapCenterPosition={markerPosition}
                        zoom={mapZoom}
                        onMessageReceived={handleMessage}
                        mapMarkers={mapMarkers}
                        onError={(error) => {
                            console.log('LeafletView Error:', error);
                        }}
                        onLoadEnd={() => {
                            console.log('Map loaded successfully');
                        }}
                        onLoadStart={() => {
                            console.log('Map loading started');
                        }}
                    />
                </View>
            )}

            {/* Enhanced Statistics */}
            <View style={styles.statisticsSection}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>📊 Issue Analytics Dashboard</Text>
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: '#ffebee' }]}>
                        <Text style={styles.statNumber}>{getStatsByStatus('REPORTED').count}</Text>
                        <Text style={styles.statLabel}>⚠️ Reported</Text>
                        <Text style={styles.statSubtext}>New Issues</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
                        <Text style={styles.statNumber}>{getStatsByStatus('IN_PROGRESS').count}</Text>
                        <Text style={styles.statLabel}>� In Progress</Text>
                        <Text style={styles.statSubtext}>Being Resolved</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#e8f5e8' }]}>
                        <Text style={styles.statNumber}>{getStatsByStatus('RESOLVED').count}</Text>
                        <Text style={styles.statLabel}>✅ Resolved</Text>
                        <Text style={styles.statSubtext}>Completed</Text>
                    </View>
                </View>
                
               

                {/* Category-wise Statistics */}
                <View style={styles.categoryStats}>
                    <Text style={[styles.sectionSubtitle, { color: textColor }]}>Category-wise Distribution</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {filters.filter(f => f.id !== 'all').map(category => {
                            const stats = getStatsByCategory(category.id);
                            return (
                                <View key={category.id} style={[styles.categoryCard, { borderColor: category.color }]}>
                                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                                    <Text style={[styles.categoryName, { color: textColor }]}>{category.name}</Text>
                                    <View style={styles.categoryDetails}>
                                        <Text style={[styles.categoryCount, { color: category.color }]}>{stats.total}</Text>
                                        <View style={styles.categoryMetrics}>
                                            <Text style={[styles.metricText, { color: textColor }]}>
                                                ⚡ {stats.high} High Priority
                                            </Text>
                                            <Text style={[styles.metricText, { color: textColor }]}>
                                                ✅ {stats.resolved} Resolved
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>

            {/* Enhanced Issue Details Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardBgColor }]}>
                        {selectedIssue && (
                            <>
                                <View style={styles.modalHeader}>
                                    <View style={styles.modalTitleContainer}>
                                        <Text style={[styles.modalTitle, { color: textColor }]}>
                                            {getCategoryIcon(selectedIssue.category)} {selectedIssue.title}
                                        </Text>
                                        <View style={[
                                            styles.statusBadge, 
                                            { backgroundColor: 
                                                selectedIssue.status === 'open' ? '#ff4757' :
                                                selectedIssue.status === 'in-progress' ? '#ffa502' : '#2ed573'
                                            }
                                        ]}>
                                            <Text style={styles.statusText}>
                                                {selectedIssue.status === 'open' ? '🔴 OPEN' :
                                                 selectedIssue.status === 'in-progress' ? '🟡 IN PROGRESS' : '🟢 RESOLVED'}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={styles.closeButtonText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                
                                <ScrollView style={styles.modalScrollView}>
                                    {/* Description */}
                                    <View style={styles.modalSection}>
                                        <Text style={[styles.sectionTitle, { color: textColor }]}>📝 Description</Text>
                                        <Text style={[styles.modalDescription, { color: textColor }]}>
                                            {selectedIssue.description}
                                        </Text>
                                    </View>

                                    {/* Location Details */}
                                    <View style={styles.modalSection}>
                                        <Text style={[styles.sectionTitle, { color: textColor }]}>📍 Location Details</Text>
                                        <Text style={[styles.modalDetailText, { color: textColor }]}>
                                            <Text style={styles.labelText}>Area: </Text>
                                            {selectedIssue.location?.address || 'N/A'}
                                        </Text>
                                        <Text style={[styles.modalDetailText, { color: textColor }]}>
                                            <Text style={styles.labelText}>Coordinates: </Text>
                                            {selectedIssue.location?.coordinates ? 
                                                `${selectedIssue.location.coordinates[1].toFixed(4)}, ${selectedIssue.location.coordinates[0].toFixed(4)}` 
                                                : 'N/A'}
                                        </Text>
                                    </View>

                                    {/* Issue Information */}
                                    <View style={styles.modalSection}>
                                        <Text style={[styles.sectionTitle, { color: textColor }]}>ℹ️ Issue Information</Text>
                                        <View style={styles.infoGrid}>
                                            <View style={styles.infoItem}>
                                                <Text style={[styles.infoLabel, { color: textColor }]}>Category</Text>
                                                <Text style={[styles.infoValue, { color: textColor }]}>
                                                    {selectedIssue.category.charAt(0).toUpperCase() + selectedIssue.category.slice(1)}
                                                </Text>
                                            </View>
                                            <View style={styles.infoItem}>
                                                <Text style={[styles.infoLabel, { color: textColor }]}>Priority</Text>
                                                <Text style={[
                                                    styles.infoValue, 
                                                    { color: selectedIssue.priority === 'high' ? '#ff4757' : 
                                                             selectedIssue.priority === 'medium' ? '#ffa502' : '#666' }
                                                ]}>
                                                    {selectedIssue.priority.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.modalDetailText, { color: textColor }]}>
                                            <Text style={styles.labelText}>Reported Date: </Text>{selectedIssue.date}
                                        </Text>
                                        <Text style={[styles.modalDetailText, { color: textColor }]}>
                                            <Text style={styles.labelText}>Reported By: </Text>{selectedIssue.reportedBy}
                                        </Text>
                                    </View>

                                    {/* Cost & Timeline */}
                                    <View style={styles.modalSection}>
                                        <Text style={[styles.sectionTitle, { color: textColor }]}>💰 Cost & Timeline</Text>
                                        <View style={styles.infoGrid}>
                                            <View style={styles.infoItem}>
                                                <Text style={[styles.infoLabel, { color: textColor }]}>Estimated Cost</Text>
                                                <Text style={[styles.infoValue, { color: '#2ed573' }]}>
                                                    {selectedIssue.estimatedCost}
                                                </Text>
                                            </View>
                                            <View style={styles.infoItem}>
                                                <Text style={[styles.infoLabel, { color: textColor }]}>Expected Resolution</Text>
                                                <Text style={[styles.infoValue, { color: textColor }]}>
                                                    {selectedIssue.expectedResolution}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </ScrollView>
                                
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, { backgroundColor: '#2196F3' }]}
                                        onPress={() => setModalVisible(false)}
                                    >
                                        <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>Close Details</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // Category Statistics Styles
    categoryStats: {
        marginTop: 15,
        paddingVertical: 10,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    categoryCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 6,
        borderLeftWidth: 3,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        minWidth: 150,
    },
    categoryIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    categoryName: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    categoryDetails: {
        alignItems: 'center',
    },
    categoryCount: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    categoryMetrics: {
        width: '100%',
    },
    metricText: {
        fontSize: 10,
        marginTop: 2,
        opacity: 0.8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        opacity: 0.9,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    container: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    header: {
        flex: 1,
        paddingRight: 16,
    },
    accountIconContainer: {
        marginLeft: 'auto',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        opacity: 0.7,
    },
    filtersSection: {
        padding: 10,
    },
    filterScroll: {
        paddingHorizontal: 5,
    },
    filterButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginHorizontal: 5,
        borderRadius: 20,
        borderWidth: 1,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '500',
    },
    mapContainer: {
        height: 300,
        margin: 10,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#e0e0e0',
    },
    statisticsSection: {
        padding: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    statCard: {
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        minWidth: 80,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    statSubtext: {
        fontSize: 9,
        color: '#999',
        marginTop: 2,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    additionalStats: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    statRowLabel: {
        fontSize: 12,
        flex: 1,
    },
    statRowValue: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    summaryText: {
        textAlign: 'center',
        fontSize: 12,
        opacity: 0.7,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        fontSize: 16,
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    modalTitleContainer: {
        flex: 1,
        marginRight: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        lineHeight: 24,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 5,
        borderRadius: 15,
        backgroundColor: '#f0f0f0',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: 'bold',
    },
    modalScrollView: {
        maxHeight: 400,
    },
    modalSection: {
        marginBottom: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#2196F3',
    },
    modalDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    modalDetailText: {
        fontSize: 12,
        marginBottom: 5,
        lineHeight: 16,
    },
    labelText: {
        fontWeight: 'bold',
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    infoItem: {
        flex: 1,
        marginHorizontal: 5,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    infoValue: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalButtonText: {
        fontWeight: 'bold',
    },
});

export default MapScreen;