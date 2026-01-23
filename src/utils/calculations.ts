import { RouteInfo } from '../types';
import * as Location from 'expo-location';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Estimate ETA based on distance
 * Uses average speed of 35 km/h for jeepneys (30-40 km/h range)
 * Can optionally use actual GPS speed if available for more accuracy
 * 
 * @param distanceKm - Distance in kilometers
 * @param actualSpeedMs - Optional: Actual speed from GPS in meters/second (if available)
 * @returns ETA in minutes
 */
export function estimateETA(distanceKm: number, actualSpeedMs?: number | null): number {
  let averageSpeedKmh: number;
  
  // Use actual GPS speed if available and reasonable (between 10-60 km/h for jeepneys)
  if (actualSpeedMs !== null && actualSpeedMs !== undefined) {
    const speedKmh = actualSpeedMs * 3.6; // Convert m/s to km/h
    // Validate speed is reasonable for jeepney (10-60 km/h)
    if (speedKmh >= 10 && speedKmh <= 60) {
      averageSpeedKmh = speedKmh;
    } else {
      // If speed is unreasonable, fall back to default
      averageSpeedKmh = 35;
    }
  } else {
    // Default: Jeepney average speed 30-40 km/h, using 35 km/h as middle
    averageSpeedKmh = 35;
  }
  
  // Calculate time in hours, then convert to minutes
  const timeInHours = distanceKm / averageSpeedKmh;
  const timeInMinutes = timeInHours * 60;
  
  // Round to nearest minute, but ensure minimum 1 minute for any distance > 0
  if (distanceKm > 0 && timeInMinutes < 1) {
    return 1;
  }
  
  return Math.round(timeInMinutes); // Round to nearest minute for better accuracy
}

/**
 * Calculate route info (distance and ETA) between user and jeepney
 * Uses real-time GPS speed if available for more accurate ETA
 * 
 * @param userLocation - User's current location
 * @param jeepneyLat - Jeepney's latitude
 * @param jeepneyLon - Jeepney's longitude
 * @param jeepneySpeedMs - Optional: Jeepney's actual speed in m/s from GPS (if available)
 * @returns RouteInfo with distance (km) and ETA (minutes)
 */
export function calculateRouteInfo(
  userLocation: Location.LocationObject,
  jeepneyLat: number,
  jeepneyLon: number,
  jeepneySpeedMs?: number | null
): RouteInfo {
  const distance = calculateDistance(
    userLocation.coords.latitude,
    userLocation.coords.longitude,
    jeepneyLat,
    jeepneyLon
  );
  
  // Use actual jeepney speed if available, otherwise use default
  const eta = estimateETA(distance, jeepneySpeedMs);
  
  return { distance, eta };
}

