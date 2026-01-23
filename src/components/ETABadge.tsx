import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ETABadgeProps {
  eta: number; // in minutes
}

const ETABadge: React.FC<ETABadgeProps> = ({ eta }) => {
  const formatETA = (minutes: number): string => {
    // Handle very small ETAs (< 1 minute)
    if (minutes < 1) {
      return '< 1 min';
    }
    
    // Round to nearest minute for display
    const roundedMinutes = Math.round(minutes);
    
    if (roundedMinutes < 60) {
      return `${roundedMinutes} min`;
    }
    
    const hours = Math.floor(roundedMinutes / 60);
    const mins = roundedMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ETA</Text>
      <Text style={styles.value}>{formatETA(eta)}</Text>
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

export default ETABadge;

