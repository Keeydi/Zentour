import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Jeepney } from '../types';
import { calculateDistance } from '../utils/calculations';

/**
 * Hook to find the nearest jeepney to user location
 */
export function useNearestJeepney(
  jeepneys: Jeepney[],
  userLocation: Location.LocationObject | null
): Jeepney | null {
  const [nearestJeepney, setNearestJeepney] = useState<Jeepney | null>(null);

  useEffect(() => {
    if (!userLocation || !jeepneys || jeepneys.length === 0) {
      setNearestJeepney(null);
      return;
    }

    let nearest: Jeepney | null = null;
    let minDistance = Infinity;

    jeepneys.forEach((jeepney) => {
      const distance = calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        jeepney.latitude,
        jeepney.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = jeepney;
      }
    });

    setNearestJeepney(nearest);
  }, [jeepneys, userLocation]);

  return nearestJeepney;
}


