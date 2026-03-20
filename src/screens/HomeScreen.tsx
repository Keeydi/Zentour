import { colors } from '../theme/colors';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, KeyboardAvoidingView, Platform, Keyboard, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { RootStackParamList } from '../../App';
import { useLocation } from '../contexts/LocationContext';
import { useJeepney } from '../contexts/TricycleContext';
import { useJeepneyLocation } from '../contexts/JeepneyLocationContext';
import { useAuth } from '../contexts/AuthContext';
import { useDriver } from '../contexts/DriverContext';
import { filterOnlineJeepneys } from '../utils/filterOnlineJeepneys';
import { useNearestJeepney } from '../hooks/useNearestJeepney';
import { useJeepneyETAs } from '../hooks/useJeepneyETAs';
import Header from '../components/Header';
import OnlineStatusBanner from '../components/OnlineStatusBanner';
import DestinationSearchBar, { DestinationSearchBarRef } from '../components/DestinationSearchBar';
import JeepneyInfoModal from '../components/JeepneyInfoModal';
import JeepneyComparisonModal from '../components/JeepneyComparisonModal';
import TransportModeFilter from '../components/TransportModeFilter';
import { Destination, Jeepney, VehicleType, RouteStop } from '../types';
import { routeStops } from '../data/mockData';
import { calculateDistance, estimateETA } from '../utils/calculations';
import { calculateFullRoutePath, RoutePoint } from '../services/RouteService';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { location, error } = useLocation();
  const { setSelectedJeepney } = useJeepney();
  const [routePathCoordinates, setRoutePathCoordinates] = React.useState<RoutePoint[]>([]);
  const { jeepneys } = useJeepneyLocation(); // Get real-time jeepney locations
  const { isAuthenticated } = useAuth();
  const { isAuthenticated: isDriverAuthenticated } = useDriver();

  // Redirect drivers to DriverDashboard - they shouldn't see passenger screens
  useEffect(() => {
    if (isDriverAuthenticated && !isAuthenticated) {
      navigation.replace('DriverDashboard');
    }
  }, [isDriverAuthenticated, isAuthenticated, navigation]);
  const [isLoading, setIsLoading] = useState(true);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedJeepneyForModal, setSelectedJeepneyForModal] = useState<Jeepney | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isComparisonModalVisible, setIsComparisonModalVisible] = useState(false);
  const [etaSortOrder, setEtaSortOrder] = useState<'eta' | 'distance' | 'none'>('eta');
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<VehicleType[]>(['Jeepney', 'E-Jeep', 'Bus', 'UV Express', 'Tricycle']);
  const searchBarRef = useRef<DestinationSearchBarRef>(null);
  
  // Filter online jeepneys only (using real-time data)
  const onlineJeepneys = filterOnlineJeepneys(jeepneys);
  
  // Filter by vehicle type
  const filteredJeepneys = onlineJeepneys.filter(jeepney => 
    !jeepney.vehicleType || selectedVehicleTypes.includes(jeepney.vehicleType as VehicleType)
  );
  
  // Get ETAs for filtered jeepneys
  const jeepneyETAs = useJeepneyETAs(filteredJeepneys, location, etaSortOrder);
  
  // Auto-select nearest jeepney
  const nearestJeepney = useNearestJeepney(filteredJeepneys, location);

  // Calculate route path following roads
  React.useEffect(() => {
    const loadRoutePath = async () => {
      try {
        const stops: RoutePoint[] = routeStops.map(stop => ({
          latitude: stop.latitude,
          longitude: stop.longitude,
        }));
        
        console.log('HomeScreen: Loading route path for', stops.length, 'stops');
        
        // Check if API key is available
        const orsKey = process.env.EXPO_PUBLIC_ORS_API_KEY;
        const googleKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        const hasApiKey = !!(orsKey || googleKey);
        
        // Try to get road-following route, fallback to straight lines if API not available
        const path = await calculateFullRoutePath(stops, {
          useApi: hasApiKey,
          apiKey: orsKey || googleKey,
          provider: orsKey ? 'openrouteservice' : 'google',
        });
        
        if (path && path.length > 0) {
          setRoutePathCoordinates(path);
          console.log('HomeScreen: Route path set with', path.length, 'coordinates');
        } else {
          // Fallback: use straight lines
          const fallbackPath = routeStops.map(stop => ({
            latitude: stop.latitude,
            longitude: stop.longitude,
          }));
          setRoutePathCoordinates(fallbackPath);
          console.log('HomeScreen: Using fallback path with', fallbackPath.length, 'coordinates');
        }
      } catch (error) {
        console.error('HomeScreen: Error loading route path:', error);
        // Fallback to straight lines
        const fallbackPath = routeStops.map(stop => ({
          latitude: stop.latitude,
          longitude: stop.longitude,
        }));
        setRoutePathCoordinates(fallbackPath);
      }
    };

    loadRoutePath();
  }, []);

  // Find nearest stop and calculate distance/ETA
  const nearestStopInfo = React.useMemo(() => {
    if (!location || routeStops.length === 0) {
      return null;
    }

    let nearestStop: RouteStop | null = null;
    let minDistance = Infinity;

    routeStops.forEach((stop) => {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        stop.latitude,
        stop.longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestStop = stop;
      }
    });

    if (!nearestStop) return null;

    // Calculate ETA (walking speed ~5 km/h)
    const walkingSpeedKmh = 5;
    const timeInHours = minDistance / walkingSpeedKmh;
    const timeInMinutes = Math.round(timeInHours * 60);

    return {
      stop: nearestStop,
      distance: minDistance,
      eta: timeInMinutes || 1, // Minimum 1 minute
    };
  }, [location]);
  
  const handleVehicleTypeToggle = (type: VehicleType) => {
    setSelectedVehicleTypes(prev => {
      if (prev.includes(type)) {
        // If all types are selected, don't allow deselecting the last one
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-select nearest jeepney when location is available
    if (nearestJeepney && location) {
      setSelectedJeepney(nearestJeepney.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearestJeepney, location]);

  const handleJeepneyPress = (jeepneyId: string) => {
    const jeepney = onlineJeepneys.find(j => j.id === jeepneyId);
    if (jeepney) {
      setSelectedJeepney(jeepneyId);
      setSelectedJeepneyForModal(jeepney);
      setIsModalVisible(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedJeepneyForModal(null);
  };

  const handleDestinationSelect = (dest: Destination) => {
    setDestination(dest);
    // Navigate to map if destination is selected
    if (location) {
      navigation.navigate('Map');
    }
  };

  if (error) {
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <Header />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Location permission is required to use this app.
          </Text>
          <Text style={styles.errorSubtext}>
            Please enable location permissions in your device settings.
          </Text>
        </View>
        <OnlineStatusBanner isLoading={isLoading} />
        <DestinationSearchBar onDestinationSelect={handleDestinationSelect} />
      </KeyboardAvoidingView>
    );
  }

  if (!location) {
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
        <OnlineStatusBanner isLoading={isLoading} />
        <DestinationSearchBar onDestinationSelect={handleDestinationSelect} />
      </KeyboardAvoidingView>
    );
  }

  // Calculate region that includes user location, all route stops, and all jeepneys
  const allCoordinates: { latitude: number; longitude: number }[] = [];
  
  // Add user location if available
  if (location) {
    allCoordinates.push({ 
      latitude: location.coords.latitude, 
      longitude: location.coords.longitude 
    });
  }
  
  // Add all route stops
  routeStops.forEach(stop => {
    allCoordinates.push({ latitude: stop.latitude, longitude: stop.longitude });
  });
  
  // Add all jeepneys
  filteredJeepneys.forEach(jeepney => {
    allCoordinates.push({ latitude: jeepney.latitude, longitude: jeepney.longitude });
  });

  const latitudes = allCoordinates.map(c => c.latitude);
  const longitudes = allCoordinates.map(c => c.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  // Calculate center
  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;
  
  // Calculate deltas with padding (40% extra on each side for better visibility)
  const latDelta = Math.max((maxLat - minLat) * 1.4, 0.01);
  const lonDelta = Math.max((maxLon - minLon) * 1.4, 0.01);

  const initialRegion = {
    latitude: centerLat,
    longitude: centerLon,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <Header />
      <OnlineStatusBanner isLoading={isLoading} />
      
      {/* Nearest Stop Info */}
      {nearestStopInfo && (
        <View style={styles.nearestStopCard}>
          <View style={styles.nearestStopHeader}>
            <View style={styles.nearestStopIconContainer}>
              <View style={styles.nearestStopIcon}>
                <Text style={styles.nearestStopIconText}>📍</Text>
              </View>
            </View>
            <View style={styles.nearestStopTitleSection}>
              <Text style={styles.nearestStopLabel}>Nearest Stop</Text>
              <Text style={styles.nearestStopName}>
                {nearestStopInfo.stop.name || `Stop ${nearestStopInfo.stop.id}`}
              </Text>
            </View>
          </View>
          
          <View style={styles.nearestStopMetrics}>
            <View style={styles.nearestStopMetricCard}>
              <View style={styles.nearestStopMetricIcon}>
                <Text style={styles.nearestStopMetricIconText}>📏</Text>
              </View>
              <View style={styles.nearestStopMetricContent}>
                <Text style={styles.nearestStopMetricValue}>
                  {nearestStopInfo.distance < 1 
                    ? `${Math.round(nearestStopInfo.distance * 1000)}m`
                    : `${nearestStopInfo.distance.toFixed(2)}km`}
                </Text>
                <Text style={styles.nearestStopMetricLabel}>Distance</Text>
              </View>
            </View>
            
            <View style={styles.nearestStopMetricCard}>
              <View style={styles.nearestStopMetricIcon}>
                <Text style={styles.nearestStopMetricIconText}>🚶</Text>
              </View>
              <View style={styles.nearestStopMetricContent}>
                <Text style={styles.nearestStopMetricValue}>
                  {nearestStopInfo.eta} min
                </Text>
                <Text style={styles.nearestStopMetricLabel}>Walking Time</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <TransportModeFilter 
        selectedModes={selectedVehicleTypes}
        onModeToggle={handleVehicleTypeToggle}
      />
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
          followsUserLocation={false}
          showsMyLocationButton={true}
          provider={Platform.OS === 'android' ? undefined : undefined} // Use default provider (can be customized)
          mapType="standard"
          onPress={() => {
            // Cancel search when map is pressed
            if (isSearchFocused || searchBarRef.current) {
              Keyboard.dismiss();
              searchBarRef.current?.dismiss();
              setIsSearchFocused(false);
            }
          }}
        >
          {/* Official Route Line - Follows actual roads */}
          {routePathCoordinates && routePathCoordinates.length >= 2 ? (
            <Polyline
              coordinates={routePathCoordinates}
              strokeColor={colors.route}
              strokeWidth={6}
              lineCap="round"
              lineJoin="round"
            />
          ) : (
            // Fallback: Show straight lines if route path not loaded yet
            routeStops.length >= 2 && (
              <Polyline
                coordinates={routeStops.map(stop => ({
                  latitude: stop.latitude,
                  longitude: stop.longitude,
                }))}
                strokeColor={colors.route}
                strokeWidth={6}
                lineCap="round"
                lineJoin="round"
              />
            )
          )}

          {/* Route Stop Markers */}
          {routeStops.map((stop) => (
            <Marker
              key={stop.id}
              coordinate={{
                latitude: stop.latitude,
                longitude: stop.longitude,
              }}
              title={stop.name || `Stop ${stop.id}`}
              description="Jeepney Stop"
              pinColor="#9E9E9E"
              opacity={0.7}
            />
          ))}

          {/* Online Jeepney Markers */}
          {filteredJeepneys.map((jeepney) => (
              <Marker
                key={jeepney.id}
                coordinate={{
                  latitude: jeepney.latitude,
                  longitude: jeepney.longitude,
                }}
                title={`Jeepney ${jeepney.id}`}
                description={`Route: ${jeepney.route || 'Anonas-Lagro'}`}
                onPress={() => handleJeepneyPress(jeepney.id)}
                pinColor="#4CAF50"
              />
          ))}
        </MapView>
      </View>
      <DestinationSearchBar 
        ref={searchBarRef}
        onDestinationSelect={handleDestinationSelect}
        onFocusChange={(focused) => setIsSearchFocused(focused)}
      />
      {/* Compare Jeepneys Button */}
      {filteredJeepneys.length > 1 && (
        <TouchableOpacity
          style={styles.compareButton}
          onPress={() => setIsComparisonModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.compareButtonText}>
            Compare {filteredJeepneys.length} Vehicles
          </Text>
        </TouchableOpacity>
      )}

      <JeepneyInfoModal
        visible={isModalVisible}
        jeepney={selectedJeepneyForModal}
        userLocation={location}
        onClose={handleCloseModal}
      />
      
      <JeepneyComparisonModal
        visible={isComparisonModalVisible}
        jeepneyETAs={jeepneyETAs}
        onClose={() => setIsComparisonModalVisible(false)}
        onSelectJeepney={(jeepneyId) => {
          setSelectedJeepney(jeepneyId);
          const jeepney = onlineJeepneys.find(j => j.id === jeepneyId);
          if (jeepney) {
            setSelectedJeepneyForModal(jeepney);
            setIsModalVisible(true);
          }
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  compareButton: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#1E88E5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#1565C0',
  },
  compareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '400',
  },
  nearestStopCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#E3F2FD',
  },
  nearestStopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#F0F7FF',
  },
  nearestStopIconContainer: {
    marginRight: 14,
  },
  nearestStopIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1E88E5',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nearestStopIconText: {
    fontSize: 28,
  },
  nearestStopTitleSection: {
    flex: 1,
  },
  nearestStopLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 6,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nearestStopName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E88E5',
    letterSpacing: 0.5,
  },
  nearestStopMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  nearestStopMetricCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    gap: 12,
  },
  nearestStopMetricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nearestStopMetricIconText: {
    fontSize: 20,
  },
  nearestStopMetricContent: {
    flex: 1,
  },
  nearestStopMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 4,
  },
  nearestStopMetricLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default HomeScreen;

