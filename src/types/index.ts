export type VehicleType = 'Jeepney' | 'E-Jeep' | 'Bus' | 'UV Express' | 'Tricycle';

export interface Jeepney {
  id: string;
  latitude: number;
  longitude: number;
  status?: 'online' | 'offline';
  driverId?: string; // Link jeepney to driver
  route?: 'Anonas-Lagro' | 'Lagro-Anonas'; // Route direction
  vehicleType?: VehicleType; // Type of vehicle
}

export interface Destination {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface RouteInfo {
  distance: number; // in kilometers
  eta: number; // in minutes
}

export interface Driver {
  id: string;
  email: string;
  name: string;
  phone?: string;
  jeepneyId?: string; // Driver's jeepney ID
  isOnline: boolean; // Current online status
  currentPassengers?: number;
  maxCapacity?: number;
  vehicleType?: VehicleType; // Type of vehicle (Jeepney, E-Jeep, Bus, etc.)
  plateNumber?: string; // Vehicle plate number
  licenseNumber?: string; // Driver's license number
  vehicleModel?: string; // Vehicle model
  vehicleColor?: string; // Vehicle color
}

export interface SavedLocation {
  id: number;
  user_id: number;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  type: 'home' | 'work' | 'school' | 'custom';
  created_at?: string;
  updated_at?: string;
}

export interface RouteStop {
  id: string;
  latitude: number;
  longitude: number;
  name?: string;
  route?: 'Anonas-Lagro' | 'Lagro-Anonas' | 'both';
}


