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
} from 'react-native';
import { LeafletView } from 'react-native-leaflet-view';

// Enhanced sample civic issues data across major Indian citiesrr
const sampleIssues = [
  {
    id: 1,
    title: "Broken Street Light",
    description: "Street light not working for 2 weeks causing safety issues for pedestrians and vehicles during night hours. Multiple accidents reported.",
    location: "Connaught Place, New Delhi",
    address: "Block A, Connaught Place, Central Delhi, Delhi 110001",
    latitude: 28.6315,
    longitude: 77.2167,
    status: "open",
    category: "infrastructure",
    priority: "high",
    date: "2024-01-15",
    reportedBy: "Delhi Municipal Corporation",
    estimatedCost: "₹15,000",
    expectedResolution: "7 days"
  },
  {
    id: 2,
    title: "Pothole on Main Road", 
    description: "Large pothole causing traffic issues and vehicle damage. Approximately 2 feet wide and 6 inches deep, affecting traffic flow significantly.",
    location: "Bandra West, Mumbai",
    address: "SV Road, Bandra West, Mumbai, Maharashtra 400050",
    latitude: 19.0596,
    longitude: 72.8295,
    status: "in-progress",
    category: "infrastructure",
    priority: "medium", 
    date: "2024-01-12",
    reportedBy: "Brihanmumbai Municipal Corporation",
    estimatedCost: "₹25,000",
    expectedResolution: "10 days"
  },
  {
    id: 3,
    title: "Garbage Collection Issue",
    description: "Garbage not collected for 3 days, creating unhygienic conditions and foul smell. Attracting stray animals and insects.",
    location: "Koramangala, Bangalore",
    address: "5th Block, Koramangala, Bengaluru, Karnataka 560095",
    latitude: 12.9279,
    longitude: 77.6271,
    status: "resolved",
    category: "cleanliness",
    priority: "medium",
    date: "2024-01-10",
    reportedBy: "Bruhat Bengaluru Mahanagara Palike",
    estimatedCost: "₹5,000",
    expectedResolution: "Completed"
  },
  {
    id: 4,
    title: "Traffic Signal Malfunction",
    description: "Traffic light stuck on red causing major traffic jams during peak hours. Electronic control system needs immediate repair.",
    location: "Anna Salai, Chennai",
    address: "Anna Salai, Thousand Lights, Chennai, Tamil Nadu 600002",
    latitude: 13.0675,
    longitude: 80.2372,
    status: "open",
    category: "infrastructure", 
    priority: "high",
    date: "2024-01-14",
    reportedBy: "Greater Chennai Corporation",
    estimatedCost: "₹50,000",
    expectedResolution: "5 days"
  },
  {
    id: 5,
    title: "Illegal Parking Issue",
    description: "Vehicles parked on footpath blocking pedestrian access and creating safety hazards for disabled individuals.",
    location: "Park Street, Kolkata",
    address: "Park Street, Kolkata, West Bengal 700016",
    latitude: 22.5542,
    longitude: 88.3517,
    status: "in-progress",
    category: "safety",
    priority: "medium",
    date: "2024-01-13",
    reportedBy: "Kolkata Municipal Corporation",
    estimatedCost: "₹10,000",
    expectedResolution: "14 days"
  },
  {
    id: 6,
    title: "Water Pipeline Leak",
    description: "Major water pipeline burst causing water wastage and road damage. Affecting water supply to nearby residential areas.",
    location: "Jubilee Hills, Hyderabad",
    address: "Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033",
    latitude: 17.4326,
    longitude: 78.4071,
    status: "open",
    category: "infrastructure",
    priority: "high",
    date: "2024-01-16",
    reportedBy: "Greater Hyderabad Municipal Corporation",
    estimatedCost: "₹75,000",
    expectedResolution: "3 days"
  },
  {
    id: 7,
    title: "Park Maintenance Required",
    description: "Public park in poor condition with broken benches, overgrown vegetation, and non-functional playground equipment.",
    location: "Fateh Maidan, Hyderabad",
    address: "Fateh Maidan, Basheerbagh, Hyderabad, Telangana 500004",
    latitude: 17.4065,
    longitude: 78.4772,
    status: "open",
    category: "environment",
    priority: "low",
    date: "2024-01-11",
    reportedBy: "Parks and Recreation Department",
    estimatedCost: "₹1,20,000",
    expectedResolution: "30 days"
  },
  {
    id: 8,
    title: "Noise Pollution from Construction",
    description: "Excessive noise from construction site violating permitted hours and disturbing residents and nearby school.",
    location: "Sector 18, Noida",
    address: "Sector 18, Noida, Uttar Pradesh 201301",
    latitude: 28.5706,
    longitude: 77.3272,
    status: "in-progress",
    category: "environment",
    priority: "medium",
    date: "2024-01-09",
    reportedBy: "Noida Authority",
    estimatedCost: "₹0",
    expectedResolution: "7 days"
  },
  {
    id: 9,
    title: "Bus Stop Shelter Damaged",
    description: "Bus shelter roof collapsed due to heavy winds. Commuters exposed to weather conditions.",
    location: "MG Road, Pune",
    address: "Mahatma Gandhi Road, Camp, Pune, Maharashtra 411001",
    latitude: 18.5158,
    longitude: 73.8567,
    status: "open",
    category: "transport",
    priority: "medium",
    date: "2024-01-17",
    reportedBy: "Pune Municipal Corporation",
    estimatedCost: "₹40,000",
    expectedResolution: "15 days"
  },
  {
    id: 10,
    title: "Stray Dog Menace",
    description: "Increasing number of aggressive stray dogs in residential area posing threat to children and elderly residents.",
    location: "Velachery, Chennai",
    address: "Velachery Main Road, Chennai, Tamil Nadu 600042",
    latitude: 12.9759,
    longitude: 80.2336,
    status: "open",
    category: "safety",
    priority: "high",
    date: "2024-01-18",
    reportedBy: "Animal Welfare Board",
    estimatedCost: "₹30,000",
    expectedResolution: "21 days"
  }
];

const MapScreen = ({ navigation }) => {
    // Use the same working Delhi coordinates
    const markerPosition = { lat: 28.6139, lng: 77.2090 };
    const mapZoom = 6;
    
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const isDarkMode = useColorScheme() === 'dark';
    const { width, height } = Dimensions.get('window');
    
    const backgroundStyle = {
        backgroundColor: isDarkMode ? '#000000' : '#ffffff',
    };
    
    const textColor = isDarkMode ? '#ffffff' : '#000000';
    const borderColor = isDarkMode ? '#333333' : '#dddddd';
    const cardBgColor = isDarkMode ? '#1e1e1e' : '#ffffff';

    // Filter options
    const filters = [
        { id: 'all', name: 'All Issues', icon: '🗺️', color: '#2196F3' },
        { id: 'infrastructure', name: 'Infrastructure', icon: '🏗️', color: '#ff9800' },
        { id: 'safety', name: 'Safety', icon: '🛡️', color: '#f44336' },
        { id: 'environment', name: 'Environment', icon: '🌿', color: '#4caf50' },
        { id: 'cleanliness', name: 'Cleanliness', icon: '🧹', color: '#9c27b0' },
        { id: 'transport', name: 'Transport', icon: '🚗', color: '#607d8b' },
    ];

    // Filter issues based on selected filter
    const filteredIssues = selectedFilter === 'all' 
        ? sampleIssues 
        : sampleIssues.filter(issue => issue.category === selectedFilter);

    // Get category icon - moved before mapMarkers creation
    const getCategoryIcon = (category) => {
        const icons = {
            infrastructure: '🏗️',
            safety: '🛡️',
            environment: '🌿',
            cleanliness: '🧹',
            transport: '🚗'
        };
        return icons[category] || '📝';
    };

    // Create detailed pin-style markers
    const mapMarkers = filteredIssues.map(issue => {
        let pinColor = '#ff4757'; // Default red for open
        let statusIcon = '⚠️';
        
        if (issue.status === 'in-progress') {
            pinColor = '#ffa502'; // Orange
            statusIcon = '�';
        }
        if (issue.status === 'resolved') {
            pinColor = '#2ed573'; // Green  
            statusIcon = '✅';
        }

        let priorityRing = '';
        if (issue.priority === 'high') {
            priorityRing = '3px solid #ff0000';
        } else if (issue.priority === 'medium') {
            priorityRing = '2px solid #ffa500';
        } else {
            priorityRing = '1px solid #888888';
        }
        
        return {
            position: { lat: issue.latitude, lng: issue.longitude },
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
            id: issue.id.toString()
        };
    });

    // Handle marker clicks - fixed for LeafletView format
    const handleMessage = (message) => {
        try {
            console.log('Raw message received:', message);
            
            // LeafletView sends message directly, not in nativeEvent.data
            let data;
            if (message.nativeEvent && message.nativeEvent.data) {
                // Try parsing as string first
                data = JSON.parse(message.nativeEvent.data);
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
                
                const issue = sampleIssues.find(issue => issue.id.toString() === markerId);
                if (issue) {
                    console.log('Found issue:', issue.title);
                    console.log('Setting modal visible to true');
                    setSelectedIssue(issue);
                    setModalVisible(true);
                    
                    // Add a small delay to ensure state is updated
                    setTimeout(() => {
                        console.log('Modal should now be visible');
                    }, 100);
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
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: textColor }]}>🗺️ India Civic Issues Map</Text>
                <Text style={[styles.subtitle, { color: textColor }]}>
                    Interactive map showing civic issues across major cities
                </Text>
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

            {/* Map - Simple configuration without injected JavaScript */}
            <View style={styles.mapContainer}>
                <LeafletView
                    mapCenterPosition={markerPosition}
                    zoom={mapZoom}
                    onMessageReceived={handleMessage}
                    mapMarkers={mapMarkers}
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <Text style={[styles.loadingText, { color: textColor }]}>Loading map...</Text>
                        </View>
                    )}
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

            {/* Enhanced Statistics */}
            <View style={styles.statisticsSection}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>📊 Issue Analytics Dashboard</Text>
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: '#ffebee' }]}>
                        <Text style={styles.statNumber}>{getStatsByStatus('open').count}</Text>
                        <Text style={styles.statLabel}>🔴 Open Issues</Text>
                        <Text style={styles.statSubtext}>Needs Attention</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
                        <Text style={styles.statNumber}>{getStatsByStatus('in-progress').count}</Text>
                        <Text style={styles.statLabel}>🟡 In Progress</Text>
                        <Text style={styles.statSubtext}>Being Resolved</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#e8f5e8' }]}>
                        <Text style={styles.statNumber}>{getStatsByStatus('resolved').count}</Text>
                        <Text style={styles.statLabel}>🟢 Resolved</Text>
                        <Text style={styles.statSubtext}>Completed</Text>
                    </View>
                </View>
                
                {/* Additional Stats */}
                <View style={styles.additionalStats}>
                    <View style={styles.statRow}>
                        <Text style={[styles.statRowLabel, { color: textColor }]}>📈 Total Issues:</Text>
                        <Text style={[styles.statRowValue, { color: textColor }]}>{sampleIssues.length}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={[styles.statRowLabel, { color: textColor }]}>🔍 Currently Viewing:</Text>
                        <Text style={[styles.statRowValue, { color: textColor }]}>{filteredIssues.length}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={[styles.statRowLabel, { color: textColor }]}>🏙️ Cities Covered:</Text>
                        <Text style={[styles.statRowValue, { color: textColor }]}>
                            {[...new Set(sampleIssues.map(issue => issue.location.split(',')[1]?.trim()))].length}
                        </Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={[styles.statRowLabel, { color: textColor }]}>⚡ High Priority:</Text>
                        <Text style={[styles.statRowValue, { color: '#ff4757' }]}>
                            {filteredIssues.filter(issue => issue.priority === 'high').length}
                        </Text>
                    </View>
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
                                            <Text style={styles.labelText}>Area: </Text>{selectedIssue.location}
                                        </Text>
                                        <Text style={[styles.modalDetailText, { color: textColor }]}>
                                            <Text style={styles.labelText}>Address: </Text>{selectedIssue.address}
                                        </Text>
                                        <Text style={[styles.modalDetailText, { color: textColor }]}>
                                            <Text style={styles.labelText}>Coordinates: </Text>
                                            {selectedIssue.latitude.toFixed(4)}, {selectedIssue.longitude.toFixed(4)}
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
    container: {
        flex: 1,
    },
    header: {
        padding: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
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