import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type HeaderNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Header: React.FC = () => {
  const { location, error } = useLocation();
  const { user, logout } = useAuth();
  const navigation = useNavigation<HeaderNavigationProp>();

  const getLocationStatus = () => {
    if (error) return 'Location unavailable';
    if (location) return 'Location active';
    return 'Getting location...';
  };

  const handleLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Landing' }],
    });
  };

  return (
    <View style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>🚌 ZenRoute</Text>
            <View style={[styles.statusBadge, location && !error && styles.statusBadgeActive]}>
              <View style={[styles.statusDot, location && !error && styles.statusDotActive]} />
              <Text style={styles.status}>{getLocationStatus()}</Text>
            </View>
          </View>
        </View>
        {user && (
          <View style={styles.rightSection}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.7}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    backgroundColor: '#1E88E5',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 16,
  },
  leftSection: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    opacity: 0.7,
  },
  statusDotActive: {
    backgroundColor: '#4CAF50',
    opacity: 1,
  },
  status: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    opacity: 0.95,
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
});

export default Header;

