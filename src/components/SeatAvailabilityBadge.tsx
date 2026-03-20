import { colors } from '../theme/colors';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SeatAvailabilityBadgeProps {
  currentPassengers: number;
  maxCapacity: number;
}

const SeatAvailabilityBadge: React.FC<SeatAvailabilityBadgeProps> = ({
  currentPassengers,
  maxCapacity,
}) => {
  const availableSeats = maxCapacity - currentPassengers;
  const isFull = availableSeats <= 0;
  const isAlmostFull = availableSeats <= 3 && availableSeats > 0;

  const getStatusColor = () => {
    if (isFull) return '#f44336'; // Red
    if (isAlmostFull) return colors.accent;
    return '#4CAF50'; // Green
  };

  const getStatusText = () => {
    if (isFull) return 'Full';
    if (isAlmostFull) return 'Almost Full';
    return 'Available';
  };

  return (
    <View style={[styles.container, { backgroundColor: getStatusColor() }]}>
      <Text style={styles.statusText}>{getStatusText()}</Text>
      <Text style={styles.seatsText}>
        {availableSeats} / {maxCapacity} seats
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  seatsText: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.9,
  },
});

export default SeatAvailabilityBadge;

