import { colors } from '../theme/colors';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { RouteLocation } from '../data/routeLocations';

interface RouteCoverageDisplayProps {
  routeName: string;
  routeLocations: RouteLocationWithDescription[];
  visible: boolean;
  onClose: () => void;
}

const RouteCoverageDisplay: React.FC<RouteCoverageDisplayProps> = ({
  routeName,
  routeLocations,
  visible,
  onClose,
}) => {
  const [selectedStop, setSelectedStop] = useState<RouteLocation | null>(null);

  if (!routeLocations || routeLocations.length === 0) {
    return null;
  }

  // Calculate map region to show all stops
  const latitudes = routeLocations.map((loc) => loc.latitude);
  const longitudes = routeLocations.map((loc) => loc.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const region = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: (maxLat - minLat) * 1.5 + 0.01,
    longitudeDelta: (maxLng - minLng) * 1.5 + 0.01,
  };

  // Create polyline coordinates
  const polylineCoordinates = routeLocations.map((loc) => ({
    latitude: loc.latitude,
    longitude: loc.longitude,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Route Coverage: {routeName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={region}
              showsUserLocation={false}
            >
              {/* Route Polyline */}
              <Polyline
                coordinates={polylineCoordinates}
                strokeColor="#2196F3"
                strokeWidth={4}
              />

              {/* Route Stops */}
              {routeLocations.map((stop, index) => (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: stop.latitude,
                    longitude: stop.longitude,
                  }}
                  title={stop.name}
                  description={stop.description || `Stop ${index + 1}`}
                  pinColor={selectedStop === stop ? colors.accent : '#4CAF50'}
                  onPress={() => setSelectedStop(stop)}
                />
              ))}
            </MapView>
          </View>

          <View style={styles.stopsListContainer}>
            <Text style={styles.stopsListTitle}>Route Stops ({routeLocations.length})</Text>
            <ScrollView style={styles.stopsList}>
              {routeLocations.map((stop, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.stopItem,
                    selectedStop === stop && styles.stopItemSelected,
                  ]}
                  onPress={() => setSelectedStop(stop)}
                >
                  <View style={styles.stopNumber}>
                    <Text style={styles.stopNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stopInfo}>
                    <Text style={styles.stopName}>{stop.name}</Text>
                    {stop.description && (
                      <Text style={styles.stopDescription}>{stop.description}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  mapContainer: {
    height: 300,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  stopsListContainer: {
    flex: 1,
    padding: 16,
  },
  stopsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  stopsList: {
    flex: 1,
  },
  stopItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  stopItemSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stopDescription: {
    fontSize: 12,
    color: '#666',
  },
});

export default RouteCoverageDisplay;

