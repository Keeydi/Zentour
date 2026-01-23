/**
 * WebSocketService
 * Real WebSocket client for connecting to backend server
 * Replaces the local LocationBroadcastService for production use
 */

import { Platform } from 'react-native';
import * as Location from 'expo-location';

type LocationUpdateCallback = (jeepneyId: string, location: Location.LocationObject, vehicleType?: string) => void;
type StatusUpdateCallback = (jeepneyId: string, status: 'online' | 'offline') => void;

interface QueuedMessage {
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private locationSubscribers: Map<string, LocationUpdateCallback[]> = new Map();
  private statusSubscribers: StatusUpdateCallback[] = [];
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000; // 3 seconds
  private serverUrl: string;
  private isConnecting: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  // Offline message queue
  private messageQueue: QueuedMessage[] = [];
  private maxQueueSize: number = 100; // Maximum messages to queue
  private maxRetries: number = 3; // Maximum retry attempts per message
  private queueFlushInterval: NodeJS.Timeout | null = null;

  constructor(serverUrl: string = 'ws://localhost:3001') {
    this.serverUrl = serverUrl;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting || this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;
        
        // Close existing connection if any
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }

        this.ws = new WebSocket(this.serverUrl);

        const connectionTimeout = setTimeout(() => {
          if (!this.isConnected) {
            this.isConnecting = false;
            if (this.ws) {
              this.ws.close();
              this.ws = null;
            }
            reject(new Error('Connection timeout'));
          }
        }, 10000); // 10 second timeout

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Flush queued messages when connected
          this.flushMessageQueue();
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            // Error parsing WebSocket message
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          // Don't reject immediately - let onclose handle it
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          
          if (this.isConnected) {
            this.isConnected = false;
            // Only attempt reconnect if we were previously connected
            if (event.code !== 1000) { // Not a normal closure
              this.attemptReconnect();
            }
          } else {
            // Initial connection failed
            reject(new Error(`Connection failed: ${event.code} - ${event.reason || 'Unknown error'}`));
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect to server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        // Reconnection failed, will try again if under max attempts
      });
    }, this.reconnectDelay);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any): void {
    switch (data.type) {
      case 'location_update':
        this.notifyLocationSubscribers(data.jeepneyId, data.location, data.vehicleType);
        break;

      case 'status_update':
        this.notifyStatusSubscribers(data.jeepneyId, data.status);
        break;

      case 'initial_data':
        // Send initial data to all subscribers
        if (data.jeepneys) {
          data.jeepneys.forEach((jeepney: any) => {
            if (jeepney.location) {
              this.notifyLocationSubscribers(jeepney.jeepneyId, jeepney.location, jeepney.vehicleType);
            }
            if (jeepney.status) {
              this.notifyStatusSubscribers(jeepney.jeepneyId, jeepney.status);
            }
          });
        }
        break;

      case 'registered':
        break;

      default:
        break;
    }
  }

  /**
   * Send message to server
   * Queues message if offline, sends immediately if online
   */
  private send(message: any): void {
    if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        // Error sending - queue the message for retry
        this.queueMessage(message);
      }
    } else {
      // Not connected - queue the message for later
      this.queueMessage(message);
    }
  }

  /**
   * Queue a message for later sending when connection is restored
   */
  private queueMessage(message: any): void {
    // Don't queue if queue is full (prevent memory issues)
    if (this.messageQueue.length >= this.maxQueueSize) {
      // Remove oldest message
      this.messageQueue.shift();
    }

    this.messageQueue.push({
      type: message.type || 'unknown',
      data: message,
      timestamp: Date.now(),
      retryCount: 0,
    });

    // Start queue flush interval if not already running
    if (!this.queueFlushInterval) {
      this.startQueueFlushInterval();
    }
  }

  /**
   * Flush queued messages when connection is restored
   */
  private flushMessageQueue(): void {
    if (!this.isConnected || this.messageQueue.length === 0) {
      return;
    }

    const messagesToSend = [...this.messageQueue];
    this.messageQueue = [];

    messagesToSend.forEach((queuedMessage) => {
      if (queuedMessage.retryCount < this.maxRetries) {
        try {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(queuedMessage.data));
            // Message sent successfully, don't re-queue
          } else {
            // Connection lost again, re-queue with incremented retry count
            queuedMessage.retryCount++;
            this.messageQueue.push(queuedMessage);
          }
        } catch (error) {
          // Send failed, re-queue with incremented retry count
          queuedMessage.retryCount++;
          if (queuedMessage.retryCount < this.maxRetries) {
            this.messageQueue.push(queuedMessage);
          }
          // If max retries reached, message is dropped
        }
      }
      // If max retries reached, message is silently dropped
    });

    // Stop flush interval if queue is empty
    if (this.messageQueue.length === 0 && this.queueFlushInterval) {
      clearInterval(this.queueFlushInterval);
      this.queueFlushInterval = null;
    }
  }

  /**
   * Start interval to periodically try flushing queued messages
   */
  private startQueueFlushInterval(): void {
    if (this.queueFlushInterval) {
      return; // Already running
    }

    this.queueFlushInterval = setInterval(() => {
      if (this.isConnected) {
        this.flushMessageQueue();
      }
    }, 5000); // Try every 5 seconds
  }

  /**
   * Register as driver
   */
  registerDriver(jeepneyId: string): void {
    if (this.isConnected) {
      this.send({
        type: 'driver_register',
        jeepneyId
      });
    }
  }

  /**
   * Send location update (from driver)
   */
  sendLocationUpdate(jeepneyId: string, location: Location.LocationObject): void {
    this.send({
      type: 'location_update',
      jeepneyId,
      location: {
        coords: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
          accuracy: location.coords.accuracy,
          altitudeAccuracy: location.coords.altitudeAccuracy,
          heading: location.coords.heading,
          speed: location.coords.speed
        },
        timestamp: location.timestamp
      }
    });
  }

  /**
   * Send status update (from driver)
   */
  sendStatusUpdate(jeepneyId: string, status: 'online' | 'offline'): void {
    this.send({
      type: 'status_update',
      jeepneyId,
      status
    });
  }

  /**
   * Connect as passenger
   */
  connectAsPassenger(): void {
    this.send({
      type: 'passenger_connect'
    });
  }

  /**
   * Subscribe to location updates for a specific jeepney
   */
  subscribeToLocation(jeepneyId: string, callback: LocationUpdateCallback): () => void {
    if (!this.locationSubscribers.has(jeepneyId)) {
      this.locationSubscribers.set(jeepneyId, []);
    }
    this.locationSubscribers.get(jeepneyId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.locationSubscribers.get(jeepneyId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Subscribe to status updates for all jeepneys
   */
  subscribeToStatus(callback: StatusUpdateCallback): () => void {
    this.statusSubscribers.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.statusSubscribers.indexOf(callback);
      if (index > -1) {
        this.statusSubscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify location subscribers
   */
  private notifyLocationSubscribers(jeepneyId: string, locationData: any, vehicleType?: string): void {
    // Convert location data back to LocationObject format
    const location: Location.LocationObject = {
      coords: {
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
        altitude: locationData.coords.altitude || null,
        accuracy: locationData.coords.accuracy || null,
        altitudeAccuracy: locationData.coords.altitudeAccuracy || null,
        heading: locationData.coords.heading || null,
        speed: locationData.coords.speed || null
      },
      timestamp: locationData.timestamp || Date.now()
    };

    const callbacks = this.locationSubscribers.get(jeepneyId);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(jeepneyId, location, vehicleType);
        } catch (error) {
          // Error in location callback
        }
      });
    }
  }

  /**
   * Notify status subscribers
   */
  private notifyStatusSubscribers(jeepneyId: string, status: 'online' | 'offline'): void {
    this.statusSubscribers.forEach((callback) => {
      try {
        callback(jeepneyId, status);
      } catch (error) {
        // Error in status callback
      }
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Clear queue flush interval
    if (this.queueFlushInterval) {
      clearInterval(this.queueFlushInterval);
      this.queueFlushInterval = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting'); // Normal closure
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Optionally clear message queue on disconnect
    // this.messageQueue = [];
  }

  /**
   * Get queue status (for debugging/monitoring)
   */
  getQueueStatus(): { queued: number; oldest: number | null } {
    return {
      queued: this.messageQueue.length,
      oldest: this.messageQueue.length > 0 
        ? Date.now() - this.messageQueue[0].timestamp 
        : null,
    };
  }

  /**
   * Check if connected
   */
  getConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Set server URL
   */
  setServerUrl(url: string): void {
    this.serverUrl = url;
  }
}

/**
 * Get the correct WebSocket URL based on platform
 * 
 * For physical devices, you need to use your computer's IP address.
 * Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
 * Then set EXPO_PUBLIC_WS_URL=ws://YOUR_IP:3001
 */
function getWebSocketUrl(): string {
  // Check for environment variable first (highest priority)
  if (process.env.EXPO_PUBLIC_WS_URL) {
    return process.env.EXPO_PUBLIC_WS_URL;
  }

  // Auto-detect based on platform
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    // For physical Android device, use your computer's IP: ws://192.168.x.x:3001
    return 'ws://10.0.2.2:3001';
  } else if (Platform.OS === 'ios') {
    // Using computer's IP address for iOS (works for both simulator and physical devices)
    // IP: 192.168.100.3
    return 'ws://192.168.100.3:3001';
  } else {
    // Web or other platforms - use IP address for consistency
    return 'ws://192.168.100.3:3001';
  }
}

// Export singleton instance
const WS_SERVER_URL = getWebSocketUrl();
export const webSocketService = new WebSocketService(WS_SERVER_URL);

