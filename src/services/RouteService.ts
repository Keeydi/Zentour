/**
 * RouteService
 * Handles route calculation using routing APIs (Google Maps, Mapbox, etc.)
 * Falls back to straight-line distance if API is not available
 */

import * as Location from 'expo-location';
import { calculateDistance } from '../utils/calculations';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  coordinates: RoutePoint[];
  distance: number; // in kilometers
  duration: number; // in minutes
  polyline?: string; // Encoded polyline string (if using Google Maps)
}

/**
 * Calculate route between two points
 * Uses Google Maps Directions API if available, otherwise falls back to straight-line
 */
export async function calculateRoute(
  origin: RoutePoint,
  destination: RoutePoint,
  options?: {
    useApi?: boolean;
    apiKey?: string;
    provider?: 'google' | 'mapbox';
  }
): Promise<RouteResult> {
  const useApi = options?.useApi ?? false;
  const apiKey = options?.apiKey || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const provider = options?.provider || 'google';

  // If API key is available and useApi is true, use routing API
  if (useApi && apiKey) {
    try {
      if (provider === 'google') {
        return await calculateRouteGoogle(origin, destination, apiKey);
      } else if (provider === 'mapbox') {
        return await calculateRouteMapbox(origin, destination, apiKey);
      }
    } catch (error) {
      console.error('Route API error, falling back to straight-line:', error);
      // Fall through to straight-line calculation
    }
  }

  // Fallback: Use straight-line distance
  return calculateRouteStraightLine(origin, destination);
}

/**
 * Calculate route using Google Maps Directions API
 */
async function calculateRouteGoogle(
  origin: RoutePoint,
  destination: RoutePoint,
  apiKey: string
): Promise<RouteResult> {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${apiKey}&mode=driving`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
    throw new Error(`Google Maps API error: ${data.status}`);
  }

  const route = data.routes[0];
  const leg = route.legs[0];

  // Decode polyline to get coordinates
  let coordinates: RoutePoint[] = [];
  if (route.overview_polyline?.points) {
    // Decode the polyline string to get all coordinates
    coordinates = decodePolyline(route.overview_polyline.points);
    // If decoding failed or returned empty, use start and end points
    if (coordinates.length === 0) {
      coordinates = [origin, destination];
    }
  } else {
    // Fallback: use start and end
    coordinates = [origin, destination];
  }

  return {
    coordinates,
    distance: leg.distance.value / 1000, // Convert meters to kilometers
    duration: Math.round(leg.duration.value / 60), // Convert seconds to minutes
    polyline: route.overview_polyline?.points,
  };
}

/**
 * Calculate route using Mapbox Directions API
 */
async function calculateRouteMapbox(
  origin: RoutePoint,
  destination: RoutePoint,
  accessToken: string
): Promise<RouteResult> {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?access_token=${accessToken}&geometries=geojson`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error(`Mapbox API error: ${data.code}`);
  }

  const route = data.routes[0];
  const coordinates: RoutePoint[] = route.geometry.coordinates.map((coord: number[]) => ({
    longitude: coord[0],
    latitude: coord[1],
  }));

  return {
    coordinates,
    distance: route.distance / 1000, // Convert meters to kilometers
    duration: Math.round(route.duration / 60), // Convert seconds to minutes
  };
}

/**
 * Calculate straight-line route (fallback)
 */
function calculateRouteStraightLine(
  origin: RoutePoint,
  destination: RoutePoint
): RouteResult {
  const distance = calculateDistance(
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude
  );

  return {
    coordinates: [origin, destination],
    distance,
    duration: 0, // Will be calculated separately using ETA function
  };
}

/**
 * Decode Google Maps polyline string to coordinates
 * Implements the Google Polyline Algorithm
 */
export function decodePolyline(encoded: string): RoutePoint[] {
  if (!encoded) return [];
  
  const coordinates: RoutePoint[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = ((result & 1) !== 0) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = ((result & 1) !== 0) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    coordinates.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5,
    });
  }

  return coordinates;
}

/**
 * Calculate route using OpenRouteService (free alternative)
 */
async function calculateRouteOpenRouteService(
  origin: RoutePoint,
  destination: RoutePoint,
  apiKey?: string
): Promise<RouteResult> {
  // OpenRouteService free tier doesn't require API key for basic usage
  // But it's better to use one if available
  const url = `https://api.openrouteservice.org/v2/directions/driving-car/geojson`;
  
  const requestBody = {
    coordinates: [
      [origin.longitude, origin.latitude],
      [destination.longitude, destination.latitude]
    ],
  };

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add API key if available (optional for free tier)
  if (apiKey) {
    headers['Authorization'] = apiKey;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`OpenRouteService API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.features || data.features.length === 0) {
    throw new Error('OpenRouteService: No route found');
  }

  const feature = data.features[0];
  const geometry = feature.geometry;
  const properties = feature.properties;

  // Convert GeoJSON coordinates [lng, lat] to RoutePoint [lat, lng]
  const coordinates: RoutePoint[] = geometry.coordinates.map((coord: number[]) => ({
    latitude: coord[1],
    longitude: coord[0],
  }));

  return {
    coordinates,
    distance: (properties.summary?.distance || 0) / 1000, // Convert meters to kilometers
    duration: Math.round((properties.summary?.duration || 0) / 60), // Convert seconds to minutes
  };
}

/**
 * Calculate full route path following roads between multiple stops
 * Returns coordinates that follow actual roads
 */
export async function calculateFullRoutePath(
  stops: RoutePoint[],
  options?: {
    useApi?: boolean;
    apiKey?: string;
    provider?: 'google' | 'mapbox' | 'openrouteservice';
  }
): Promise<RoutePoint[]> {
  if (stops.length < 2) {
    return stops;
  }

  const useApi = options?.useApi ?? false;
  const apiKey = options?.apiKey || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_ORS_API_KEY;
  const provider = options?.provider || 'openrouteservice'; // Default to free OpenRouteService

  // If no API available, return straight lines (fallback)
  if (!useApi || !apiKey) {
    console.warn('No routing API available, using straight lines between stops');
    return stops;
  }

  const allCoordinates: RoutePoint[] = [];
  
  try {
    // Calculate route between each pair of consecutive stops
    for (let i = 0; i < stops.length - 1; i++) {
      const origin = stops[i];
      const destination = stops[i + 1];

      let routeResult: RouteResult;

      if (provider === 'openrouteservice') {
        routeResult = await calculateRouteOpenRouteService(origin, destination, apiKey);
      } else if (provider === 'google') {
        routeResult = await calculateRouteGoogle(origin, destination, apiKey);
        // Decode polyline if available
        if (routeResult.polyline) {
          const decoded = decodePolyline(routeResult.polyline);
          if (decoded.length > 0) {
            routeResult.coordinates = decoded;
          }
        }
      } else if (provider === 'mapbox') {
        routeResult = await calculateRouteMapbox(origin, destination, apiKey);
      } else {
        // Fallback to straight line
        routeResult = calculateRouteStraightLine(origin, destination);
      }

      // Add coordinates (avoid duplicating the last point of previous segment)
      if (i === 0) {
        // First segment: add all points
        allCoordinates.push(...routeResult.coordinates);
      } else {
        // Subsequent segments: skip first point (it's the same as last point of previous segment)
        allCoordinates.push(...routeResult.coordinates.slice(1));
      }

      // Add small delay to avoid rate limiting
      if (i < stops.length - 2) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return allCoordinates.length > 0 ? allCoordinates : stops;
  } catch (error) {
    console.error('Error calculating full route path:', error);
    // Fallback to straight lines
    return stops;
  }
}

