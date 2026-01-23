import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { Driver, VehicleType } from '../types';
import { webSocketService } from '../services/WebSocketService';

interface LoginResult {
  success: boolean;
  error?: string;
}

interface DriverContextType {
  driver: Driver | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnline: boolean;
  driverLocation: Location.LocationObject | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (email: string, password: string, name: string, phone?: string, jeepneyId?: string) => Promise<LoginResult>;
  logout: () => void;
  goOnline: () => Promise<boolean>;
  goOffline: () => void;
  updatePassengerCount: (count: number) => Promise<boolean>;
}

export const DriverContext = createContext<DriverContextType>({
  driver: null,
  isAuthenticated: false,
  isLoading: true,
  isOnline: false,
  driverLocation: null,
  login: async () => ({ success: false, error: 'Not initialized' }),
  signup: async () => ({ success: false, error: 'Not initialized' }),
  logout: () => {},
  goOnline: async () => false,
  goOffline: () => {},
  updatePassengerCount: async () => false,
});

export const useDriver = () => useContext(DriverContext);

interface DriverProviderProps {
  children: React.ReactNode;
}

export const DriverProvider: React.FC<DriverProviderProps> = ({ children }) => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [driverLocation, setDriverLocation] = useState<Location.LocationObject | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const appState = useRef(AppState.currentState);
  const wasOnlineBeforeBackground = useRef(false);
  const locationUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const lastLocationUpdateTime = useRef<number>(0);

  useEffect(() => {
    // Try to connect to WebSocket server on mount (non-blocking)
    // If it fails, the app will continue in local-only mode
    webSocketService.connect().catch(() => {
      // Connection failed - app will work in local-only mode
      // This is expected if backend server is not running
    });

    // Check for stored driver auth on mount
    const checkAuth = async () => {
      try {
        // In production, check AsyncStorage for driver token
        // For now, always start fresh
        setDriver(null);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };
    checkAuth();

    // Cleanup on unmount
    return () => {
      // Auto-offline when component unmounts (app closing)
      if (isOnline) {
        goOffline();
      }
      
      // Clear location update interval
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current);
        locationUpdateInterval.current = null;
      }
      
      webSocketService.disconnect();
    };
  }, []);

  // Monitor app state for automatic offline detection
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        // Optionally reconnect if was online before
        if (wasOnlineBeforeBackground.current && driver) {
          // Reconnect WebSocket if needed
          webSocketService.connect().catch(() => {
            // Connection failed, stay offline
          });
        }
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App has gone to the background
        wasOnlineBeforeBackground.current = isOnline;
        
        // Automatically go offline when app goes to background
        if (isOnline && driver) {
          goOffline();
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isOnline, driver]);

  // Get location when driver is authenticated (for map display, even when offline)
  useEffect(() => {
    if (!driver) return;

    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        // Request foreground permissions first
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
          return;
        }

        // Request background permissions if driver is online (needed for background tracking)
        if (isOnline) {
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          if (backgroundStatus !== 'granted') {
            // Background permission not granted, but continue with foreground tracking
            // User can still use the app, but location won't update in background
          }
        }

        // Get initial location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setDriverLocation(currentLocation);
        
        // Watch location updates (for map display and broadcasting)
        // Use background location if online and permission granted
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: isOnline ? 5000 : 10000, // More frequent when online
            distanceInterval: isOnline ? 10 : 50, // More sensitive when online
            mayShowUserSettingsDialog: true, // Show settings if permission needed
          },
          (newLocation) => {
            setDriverLocation(newLocation);
            lastLocationUpdateTime.current = Date.now();
            
            // Always broadcast location after login (not just when online)
            // This ensures location is tracked continuously from login
            if (driver?.jeepneyId) {
              if (webSocketService.getConnected()) {
                webSocketService.sendLocationUpdate(driver.jeepneyId, newLocation);
              }
            }
          }
        );
        
        setLocationSubscription(subscription);
      } catch (error: any) {
        // Error getting driver location
        // Check if it's the Info.plist error (happens in Expo Go)
        if (error?.message?.includes('NSLocation') || error?.message?.includes('Info.plist')) {
          console.warn('Location permissions not configured. This is expected in Expo Go. Location features will be limited until a development build is created.');
        } else {
          console.error('Error setting up location tracking:', error);
        }
      }
    })();

    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (locationSubscription) {
        locationSubscription.remove();
        setLocationSubscription(null);
      }
    };
  }, [driver, isOnline]);

  // Periodic location update (every 2 minutes) to ensure continuous tracking
  useEffect(() => {
    if (!driver || !driver.jeepneyId) {
      // Clear interval if no driver
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current);
        locationUpdateInterval.current = null;
      }
      return;
    }

    // Set up periodic location update every 2 minutes (120000ms)
    locationUpdateInterval.current = setInterval(() => {
      if (driverLocation && driver.jeepneyId) {
        // Send location update even if no new GPS update
        // This ensures location is always being tracked
        if (webSocketService.getConnected()) {
          webSocketService.sendLocationUpdate(driver.jeepneyId, driverLocation);
        }
        
        // Also try to get fresh location
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })
          .then((freshLocation) => {
            setDriverLocation(freshLocation);
            lastLocationUpdateTime.current = Date.now();
            
            // Send fresh location
            if (driver.jeepneyId && webSocketService.getConnected()) {
              webSocketService.sendLocationUpdate(driver.jeepneyId, freshLocation);
            }
          })
          .catch((error: any) => {
            // If fresh location fails, still send the last known location
            // This ensures continuous tracking
            // Silently handle Info.plist errors (expected in Expo Go)
            if (!error?.message?.includes('NSLocation') && !error?.message?.includes('Info.plist')) {
              // Only log non-Info.plist errors
              console.warn('Failed to get fresh location:', error?.message || error);
            }
          });
      }
    }, 120000); // 2 minutes = 120000 milliseconds

    return () => {
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current);
        locationUpdateInterval.current = null;
      }
    };
  }, [driver, driverLocation]);

  // Update location tracking frequency when going online/offline
  useEffect(() => {
    if (isOnline && driver && driverLocation) {
      // When going online, register as driver and broadcast the current location immediately
      if (driver.jeepneyId) {
        if (webSocketService.getConnected()) {
          webSocketService.registerDriver(driver.jeepneyId);
          webSocketService.sendLocationUpdate(driver.jeepneyId, driverLocation);
          webSocketService.sendStatusUpdate(driver.jeepneyId, 'online');
        }
      }
    } else if (!isOnline && driver?.jeepneyId) {
      // When going offline, broadcast status change
      if (webSocketService.getConnected()) {
        webSocketService.sendStatusUpdate(driver.jeepneyId, 'offline');
      }
    }
  }, [isOnline, driver, driverLocation]);

  // startLocationTracking and stopLocationTracking are no longer needed
  // Location is now tracked continuously when driver is logged in

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      // Call backend API for driver login
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.3:3001';
      const response = await fetch(`${API_URL}/api/drivers/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.driver) {
          setDriver({
            id: data.driver.id.toString(),
            email: data.driver.email,
            name: data.driver.name,
            phone: data.driver.phone,
            jeepneyId: data.driver.jeepney_id || undefined,
            isOnline: data.driver.is_online || false,
            currentPassengers: data.driver.current_passengers || 0,
            maxCapacity: data.driver.max_capacity || 20,
            vehicleType: data.driver.vehicle_type as VehicleType | undefined,
            plateNumber: data.driver.plate_number || undefined,
            licenseNumber: data.driver.license_number || undefined,
            vehicleModel: data.driver.vehicle_model || undefined,
            vehicleColor: data.driver.vehicle_color || undefined,
          });
          return { success: true };
        }
      } else {
        // Handle different error status codes
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          return { success: false, error: 'Account does not exist or password is incorrect' };
        } else if (response.status === 400) {
          return { success: false, error: errorData.error || 'Invalid request' };
        } else if (response.status === 500) {
          return { success: false, error: 'Server error. Please try again later' };
        }
        return { success: false, error: errorData.error || 'Login failed' };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      // Network error or server not reachable
      return { success: false, error: 'Cannot connect to server. Please check your connection' };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    phone?: string,
    jeepneyId?: string,
    address?: string,
    plate_number?: string,
    license_number?: string,
    vehicle_type?: string,
    vehicle_model?: string,
    vehicle_color?: string
  ): Promise<LoginResult> => {
    try {
      // Call backend API for driver signup
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.3:3001';
      const response = await fetch(`${API_URL}/api/drivers/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: phone || '',
          address: address || '',
          plate_number: plate_number || '',
          license_number: license_number || '',
          jeepney_id: jeepneyId,
          vehicle_type: vehicle_type || 'Jeepney',
          vehicle_model: vehicle_model || '',
          vehicle_color: vehicle_color || '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.driver) {
          setDriver({
            id: data.driver.id.toString(),
            email: data.driver.email,
            name: data.driver.name,
            phone: data.driver.phone,
            jeepneyId: data.driver.jeepney_id || undefined,
            isOnline: false,
          });
          return { success: true };
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400) {
          return { success: false, error: errorData.error || 'Invalid request' };
        } else if (response.status === 500) {
          return { success: false, error: 'Server error. Please try again later' };
        }
        return { success: false, error: errorData.error || 'Signup failed' };
      }
      return { success: false, error: 'Signup failed' };
    } catch (error) {
      return { success: false, error: 'Cannot connect to server. Please check your connection' };
    }
  };

  const logout = () => {
    // Go offline before logging out
    if (isOnline) {
      goOffline();
    }
    // Clean up location subscription
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setDriverLocation(null);
    setDriver(null);
    setIsOnline(false);
    // In real app, clear AsyncStorage and tokens
  };

  const goOnline = async (): Promise<boolean> => {
    try {
      // Request foreground location permission if not already granted
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        return false;
      }

      // Request background location permission for background tracking
      try {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          // Background permission not granted, but allow online status
          // Location will only update when app is in foreground
        }
      } catch (error: any) {
        // Background permission request failed (may not be available on all platforms)
        // Check if it's the Info.plist error (happens in Expo Go)
        if (error?.message?.includes('NSLocation') || error?.message?.includes('Info.plist')) {
          // Silently handle - expected in Expo Go
        } else {
          // Continue with foreground-only tracking
          console.warn('Background location permission request failed:', error?.message || error);
        }
      }

      // Ensure WebSocket is connected
      if (!webSocketService.getConnected()) {
        try {
          await webSocketService.connect();
        } catch (error) {
          // Continue anyway - will try to use local service
        }
      }

      setIsOnline(true);
      if (driver) {
        setDriver({ ...driver, isOnline: true });
        
        // Register as driver and broadcast online status
        if (driver.jeepneyId) {
          if (webSocketService.getConnected()) {
            webSocketService.registerDriver(driver.jeepneyId);
            webSocketService.sendStatusUpdate(driver.jeepneyId, 'online');
            
            // Send current location immediately if available
            if (driverLocation) {
              webSocketService.sendLocationUpdate(driver.jeepneyId, driverLocation);
            }
          }
        }
      }
      
      // Location tracking will automatically adjust frequency when isOnline changes
      
      return true;
    } catch (error) {
      console.error('Error going online:', error);
      return false;
    }
  };

  const updatePassengerCount = async (count: number): Promise<boolean> => {
    if (!driver) return false;

    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.3:3001';
      const response = await fetch(`${API_URL}/api/drivers/${driver.id}/passenger-count`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_passengers: count,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.driver) {
          setDriver(prev => prev ? {
            ...prev,
            currentPassengers: data.driver.current_passengers,
            maxCapacity: data.driver.max_capacity,
          } : null);
        }
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const goOffline = () => {
    setIsOnline(false);
    if (driver) {
      setDriver({ ...driver, isOnline: false });
      
      // Broadcast offline status
      if (driver.jeepneyId) {
        if (webSocketService.getConnected()) {
          webSocketService.sendStatusUpdate(driver.jeepneyId, 'offline');
        }
      }
    }
    // Location tracking continues for map display, but broadcasting stops
  };

  return (
    <DriverContext.Provider
      value={{
        driver,
        isAuthenticated: !!driver,
        isLoading,
        isOnline,
        driverLocation,
        login,
        signup,
        logout,
        goOnline,
        goOffline,
        updatePassengerCount,
      }}
    >
      {children}
    </DriverContext.Provider>
  );
};

