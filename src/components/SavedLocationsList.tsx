import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SavedLocation } from '../types';
import Toast from 'react-native-toast-message';

interface SavedLocationsListProps {
  userId: number;
  onSelectLocation: (location: SavedLocation) => void;
}

const SavedLocationsList: React.FC<SavedLocationsListProps> = ({
  userId,
  onSelectLocation,
}) => {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'custom' as 'home' | 'work' | 'school' | 'custom',
  });

  useEffect(() => {
    fetchLocations();
  }, [userId]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.3:3001';
      const response = await fetch(`${API_URL}/api/saved-locations?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLocations(data.locations || []);
        }
      }
    } catch (error) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async (latitude: number, longitude: number) => {
    if (!formData.name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Name Required',
        text2: 'Please enter a name for this location',
      });
      return;
    }

    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.3:3001';
      
      if (editingLocation) {
        // Update existing location
        const response = await fetch(`${API_URL}/api/saved-locations/${editingLocation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            name: formData.name,
            latitude,
            longitude,
            address: formData.address,
            type: formData.type,
          }),
        });

        if (response.ok) {
          Toast.show({
            type: 'success',
            text1: 'Location Updated',
            text2: 'Your saved location has been updated',
          });
          fetchLocations();
          setShowAddModal(false);
          setEditingLocation(null);
        }
      } else {
        // Create new location
        const response = await fetch(`${API_URL}/api/saved-locations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            name: formData.name,
            latitude,
            longitude,
            address: formData.address,
            type: formData.type,
          }),
        });

        if (response.ok) {
          Toast.show({
            type: 'success',
            text1: 'Location Saved',
            text2: 'Your location has been saved',
          });
          fetchLocations();
          setShowAddModal(false);
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save location',
      });
    }
  };

  const handleDelete = (location: SavedLocation) => {
    Alert.alert(
      'Delete Location',
      `Are you sure you want to delete "${location.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.3:3001';
              const response = await fetch(
                `${API_URL}/api/saved-locations/${location.id}?user_id=${userId}`,
                { method: 'DELETE' }
              );

              if (response.ok) {
                Toast.show({
                  type: 'success',
                  text1: 'Deleted',
                  text2: 'Location has been deleted',
                });
                fetchLocations();
              }
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete location',
              });
            }
          },
        },
      ]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'home': return '🏠';
      case 'work': return '💼';
      case 'school': return '🎓';
      default: return '📍';
    }
  };

  const renderItem = ({ item }: { item: SavedLocation }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => onSelectLocation(item)}
      onLongPress={() => {
        Alert.alert(
          'Location Options',
          item.name,
          [
            { text: 'Select', onPress: () => onSelectLocation(item) },
            { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item) },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }}
    >
      <Text style={styles.locationIcon}>{getTypeIcon(item.type)}</Text>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        {item.address && (
          <Text style={styles.locationAddress} numberOfLines={1}>
            {item.address}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Locations</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingLocation(null);
            setFormData({ name: '', address: '', type: 'custom' });
            setShowAddModal(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.emptyText}>Loading...</Text>
      ) : locations.length === 0 ? (
        <Text style={styles.emptyText}>No saved locations yet</Text>
      ) : (
        <FlatList
          data={locations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
        />
      )}

      {/* Add/Edit Modal - This would need to be integrated with map selection */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingLocation ? 'Edit Location' : 'Add Location'}
            </Text>
            <Text style={styles.modalNote}>
              Note: Select location from map first, then save it here.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Location name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Address (optional)"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  // This would need coordinates from map selection
                  Alert.alert('Info', 'Please select location from map first');
                }}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalNote: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SavedLocationsList;

