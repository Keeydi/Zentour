import { colors } from '../theme/colors';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { RootStackParamList } from '../../App';
import { useDriver } from '../contexts/DriverContext';
import { useAuth } from '../contexts/AuthContext';
import { useJeepneyLocation } from '../contexts/JeepneyLocationContext';
import { filterOnlineJeepneys } from '../utils/filterOnlineJeepneys';
import { routeStops } from '../data/mockData';
import { calculateDistance } from '../utils/calculations';
import { calculateFullRoutePath, RoutePoint } from '../services/RouteService';
import * as Location from 'expo-location';

type DriverDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DriverDashboard'>;

const { width, height } = Dimensions.get('window');

const DriverDashboard: React.FC = () => {
  const navigation = useNavigation<DriverDashboardNavigationProp>();
  const { driver, isOnline, driverLocation, goOnline, goOffline, logout, updatePassengerCount, isAuthenticated: isDriverAuthenticated } = useDriver();
  const { isAuthenticated: isPassengerAuthenticated } = useAuth();
  const { jeepneys } = useJeepneyLocation();
  const [isToggling, setIsToggling] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [passengerCount, setPassengerCount] = useState(driver?.currentPassengers || 0);
  const [isUpdatingCount, setIsUpdatingCount] = useState(false);
  const [routePathCoordinates, setRoutePathCoordinates] = useState<RoutePoint[]>([]);

  // Get online jeepneys (excluding the current driver's jeepney)
  const onlineJeepneys = filterOnlineJeepneys(jeepneys).filter(
    j => j.id !== driver?.jeepneyId
  );

  // Find nearest stop and calculate distance/ETA
  const nearestStopInfo = React.useMemo<{
    stop: { id: string; latitude: number; longitude: number; name?: string; route?: string };
    distance: number;
    eta: number;
  } | null>(() => {
    if (!driverLocation || routeStops.length === 0) {
      return null;
    }

    let nearestStop: { id: string; latitude: number; longitude: number; name?: string; route?: string } | null = null;
    let minDistance = Infinity;

    routeStops.forEach((stop) => {
      const distance = calculateDistance(
        driverLocation.coords.latitude,
        driverLocation.coords.longitude,
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
  }, [driverLocation]);

  // Redirect passengers to HomeScreen - they shouldn't see driver screens
  useEffect(() => {
    if (isPassengerAuthenticated && !isDriverAuthenticated) {
      navigation.replace('Home');
    }
  }, [isPassengerAuthenticated, isDriverAuthenticated, navigation]);

  // Update passenger count when driver changes
  useEffect(() => {
    if (driver?.currentPassengers !== undefined) {
      setPassengerCount(driver.currentPassengers);
    }
  }, [driver?.currentPassengers]);

  // Calculate route path following roads
  useEffect(() => {
    const loadRoutePath = async () => {
      try {
        const stops: RoutePoint[] = routeStops.map(stop => ({
          latitude: stop.latitude,
          longitude: stop.longitude,
        }));
        
        console.log('Loading route path for', stops.length, 'stops');
        
        // Check if API key is available
        const orsKey = process.env.EXPO_PUBLIC_ORS_API_KEY;
        const googleKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        const hasApiKey = !!(orsKey || googleKey);
        
        console.log('API Key available:', hasApiKey, 'ORS:', !!orsKey, 'Google:', !!googleKey);
        
        // Try to get road-following route, fallback to straight lines if API not available
        const path = await calculateFullRoutePath(stops, {
          useApi: hasApiKey,
          apiKey: orsKey || googleKey,
          provider: orsKey ? 'openrouteservice' : 'google',
        });
        
        console.log('Route path calculated:', path.length, 'coordinates');
        
        if (path && path.length > 0) {
          setRoutePathCoordinates(path);
          console.log('Route path set successfully');
        } else {
          // Fallback: use straight lines between stops
          console.log('Path empty, using straight lines fallback');
          const fallbackPath = routeStops.map(stop => ({
            latitude: stop.latitude,
            longitude: stop.longitude,
          }));
          setRoutePathCoordinates(fallbackPath);
        }
      } catch (error) {
        console.error('Error loading route path:', error);
        // Fallback to straight lines
        const fallbackPath = routeStops.map(stop => ({
          latitude: stop.latitude,
          longitude: stop.longitude,
        }));
        console.log('Using fallback path with', fallbackPath.length, 'coordinates');
        setRoutePathCoordinates(fallbackPath);
      }
    };

    loadRoutePath();
  }, []);

  const handleUpdatePassengerCount = async (newCount: number) => {
    if (newCount < 0 || newCount > (driver?.maxCapacity || 20)) {
      return;
    }
    
    setIsUpdatingCount(true);
    const success = await updatePassengerCount(newCount);
    setIsUpdatingCount(false);
    
    if (success) {
      setPassengerCount(newCount);
      setShowPassengerModal(false);
    } else {
      Alert.alert('Error', 'Failed to update passenger count. Please try again.');
    }
  };

  const maxCapacity = driver?.maxCapacity || 20;
  const availableSeats = maxCapacity - passengerCount;


  const handleToggleOnline = async () => {
    if (isOnline) {
      // Going offline
      Alert.alert(
        'Go Offline?',
        'Are you sure you want to go offline? You will stop sharing your location.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go Offline',
            style: 'destructive',
            onPress: () => {
              goOffline();
            },
          },
        ]
      );
    } else {
      // Going online
      setIsToggling(true);
      const success = await goOnline();
      setIsToggling(false);

      if (!success) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to go online.',
          [{ text: 'OK' }]
        );
      }
    }
    setShowMenu(false);
  };

  const handleLogout = () => {
    setShowMenu(false);
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.replace('Landing');
          },
        },
      ]
    );
  };

  const handleProfile = () => {
    setShowMenu(false);
    // TODO: Navigate to profile screen
    Alert.alert('Profile', 'Profile screen coming soon');
  };

  const handleSettings = () => {
    setShowMenu(false);
    // TODO: Navigate to settings screen
    Alert.alert('Settings', 'Settings screen coming soon');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };


  return (
    <View style={styles.container}>
      {/* Top Bar with Avatar and Toggle */}
      <View style={styles.topBar}>
        <View style={styles.driverInfo}>
          <View style={styles.driverNameContainer}>
            <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
            {driver?.jeepneyId && (
              <View style={styles.jeepneyIdContainer}>
                <Text style={styles.jeepneyIdBadge}>{driver.jeepneyId}</Text>
              </View>
            )}
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, isOnline && styles.statusIndicatorOnline]}>
              <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
              <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.topRightButtons}>
          {/* Toggle Button */}
          <TouchableOpacity
            style={[
              styles.toggleButton,
              isOnline && styles.toggleButtonOnline,
              isToggling && styles.toggleButtonDisabled,
            ]}
            onPress={handleToggleOnline}
            disabled={isToggling}
          >
            {isToggling ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.toggleButtonText}>
                {isOnline ? 'ON' : 'OFF'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Avatar Menu Button */}
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => setShowMenu(!showMenu)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {driver?.name ? getInitials(driver.name) : 'D'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Map View */}
      <View style={styles.mapContainer}>
        {driverLocation ? (
          <MapView
            style={styles.map}
            initialRegion={(() => {
              // Calculate region to include driver location, all route stops, and all jeepneys
              const allCoordinates: { latitude: number; longitude: number }[] = [];
              
              // Add driver location
              allCoordinates.push({ 
                latitude: driverLocation.coords.latitude, 
                longitude: driverLocation.coords.longitude 
              });
              
              // Add all route stops
              routeStops.forEach(stop => {
                allCoordinates.push({ latitude: stop.latitude, longitude: stop.longitude });
              });
              
              // Add all other jeepneys
              onlineJeepneys.forEach(jeepney => {
                allCoordinates.push({ latitude: jeepney.latitude, longitude: jeepney.longitude });
              });

              if (allCoordinates.length === 0) {
                return {
                  latitude: 14.6500,
                  longitude: 121.0500,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                };
              }

              // Calculate bounding box
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

              return {
                latitude: centerLat,
                longitude: centerLon,
                latitudeDelta: latDelta,
                longitudeDelta: lonDelta,
              };
            })()}
            showsUserLocation={true}
            followsUserLocation={false}
            showsMyLocationButton={true}
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

            {/* Driver's Own Location Marker (Highlighted) */}
            <Marker
              coordinate={{
                latitude: driverLocation.coords.latitude,
                longitude: driverLocation.coords.longitude,
              }}
              title="Your Location"
              description={driver?.jeepneyId ? `Jeepney ${driver.jeepneyId}` : 'Driver Location'}
              pinColor={isOnline ? '#1E88E5' : colors.attention}
            />

            {/* Other Jeepneys Markers */}
            {onlineJeepneys.map((jeepney) => (
              <Marker
                key={jeepney.id}
                coordinate={{
                  latitude: jeepney.latitude,
                  longitude: jeepney.longitude,
                }}
                title={`Jeepney ${jeepney.id}`}
                description={`Route: ${jeepney.route || 'Anonas-Lagro'} • ${jeepney.vehicleType || 'Jeepney'}`}
                pinColor="#4CAF50" // Green for other jeepneys
              />
            ))}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color="#1E88E5" />
            <Text style={styles.mapPlaceholderText}>
              {isOnline ? 'Getting your location...' : 'Go online to see your location'}
            </Text>
          </View>
        )}

        {/* Map Legend */}
        {driverLocation && (
          <View style={styles.mapLegend}>
            <Text style={styles.legendTitle}>Map Legend</Text>
            <View style={styles.legendItemsContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: isOnline ? '#1E88E5' : colors.attention }]} />
                <Text style={styles.legendText}>You</Text>
              </View>
              {onlineJeepneys.length > 0 && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.legendText}>Jeepneys ({onlineJeepneys.length})</Text>
                </View>
              )}
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#9E9E9E' }]} />
                <Text style={styles.legendText}>Stops ({routeStops.length})</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Nearest Stop Info */}
      {nearestStopInfo && driverLocation && (
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

      {/* Driver Info Cards - Only show when online */}
      {isOnline && driver && (
        <View style={styles.infoCardsContainer}>
          {/* Vehicle Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>Vehicle</Text>
            <Text style={styles.infoCardValue}>{driver.vehicleType || 'Jeepney'}</Text>
            {driver.plateNumber && (
              <Text style={styles.infoCardSubtext}>{driver.plateNumber}</Text>
            )}
          </View>

          {/* Passenger Count Card */}
          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => setShowPassengerModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.infoCardLabel}>Passengers</Text>
            <Text style={styles.infoCardValue}>
              {passengerCount}/{maxCapacity}
            </Text>
            <Text style={[
              styles.infoCardSubtext,
              availableSeats === 0 && styles.infoCardSubtextFull
            ]}>
              {availableSeats === 0 ? 'Full' : `${availableSeats} available`}
            </Text>
          </TouchableOpacity>

          {/* Nearby Jeepneys Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>Nearby</Text>
            <Text style={styles.infoCardValue}>{onlineJeepneys.length}</Text>
            <Text style={styles.infoCardSubtext}>
              {onlineJeepneys.length === 1 ? 'jeepney' : 'jeepneys'} online
            </Text>
          </View>
        </View>
      )}

      {/* Passenger Count Modal */}
      <Modal
        visible={showPassengerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPassengerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Passenger Count</Text>
            
            <View style={styles.passengerInputContainer}>
              <Text style={styles.inputLabel}>Current Passengers</Text>
              
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={[styles.counterButton, passengerCount === 0 && styles.counterButtonDisabled]}
                  onPress={() => handleUpdatePassengerCount(Math.max(0, passengerCount - 1))}
                  disabled={passengerCount === 0 || isUpdatingCount}
                >
                  <Text style={styles.counterButtonText}>−</Text>
                </TouchableOpacity>
                
                <Text style={styles.counterValue}>{passengerCount}</Text>
                
                <TouchableOpacity
                  style={[styles.counterButton, passengerCount >= maxCapacity && styles.counterButtonDisabled]}
                  onPress={() => handleUpdatePassengerCount(Math.min(maxCapacity, passengerCount + 1))}
                  disabled={passengerCount >= maxCapacity || isUpdatingCount}
                >
                  <Text style={styles.counterButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.capacityText}>
                Maximum Capacity: {maxCapacity} passengers
              </Text>
              <Text style={styles.availableSeatsText}>
                {availableSeats} seat{availableSeats !== 1 ? 's' : ''} available
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPassengerModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => handleUpdatePassengerCount(passengerCount)}
                disabled={isUpdatingCount}
              >
                {isUpdatingCount ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Avatar Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <View style={styles.menuAvatar}>
                <Text style={styles.menuAvatarText}>
                  {driver?.name ? getInitials(driver.name) : 'D'}
                </Text>
              </View>
              <Text style={styles.menuName}>{driver?.name || 'Driver'}</Text>
              <View style={styles.menuStatusRow}>
                <View style={[styles.menuStatusDot, isOnline && styles.menuStatusDotOnline]} />
                <Text style={styles.menuStatusText}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleProfile}
            >
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSettings}
            >
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={handleLogout}
            >
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 18,
    backgroundColor: '#1E88E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  driverInfo: {
    flex: 1,
  },
  driverNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  driverName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  jeepneyIdContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  jeepneyIdBadge: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  statusIndicatorOnline: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    opacity: 0.7,
  },
  statusDotOnline: {
    backgroundColor: '#4CAF50',
    opacity: 1,
  },
  statusText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  topRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  toggleButtonOnline: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  toggleButtonDisabled: {
    opacity: 0.6,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  mapPlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 20,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  menuHeader: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2FD',
    backgroundColor: '#F8F9FA',
  },
  menuAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: '#E3F2FD',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  menuAvatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  menuName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 10,
  },
  menuStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  menuStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9E9E9E',
    marginRight: 6,
  },
  menuStatusDotOnline: {
    backgroundColor: '#4CAF50',
  },
  menuStatusText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  menuItem: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuItemDanger: {
    borderBottomWidth: 0,
    backgroundColor: '#FFF5F5',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  menuItemTextDanger: {
    color: '#F44336',
    fontWeight: '700',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E3F2FD',
    marginVertical: 4,
  },
  seatControlContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  seatControlButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  seatControlText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  seatControlSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  infoCardsContainer: {
    position: 'absolute',
    top: 140,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    zIndex: 1,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  infoCardLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 4,
  },
  infoCardSubtext: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  infoCardSubtextFull: {
    color: '#F44336',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  passengerInputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  counterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  counterButtonDisabled: {
    backgroundColor: '#E0E0E0',
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  counterButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  counterValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginHorizontal: 40,
    minWidth: 80,
    textAlign: 'center',
  },
  capacityText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  availableSeatsText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '700',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#1E88E5',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mapLegend: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#E3F2FD',
    minWidth: 180,
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  legendItemsContainer: {
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  legendText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
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

export default DriverDashboard;
