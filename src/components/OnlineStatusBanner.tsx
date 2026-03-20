import { colors } from '../theme/colors';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useJeepneyLocation } from '../contexts/JeepneyLocationContext';
import { filterOnlineJeepneys } from '../utils/filterOnlineJeepneys';

interface OnlineStatusBannerProps {
  isLoading?: boolean;
}

const OnlineStatusBanner: React.FC<OnlineStatusBannerProps> = ({ isLoading = false }) => {
  const { jeepneys } = useJeepneyLocation(); // Get real-time jeepney data
  const onlineJeepneys = filterOnlineJeepneys(jeepneys);
  const onlineCount = onlineJeepneys.length;
  const hasJeepneys = onlineCount > 0;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loading]}>
        <Text style={styles.text}>Loading jeepneys...</Text>
      </View>
    );
  }

  if (!hasJeepneys) {
    return (
      <View style={[styles.container, styles.empty]}>
        <Text style={styles.text}>No jeepneys available</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.available]}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🚌</Text>
      </View>
      <Text style={styles.text}>
        <Text style={styles.boldText}>{onlineCount}</Text> jeepney{onlineCount !== 1 ? 's' : ''} available nearby
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  available: {
    backgroundColor: '#4CAF50',
  },
  empty: {
    backgroundColor: colors.attention,
  },
  loading: {
    backgroundColor: '#2196F3',
  },
  iconContainer: {
    marginRight: 10,
  },
  icon: {
    fontSize: 20,
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  boldText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnlineStatusBanner;
