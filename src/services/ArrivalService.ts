/**
 * ArrivalService
 * Tracks jeepney arrival at destinations
 * Monitors distance and sends notifications when jeepney arrives
 */

import * as Location from 'expo-location';
import { calculateDistance } from '../utils/calculations';
import Toast from 'react-native-toast-message';

export interface ArrivalDestination {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  arrivalRadius?: number; // in meters, default 50m
}

export interface ArrivalTracking {
  jeepneyId: string;
  destination: ArrivalDestination;
  isArrived: boolean;
  arrivalTime?: Date;
  estimatedArrivalTime?: Date;
  distanceToDestination: number; // in kilometers
}

class ArrivalService {
  private trackedArrivals: Map<string, ArrivalTracking> = new Map();
  private arrivalCheckInterval: NodeJS.Timeout | null = null;
  private checkIntervalMs: number = 5000; // Check every 5 seconds
  private arrivalCallbacks: Map<string, (tracking: ArrivalTracking) => void> = new Map();

  /**
   * Start tracking arrival for a jeepney at a destination
   */
  startTracking(
    jeepneyId: string,
    jeepneyLocation: Location.LocationObject,
    destination: ArrivalDestination
  ): void {
    const distance = calculateDistance(
      jeepneyLocation.coords.latitude,
      jeepneyLocation.coords.longitude,
      destination.latitude,
      destination.longitude
    );

    const tracking: ArrivalTracking = {
      jeepneyId,
      destination,
      isArrived: false,
      distanceToDestination: distance,
      estimatedArrivalTime: this.calculateEstimatedArrival(distance),
    };

    this.trackedArrivals.set(jeepneyId, tracking);

    // Start checking interval if not already running
    if (!this.arrivalCheckInterval) {
      this.startArrivalCheck();
    }
  }

  /**
   * Stop tracking arrival for a jeepney
   */
  stopTracking(jeepneyId: string): void {
    this.trackedArrivals.delete(jeepneyId);
    this.arrivalCallbacks.delete(jeepneyId);

    // Stop interval if no more trackings
    if (this.trackedArrivals.size === 0 && this.arrivalCheckInterval) {
      clearInterval(this.arrivalCheckInterval);
      this.arrivalCheckInterval = null;
    }
  }

  /**
   * Update jeepney location and check for arrival
   */
  updateJeepneyLocation(
    jeepneyId: string,
    location: Location.LocationObject
  ): void {
    const tracking = this.trackedArrivals.get(jeepneyId);
    if (!tracking || tracking.isArrived) {
      return;
    }

    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      tracking.destination.latitude,
      tracking.destination.longitude
    );

    tracking.distanceToDestination = distance;
    tracking.estimatedArrivalTime = this.calculateEstimatedArrival(distance);

    // Check if arrived (within arrival radius)
    const arrivalRadius = tracking.destination.arrivalRadius || 0.05; // 50 meters default
    if (distance <= arrivalRadius) {
      tracking.isArrived = true;
      tracking.arrivalTime = new Date();

      // Notify callback
      const callback = this.arrivalCallbacks.get(jeepneyId);
      if (callback) {
        callback(tracking);
      }

      // Show toast notification
      this.showArrivalNotification(jeepneyId, tracking);

      // Stop tracking after arrival
      this.stopTracking(jeepneyId);
    }
  }

  /**
   * Subscribe to arrival notifications
   */
  onArrival(
    jeepneyId: string,
    callback: (tracking: ArrivalTracking) => void
  ): () => void {
    this.arrivalCallbacks.set(jeepneyId, callback);

    // Return unsubscribe function
    return () => {
      this.arrivalCallbacks.delete(jeepneyId);
    };
  }

  /**
   * Get current tracking status
   */
  getTracking(jeepneyId: string): ArrivalTracking | null {
    return this.trackedArrivals.get(jeepneyId) || null;
  }

  /**
   * Get all active trackings
   */
  getAllTrackings(): ArrivalTracking[] {
    return Array.from(this.trackedArrivals.values());
  }

  /**
   * Calculate estimated arrival time based on distance
   */
  private calculateEstimatedArrival(distanceKm: number): Date {
    // Assume average speed of 35 km/h for jeepneys
    const averageSpeedKmh = 35;
    const timeInHours = distanceKm / averageSpeedKmh;
    const timeInMinutes = timeInHours * 60;

    const estimatedTime = new Date();
    estimatedTime.setMinutes(estimatedTime.getMinutes() + Math.round(timeInMinutes));

    return estimatedTime;
  }

  /**
   * Start interval to check for arrivals
   */
  private startArrivalCheck(): void {
    if (this.arrivalCheckInterval) {
      return; // Already running
    }

    this.arrivalCheckInterval = setInterval(() => {
      // Update estimated arrival times for all trackings
      this.trackedArrivals.forEach((tracking) => {
        if (!tracking.isArrived) {
          tracking.estimatedArrivalTime = this.calculateEstimatedArrival(
            tracking.distanceToDestination
          );
        }
      });
    }, this.checkIntervalMs);
  }

  /**
   * Show arrival notification
   */
  private showArrivalNotification(
    jeepneyId: string,
    tracking: ArrivalTracking
  ): void {
    const destinationName = tracking.destination.address || 'your destination';
    
    Toast.show({
      type: 'success',
      text1: 'Jeepney Arrived! 🎉',
      text2: `Jeepney ${jeepneyId} has arrived at ${destinationName}`,
      position: 'top',
      visibilityTime: 5000,
    });
  }

  /**
   * Cleanup - stop all tracking
   */
  cleanup(): void {
    if (this.arrivalCheckInterval) {
      clearInterval(this.arrivalCheckInterval);
      this.arrivalCheckInterval = null;
    }
    this.trackedArrivals.clear();
    this.arrivalCallbacks.clear();
  }
}

// Export singleton instance
export const arrivalService = new ArrivalService();

