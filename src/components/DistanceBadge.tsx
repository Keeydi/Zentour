import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DistanceBadgeProps {
  distance: number; // in kilometers
}

const DistanceBadge: React.FC<DistanceBadgeProps> = ({ distance }) => {
  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Distance</Text>
      <Text style={styles.value}>{formatDistance(distance)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 100,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default DistanceBadge;

