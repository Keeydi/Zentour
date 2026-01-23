import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Jeepney } from '../types';
import { webSocketService } from '../services/WebSocketService';
import { mockOnlineJeepneys } from '../data/mockData';

interface JeepneyLocationContextType {
  jeepneys: Jeepney[];
  getJeepneyLocation: (jeepneyId: string) => Location.LocationObject | null;
  isJeepneyOnline: (jeepneyId: string) => boolean;
}

export const JeepneyLocationContext = createContext<JeepneyLocationContextType>({
  jeepneys: [],
  getJeepneyLocation: () => null,
  isJeepneyOnline: () => false,
});

export const useJeepneyLocation = () => useContext(JeepneyLocationContext);

interface JeepneyLocationProviderProps {
  children: React.ReactNode;
}

export const JeepneyLocationProvider: React.FC<JeepneyLocationProviderProps> = ({ children }) => {
  // Start with mock jeepneys for demonstration, plus real jeepneys from driver locations
  const [jeepneys, setJeepneys] = useState<Jeepney[]>(mockOnlineJeepneys);
  const [jeepneyLocations, setJeepneyLocations] = useState<Map<string, Location.LocationObject>>(new Map());
  const [jeepneyStatuses, setJeepneyStatuses] = useState<Map<string, 'online' | 'offline'>>(new Map());
  
  // Initialize mock jeepney statuses as online
  useEffect(() => {
    const initialStatuses = new Map<string, 'online' | 'offline'>();
    mockOnlineJeepneys.forEach(jeepney => {
      initialStatuses.set(jeepney.id, 'online');
    });
    setJeepneyStatuses(initialStatuses);
  }, []);

  useEffect(() => {
    // Try to connect to WebSocket server (non-blocking)
    // If it fails, the app will continue in local-only mode
    webSocketService.connect().then(() => {
      // Connect as passenger to receive updates
      webSocketService.connectAsPassenger();
    }).catch(() => {
      // Connection failed - app will work in local-only mode
      // This is expected if backend server is not running
    });

    // Subscribe to location updates - jeepneys are created dynamically when drivers broadcast
    const unsubscribeCallbacks: Map<string, () => void> = new Map();

    // Subscribe to status updates first
    const unsubscribeStatus = webSocketService.subscribeToStatus(
      (jeepneyId, status) => {
        setJeepneyStatuses((prev) => {
          const newMap = new Map(prev);
          newMap.set(jeepneyId, status);
          return newMap;
        });

        if (status === 'online') {
          // When jeepney goes online, subscribe to its location updates
          const unsubscribe = webSocketService.subscribeToLocation(
            jeepneyId,
            (id, location, vehicleType) => {
              setJeepneyLocations((prev) => {
                const newMap = new Map(prev);
                newMap.set(id, location);
                return newMap;
              });

              // Create or update jeepney with real GPS location
              setJeepneys((prev) => {
                const existing = prev.find((j) => j.id === id);
                if (existing) {
                  // Update existing jeepney with new location
                  return prev.map((j) =>
                    j.id === id
                      ? {
                          ...j,
                          latitude: location.coords.latitude,
                          longitude: location.coords.longitude,
                          status: 'online',
                          vehicleType: vehicleType || 'Jeepney',
                        }
                      : j
                  );
                } else {
                  // Create new jeepney from real GPS location
                  return [
                    ...prev,
                    {
                      id: id,
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                      status: 'online',
                      route: 'Anonas-Lagro', // Default route
                      vehicleType: vehicleType || 'Jeepney',
                    },
                  ];
                }
              });
            }
          );
          unsubscribeCallbacks.set(jeepneyId, unsubscribe);
        } else {
          // When jeepney goes offline, remove it (but keep mock jeepneys)
          setJeepneys((prev) => {
            // Don't remove mock jeepneys (those with DEMO- prefix)
            if (jeepneyId.startsWith('DEMO-')) {
              return prev.map(j => 
                j.id === jeepneyId ? { ...j, status: 'offline' as const } : j
              );
            }
            return prev.filter((j) => j.id !== jeepneyId);
          });
          setJeepneyLocations((prev) => {
            const newMap = new Map(prev);
            newMap.delete(jeepneyId);
            return newMap;
          });
          
          // Unsubscribe from location updates
          const unsubscribe = unsubscribeCallbacks.get(jeepneyId);
          if (unsubscribe) {
            unsubscribe();
            unsubscribeCallbacks.delete(jeepneyId);
          }
        }
      }
    );

    // Cleanup
    return () => {
      unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
      unsubscribeStatus();
      // Note: Don't disconnect WebSocket here as it might be used by other components
    };
  }, []);

  const getJeepneyLocation = (jeepneyId: string): Location.LocationObject | null => {
    return jeepneyLocations.get(jeepneyId) || null;
  };

  const isJeepneyOnline = (jeepneyId: string): boolean => {
    return jeepneyStatuses.get(jeepneyId) === 'online';
  };

  return (
    <JeepneyLocationContext.Provider
      value={{
        jeepneys,
        getJeepneyLocation,
        isJeepneyOnline,
      }}
    >
      {children}
    </JeepneyLocationContext.Provider>
  );
};

