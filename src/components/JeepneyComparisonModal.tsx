/**
 * JeepneyComparisonModal
 * Displays multiple jeepneys with their ETAs for comparison
 */

import { colors } from '../theme/colors';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { JeepneyETA } from '../hooks/useJeepneyETAs';
import DistanceBadge from './DistanceBadge';
import ETABadge from './ETABadge';

interface JeepneyComparisonModalProps {
  visible: boolean;
  jeepneyETAs: JeepneyETA[];
  onClose: () => void;
  onSelectJeepney?: (jeepneyId: string) => void;
}

const { width } = Dimensions.get('window');

const JeepneyComparisonModal: React.FC<JeepneyComparisonModalProps> = ({
  visible,
  jeepneyETAs,
  onClose,
  onSelectJeepney,
}) => {
  const renderJeepneyItem = ({ item, index }: { item: JeepneyETA; index: number }) => {
    const isBest = index === 0; // First item is best (sorted by ETA)

    return (
      <TouchableOpacity
        style={[styles.jeepneyItem, isBest && styles.bestJeepneyItem]}
        onPress={() => {
          if (onSelectJeepney) {
            onSelectJeepney(item.jeepneyId);
          }
          onClose();
        }}
        activeOpacity={0.7}
      >
        {isBest && (
          <View style={styles.bestBadge}>
            <Text style={styles.bestBadgeText}>⭐ Best</Text>
          </View>
        )}
        <View style={styles.jeepneyHeader}>
          <Text style={styles.jeepneyId}>Jeepney {item.jeepney.id}</Text>
          <Text style={styles.route}>{item.jeepney.route || 'Anonas-Lagro'}</Text>
        </View>
        <View style={styles.badgesContainer}>
          <ETABadge eta={item.eta} />
          <DistanceBadge distance={item.distance} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Compare Jeepneys</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            {jeepneyETAs.length} jeepney{jeepneyETAs.length !== 1 ? 's' : ''} available
          </Text>

          <FlatList
            data={jeepneyETAs}
            keyExtractor={(item) => item.jeepneyId}
            renderItem={renderJeepneyItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  jeepneyItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bestJeepneyItem: {
    backgroundColor: '#f0f9ff',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  bestBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.highlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  jeepneyHeader: {
    marginBottom: 12,
  },
  jeepneyId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  route: {
    fontSize: 14,
    color: '#666',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default JeepneyComparisonModal;

