import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { Jeepney, RouteInfo } from '../types';
import { calculateRouteInfo } from '../utils/calculations';
import { useJeepneyLocation } from '../contexts/JeepneyLocationContext';
import { useJeepneyCapacity } from '../hooks/useJeepneyCapacity';
import DistanceBadge from './DistanceBadge';
import ETABadge from './ETABadge';
import SeatAvailabilityBadge from './SeatAvailabilityBadge';

interface JeepneyInfoModalProps {
  visible: boolean;
  jeepney: Jeepney | null;
  userLocation: Location.LocationObject | null;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

const JeepneyInfoModal: React.FC<JeepneyInfoModalProps> = ({
  visible,
  jeepney,
  userLocation,
  onClose,
}) => {
  const { jeepneys, getJeepneyLocation } = useJeepneyLocation(); // Get real-time jeepney data
  const { capacity } = useJeepneyCapacity(jeepney?.id || null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // Get the latest jeepney data from context (for real-time updates)
  const latestJeepney = jeepney ? jeepneys.find(j => j.id === jeepney.id) || jeepney : null;
  
  // Get real-time jeepney location with speed data
  const jeepneyLocation = jeepney ? getJeepneyLocation(jeepney.id) : null;

  useEffect(() => {
    if (latestJeepney && userLocation) {
      // Use actual GPS speed from jeepney location if available
      const jeepneySpeedMs = jeepneyLocation?.coords.speed || null;
      
      const info = calculateRouteInfo(
        userLocation,
        latestJeepney.latitude,
        latestJeepney.longitude,
        jeepneySpeedMs
      );
      setRouteInfo(info);
    }
  }, [latestJeepney, userLocation, jeepneyLocation]);

  if (!latestJeepney || !userLocation || !routeInfo) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Jeepney {latestJeepney.id}</Text>
                <Text style={styles.route}>Route: {latestJeepney.route || 'Anonas-Lagro'}</Text>
              </View>

              <View style={styles.infoContainer}>
                <DistanceBadge distance={routeInfo.distance} />
                <ETABadge eta={routeInfo.eta} />
                {capacity && (
                  <SeatAvailabilityBadge
                    currentPassengers={capacity.current_passengers}
                    maxCapacity={capacity.max_capacity}
                  />
                )}
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  route: {
    fontSize: 14,
    color: '#666',
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 24,
    gap: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  closeButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default JeepneyInfoModal;


