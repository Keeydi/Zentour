import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Destination, Jeepney } from '../types';
import { calculateRouteInfo } from '../utils/calculations';
import { useJeepneyLocation } from '../contexts/JeepneyLocationContext';
import * as Location from 'expo-location';
import DistanceBadge from './DistanceBadge';
import ETABadge from './ETABadge';
import SeatAvailabilityBadge from './SeatAvailabilityBadge';
import { useJeepneyCapacity } from '../hooks/useJeepneyCapacity';

interface RouteSuggestion {
  jeepney: Jeepney;
  distance: number;
  eta: number;
  passesDestination: boolean;
  capacity?: {
    current_passengers: number;
    max_capacity: number;
    available_seats: number;
  };
}

interface RouteSuggestionsProps {
  destination: Destination;
  userLocation: Location.LocationObject | null;
  onSelectJeepney: (jeepney: Jeepney) => void;
}

const RouteSuggestions: React.FC<RouteSuggestionsProps> = ({
  destination,
  userLocation,
  onSelectJeepney,
  visible = true,
  onClose,
}) => {
  const { jeepneys, getJeepneyLocation } = useJeepneyLocation();
  const [suggestions, setSuggestions] = useState<RouteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!destination || !userLocation) {
      setSuggestions([]);
      return;
    }

    const calculateSuggestions = async () => {
      setLoading(true);
      const onlineJeepneys = jeepneys.filter((j) => j.status === 'online');

      const suggestionsList: RouteSuggestion[] = [];

      for (const jeepney of onlineJeepneys) {
        const jeepneyLocation = getJeepneyLocation(jeepney.id);
        if (!jeepneyLocation) continue;

        // Calculate distance from jeepney to destination
        const routeInfo = calculateRouteInfo(
          {
            coords: {
              latitude: jeepneyLocation.coords.latitude,
              longitude: jeepneyLocation.coords.longitude,
            },
            timestamp: Date.now(),
          } as Location.LocationObject,
          destination.latitude,
          destination.longitude,
          jeepneyLocation.coords.speed || null
        );

        // Simple check: if jeepney is moving towards destination (within reasonable distance)
        // In a real implementation, you'd check if the route actually passes the destination
        const passesDestination = routeInfo.distance < 5; // Within 5km is considered "on route"

        suggestionsList.push({
          jeepney,
          distance: routeInfo.distance,
          eta: routeInfo.eta,
          passesDestination,
        });
      }

      // Sort by ETA (fastest first)
      suggestionsList.sort((a, b) => a.eta - b.eta);

      setSuggestions(suggestionsList);
      setLoading(false);
    };

    calculateSuggestions();
  }, [destination, userLocation, jeepneys, getJeepneyLocation]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text style={styles.loadingText}>Finding routes...</Text>
      </View>
    );
  }

  if (suggestions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No routes found to this destination</Text>
      </View>
    );
  }

  const renderSuggestion = ({ item }: { item: RouteSuggestion }) => {
    const { capacity } = useJeepneyCapacity(item.jeepney.id);

    return (
      <TouchableOpacity
        style={[
          styles.suggestionItem,
          item.passesDestination && styles.suggestionItemRecommended,
        ]}
        onPress={() => onSelectJeepney(item.jeepney)}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionHeader}>
          <Text style={styles.jeepneyId}>Jeepney {item.jeepney.id}</Text>
          {item.passesDestination && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>Recommended</Text>
            </View>
          )}
        </View>

        <View style={styles.suggestionInfo}>
          <DistanceBadge distance={item.distance} />
          <ETABadge eta={item.eta} />
          {capacity && (
            <SeatAvailabilityBadge
              currentPassengers={capacity.current_passengers}
              maxCapacity={capacity.max_capacity}
            />
          )}
        </View>

        <View style={styles.suggestionFooter}>
          <Text style={styles.routeText}>
            Route: {item.jeepney.route || 'Anonas-Lagro'}
          </Text>
          {item.jeepney.vehicleType && (
            <Text style={styles.vehicleTypeText}>{item.jeepney.vehicleType}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose || (() => {})}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              Routes to {destination.address || 'Destination'} ({suggestions.length})
            </Text>
            <TouchableOpacity onPress={onClose || (() => {})} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.jeepney.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
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
    marginTop: 100,
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
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
  list: {
    flex: 1,
  },
  suggestionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionItemRecommended: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#F1F8E9',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jeepneyId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  recommendedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  suggestionInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  suggestionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  routeText: {
    fontSize: 14,
    color: '#666',
  },
  vehicleTypeText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default RouteSuggestions;

