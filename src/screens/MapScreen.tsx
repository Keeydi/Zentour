import { colors } from '../theme/colors';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
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
import { calculateRouteInfo } from '../utils/calculations';
import { calculateRoute, RoutePoint, calculateFullRoutePath } from '../services/RouteService';
import { arrivalService, ArrivalDestination } from '../services/ArrivalService';
import DistanceBadge from '../components/DistanceBadge';
import ETABadge from '../components/ETABadge';
import RouteCoverageDisplay from '../components/RouteCoverageDisplay';
import RouteSuggestions from '../components/RouteSuggestions';
import { routeLocations } from '../data/routeLocations';
import { routeStops } from '../data/mockData';
import { RouteInfo, Destination } from '../types';

type MapScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Map'>;

const MapScreen: React.FC = () => {
  const navigation = useNavigation<MapScreenNavigationProp>();
  const { location } = useLocation();
  const { selectedJeepney, setSelectedJeepney } = useJeepney();
  const { jeepneys, getJeepneyLocation } = useJeepneyLocation(); // Get real-time jeepney locations
  const { isAuthenticated } = useAuth();
  const { isAuthenticated: isDriverAuthenticated } = useDriver();

  // Redirect drivers to DriverDashboard - they shouldn't see passenger screens
  useEffect(() => {
    if (isDriverAuthenticated && !isAuthenticated) {
      navigation.replace('DriverDashboard');
    }
  }, [isDriverAuthenticated, isAuthenticated, navigation]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RoutePoint[]>([]);
  const [routePathCoordinates, setRoutePathCoordinates] = useState<RoutePoint[]>([]);
  const [isTrackingArrival, setIsTrackingArrival] = useState(false);
  const [showRouteCoverage, setShowRouteCoverage] = useState(false);
  const [showRouteSuggestions, setShowRouteSuggestions] = useState(false);

  // Filter online jeepneys only (using real-time data)
  const onlineJeepneys = filterOnlineJeepneys(jeepneys);

  const selectedJeepneyData = selectedJeepney
    ? onlineJeepneys.find((j) => j.id === selectedJeepney)
    : null;

  // Get real-time jeepney location with speed data
  const jeepneyLocation = selectedJeepney ? getJeepneyLocation(selectedJeepney) : null;

  useEffect(() => {
    if (location && selectedJeepneyData) {
      // Use actual GPS speed from jeepney location if available
      const jeepneySpeedMs = jeepneyLocation?.coords.speed || null;
      
      const info = calculateRouteInfo(
        location,
        selectedJeepneyData.latitude,
        selectedJeepneyData.longitude,
        jeepneySpeedMs
      );
      setRouteInfo(info);
      
      // Mock destination - in real app, this would come from user input
      // For now, use a destination near the jeepney
      const dest: Destination = {
        latitude: selectedJeepneyData.latitude + 0.002,
        longitude: selectedJeepneyData.longitude + 0.002,
        address: 'Destination',
      };
      setDestination(dest);
      
      // Start tracking arrival if destination is set and jeepney is selected
      if (selectedJeepney && jeepneyLocation && dest) {
        const arrivalDest: ArrivalDestination = {
          id: `dest-${selectedJeepney}`,
          latitude: dest.latitude,
          longitude: dest.longitude,
          address: dest.address,
          arrivalRadius: 0.05, // 50 meters
        };
        
        arrivalService.startTracking(selectedJeepney, jeepneyLocation, arrivalDest);
        setIsTrackingArrival(true);
        
        // Subscribe to arrival notifications
        const unsubscribe = arrivalService.onArrival(selectedJeepney, (tracking) => {
          // Arrival detected - notification already shown by service
          setIsTrackingArrival(false);
        });
        
        return () => {
          unsubscribe();
          arrivalService.stopTracking(selectedJeepney);
        };
      }
      
      // Calculate route using routing API if available, otherwise use straight-line
      (async () => {
        try {
          const route = await calculateRoute(
            {
              latitude: selectedJeepneyData.latitude,
              longitude: selectedJeepneyData.longitude,
            },
            dest,
            {
              useApi: !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
              apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            }
          );
          
          // Update route coordinates for polyline display
          if (route.coordinates.length > 0) {
            setRouteCoordinates(route.coordinates);
            
            // Update route info with API-calculated distance if available
            if (route.distance > 0) {
              setRouteInfo({
                distance: route.distance,
                eta: info.eta, // Keep ETA from previous calculation (uses GPS speed)
              });
            }
          }
        } catch (error) {
          // Route API failed, use straight-line
          setRouteCoordinates([
            {
              latitude: selectedJeepneyData.latitude,
              longitude: selectedJeepneyData.longitude,
            },
            dest,
          ]);
        }
      })();
    }
  }, [location, selectedJeepneyData, jeepneyLocation, selectedJeepney]);

  // Update arrival tracking when jeepney location changes
  useEffect(() => {
    if (isTrackingArrival && selectedJeepney && jeepneyLocation && destination) {
      arrivalService.updateJeepneyLocation(selectedJeepney, jeepneyLocation);
    }
  }, [isTrackingArrival, selectedJeepney, jeepneyLocation, destination]);

  // Cleanup arrival tracking on unmount
  useEffect(() => {
    return () => {
      if (selectedJeepney) {
        arrivalService.stopTracking(selectedJeepney);
      }
    };
  }, [selectedJeepney]);

  // Calculate route path following roads
  useEffect(() => {
    const loadRoutePath = async () => {
      try {
        const stops: RoutePoint[] = routeStops.map(stop => ({
          latitude: stop.latitude,
          longitude: stop.longitude,
        }));
        
        // Try to get road-following route, fallback to straight lines if API not available
        const path = await calculateFullRoutePath(stops, {
          useApi: !!process.env.EXPO_PUBLIC_ORS_API_KEY || !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
          apiKey: process.env.EXPO_PUBLIC_ORS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
          provider: process.env.EXPO_PUBLIC_ORS_API_KEY ? 'openrouteservice' : 'google',
        });
        
        setRoutePathCoordinates(path);
      } catch (error) {
        console.error('Error loading route path:', error);
        // Fallback to straight lines
        setRoutePathCoordinates(routeStops.map(stop => ({
          latitude: stop.latitude,
          longitude: stop.longitude,
        })));
      }
    };

    loadRoutePath();
  }, []);

  if (!location) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Location not available</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate region that includes user location, all route stops, and all jeepneys
  const allCoordinates: { latitude: number; longitude: number }[] = [];
  
  // Add user location
  allCoordinates.push({ 
    latitude: location.coords.latitude, 
    longitude: location.coords.longitude 
  });
  
  // Add all route stops
  routeStops.forEach(stop => {
    allCoordinates.push({ latitude: stop.latitude, longitude: stop.longitude });
  });
  
  // Add all jeepneys
  onlineJeepneys.forEach(jeepney => {
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

  // Use calculated route coordinates if available, otherwise use straight-line
  const displayRouteCoordinates = routeCoordinates.length > 0
    ? routeCoordinates
    : destination && selectedJeepneyData
    ? [
        {
          latitude: selectedJeepneyData.latitude,
          longitude: selectedJeepneyData.longitude,
        },
        destination,
      ]
    : [];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        followsUserLocation={false}
        showsMyLocationButton={true}
      >
        {/* Official Route Line - Follows actual roads */}
        {routePathCoordinates.length >= 2 && (
          <Polyline
            coordinates={routePathCoordinates}
            strokeColor={colors.route}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
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

        {/* User Location Marker */}
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title="Your Location"
          pinColor="#2196F3"
        />

        {/* Online Jeepney Markers */}
        {onlineJeepneys.map((jeepney) => (
          <Marker
            key={jeepney.id}
            coordinate={{
              latitude: jeepney.latitude,
              longitude: jeepney.longitude,
            }}
            title={`Jeepney ${jeepney.id}`}
            description={`Route: ${jeepney.route || 'Anonas-Lagro'}`}
            pinColor={selectedJeepney === jeepney.id ? colors.accent : '#4CAF50'}
            onPress={() => {
              setSelectedJeepney(jeepney.id);
            }}
          />
        ))}

        {/* Route Polyline */}
        {displayRouteCoordinates.length >= 2 && (
          <Polyline
            coordinates={displayRouteCoordinates}
            strokeColor="#2196F3"
            strokeWidth={4}
            lineDashPattern={displayRouteCoordinates.length === 2 ? [5, 5] : undefined}
          />
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker
            coordinate={destination}
            title="Destination"
            pinColor={colors.pinStrong}
          />
        )}
      </MapView>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      {/* Info Badges */}
      {routeInfo && (
        <View style={styles.badgesContainer}>
          <DistanceBadge distance={routeInfo.distance} />
          <ETABadge eta={routeInfo.eta} />
        </View>
      )}

      {/* Route Coverage Button */}
      {selectedJeepneyData && (
        <TouchableOpacity
          style={styles.routeCoverageButton}
          onPress={() => setShowRouteCoverage(true)}
        >
          <Text style={styles.routeCoverageButtonText}>View Route Coverage</Text>
        </TouchableOpacity>
      )}

      {/* Route Suggestions Button */}
      {destination && (
        <TouchableOpacity
          style={styles.routeSuggestionsButton}
          onPress={() => setShowRouteSuggestions(true)}
        >
          <Text style={styles.routeSuggestionsButtonText}>View Route Suggestions</Text>
        </TouchableOpacity>
      )}

      {/* Route Coverage Modal */}
      <RouteCoverageDisplay
        routeName={selectedJeepneyData?.route || 'Anonas-Lagro'}
        routeLocations={routeLocations}
        visible={showRouteCoverage}
        onClose={() => setShowRouteCoverage(false)}
      />

      {/* Route Suggestions Modal */}
      {showRouteSuggestions && destination && location && (
        <RouteSuggestions
          destination={destination}
          userLocation={location}
          visible={showRouteSuggestions}
          onClose={() => setShowRouteSuggestions(false)}
          onSelectJeepney={(jeepney) => {
            setSelectedJeepney(jeepney.id);
            setShowRouteSuggestions(false);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  badgesContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
});

export default MapScreen;

