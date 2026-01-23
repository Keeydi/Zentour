import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { VehicleType } from '../types';

interface TransportModeFilterProps {
  selectedModes: VehicleType[];
  onModeToggle: (mode: VehicleType) => void;
}

const vehicleTypes: VehicleType[] = ['Jeepney', 'E-Jeep', 'Bus', 'UV Express', 'Tricycle'];

const TransportModeFilter: React.FC<TransportModeFilterProps> = ({
  selectedModes,
  onModeToggle,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Filter by Vehicle Type</Text>
      <View style={styles.filterContainer}>
        {vehicleTypes.map((type) => {
          const isSelected = selectedModes.includes(type);
          return (
            <TouchableOpacity
              key={type}
              style={[styles.filterButton, isSelected && styles.filterButtonActive]}
              onPress={() => onModeToggle(type)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E3F2FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 4,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: '#1E88E5',
    borderColor: '#1565C0',
    shadowColor: '#1E88E5',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  filterText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default TransportModeFilter;

