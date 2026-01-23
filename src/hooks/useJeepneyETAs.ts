/**
 * useJeepneyETAs
 * Hook to get ETAs for multiple jeepneys and sort/filter them
 */

import { useMemo } from 'react';
import * as Location from 'expo-location';
import { Jeepney } from '../types';
import { calculateRouteInfo } from '../utils/calculations';
import { useJeepneyLocation } from '../contexts/JeepneyLocationContext';

export interface JeepneyETA {
  jeepney: Jeepney;
  distance: number; // in kilometers
  eta: number; // in minutes
  jeepneyId: string;
}

export type ETASortOrder = 'eta' | 'distance' | 'none';

/**
 * Hook to get ETAs for all online jeepneys
 */
export function useJeepneyETAs(
  jeepneys: Jeepney[],
  userLocation: Location.LocationObject | null,
  sortOrder: ETASortOrder = 'eta'
): JeepneyETA[] {
  const { getJeepneyLocation } = useJeepneyLocation();

  const etas = useMemo(() => {
    if (!userLocation || !jeepneys || jeepneys.length === 0) {
      return [];
    }

    const jeepneyETAs: JeepneyETA[] = jeepneys.map((jeepney) => {
      const jeepneyLocation = getJeepneyLocation(jeepney.id);
      const jeepneySpeedMs = jeepneyLocation?.coords.speed || null;

      const routeInfo = calculateRouteInfo(
        userLocation,
        jeepney.latitude,
        jeepney.longitude,
        jeepneySpeedMs
      );

      return {
        jeepney,
        distance: routeInfo.distance,
        eta: routeInfo.eta,
        jeepneyId: jeepney.id,
      };
    });

    // Sort based on sortOrder
    switch (sortOrder) {
      case 'eta':
        return jeepneyETAs.sort((a, b) => a.eta - b.eta);
      case 'distance':
        return jeepneyETAs.sort((a, b) => a.distance - b.distance);
      case 'none':
      default:
        return jeepneyETAs;
    }
  }, [jeepneys, userLocation, sortOrder, getJeepneyLocation]);

  return etas;
}

/**
 * Hook to get the best jeepney (lowest ETA)
 */
export function useBestJeepney(
  jeepneys: Jeepney[],
  userLocation: Location.LocationObject | null
): JeepneyETA | null {
  const etas = useJeepneyETAs(jeepneys, userLocation, 'eta');
  return etas.length > 0 ? etas[0] : null;
}

