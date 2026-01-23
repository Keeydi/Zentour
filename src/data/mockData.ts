import { Jeepney, RouteStop } from '../types';

// Anonas to Lagro route coordinates (Quezon City, Philippines)
// Anonas area: ~14.6250° N, 121.0500° E
// Lagro area: ~14.7000° N, 121.0300° E
// Route points along the way
export const ANONAS_COORDINATES = {
  latitude: 14.6250,
  longitude: 121.0500,
};

export const LAGRO_COORDINATES = {
  latitude: 14.7000,
  longitude: 121.0300,
};

// Route Stops for Lagro-Anonas / Anonas-Lagro route
// These are jeepney/bus stops along the route
// Defined first so it can be used in mockOnlineJeepneys
export const routeStops: RouteStop[] = [
  { id: 'STOP-001', latitude: 14.735304621498024, longitude: 121.06698424455205, name: 'Stop 1', route: 'both' },
  { id: 'STOP-002', latitude: 14.729333477332542, longitude: 121.06777248789787, name: 'Stop 2', route: 'both' },
  { id: 'STOP-003', latitude: 14.708964362097335, longitude: 121.0627518982314, name: 'Stop 3', route: 'both' },
  { id: 'STOP-004', latitude: 14.706381398613555, longitude: 121.06990621703035, name: 'Stop 4', route: 'both' },
  { id: 'STOP-005', latitude: 14.704958458917364, longitude: 121.07738378162982, name: 'Stop 5', route: 'both' },
  { id: 'STOP-006', latitude: 14.704649603290985, longitude: 121.08012878166357, name: 'Stop 6', route: 'both' },
  { id: 'STOP-007', latitude: 14.701874606766943, longitude: 121.08673276805497, name: 'Stop 7', route: 'both' },
  { id: 'STOP-008', latitude: 14.69560891881875, longitude: 121.08651624393528, name: 'Stop 8', route: 'both' },
  { id: 'STOP-009', latitude: 14.681684888547549, longitude: 121.08523447599364, name: 'Stop 9', route: 'both' },
  { id: 'STOP-010', latitude: 14.677076843528132, longitude: 121.08189639536597, name: 'Stop 10', route: 'both' },
  { id: 'STOP-011', latitude: 14.666446551290655, longitude: 121.07065518311502, name: 'Stop 11', route: 'both' },
  { id: 'STOP-012', latitude: 14.660112063852678, longitude: 121.06101639577449, name: 'Stop 12', route: 'both' },
  { id: 'STOP-013', latitude: 14.653479400512323, longitude: 121.0522565399929, name: 'Stop 13', route: 'both' },
  { id: 'STOP-014', latitude: 14.648608990786581, longitude: 121.05106839583947, name: 'Stop 14', route: 'both' },
  { id: 'STOP-015', latitude: 14.642443402608334, longitude: 121.05433035674145, name: 'Stop 15', route: 'both' },
  { id: 'STOP-016', latitude: 14.636191130095051, longitude: 121.05463396465888, name: 'Stop 16', route: 'both' },
  { id: 'STOP-017', latitude: 14.635555699981778, longitude: 121.05838995423471, name: 'Stop 17', route: 'both' },
  { id: 'STOP-018', latitude: 14.627613381611138, longitude: 121.0634728641742, name: 'Stop 18', route: 'both' },
];

// Helper function to calculate a point along the route between two stops
function getPointAlongRoute(
  stop1: RouteStop,
  stop2: RouteStop,
  ratio: number
): { latitude: number; longitude: number } {
  return {
    latitude: stop1.latitude + (stop2.latitude - stop1.latitude) * ratio,
    longitude: stop1.longitude + (stop2.longitude - stop1.longitude) * ratio,
  };
}

// Demo/Mock Jeepneys for demonstration purposes
// These appear on the map to show how the system works
// All jeepneys are positioned along the route between stops only
export const mockOnlineJeepneys: Jeepney[] = [
  // Between Stop 1 and Stop 2
  {
    id: 'DEMO-001',
    ...getPointAlongRoute(routeStops[0], routeStops[1], 0.3),
    status: 'online',
    route: 'Anonas-Lagro',
    vehicleType: 'Jeepney',
  },
  // Between Stop 2 and Stop 3
  {
    id: 'DEMO-002',
    ...getPointAlongRoute(routeStops[1], routeStops[2], 0.5),
    status: 'online',
    route: 'Lagro-Anonas',
    vehicleType: 'Jeepney',
  },
  // Between Stop 3 and Stop 4
  {
    id: 'DEMO-003',
    ...getPointAlongRoute(routeStops[2], routeStops[3], 0.7),
    status: 'online',
    route: 'Anonas-Lagro',
    vehicleType: 'E-Jeep',
  },
  // Between Stop 4 and Stop 5
  {
    id: 'DEMO-004',
    ...getPointAlongRoute(routeStops[3], routeStops[4], 0.2),
    status: 'online',
    route: 'Lagro-Anonas',
    vehicleType: 'UV Express',
  },
  // Between Stop 5 and Stop 6
  {
    id: 'DEMO-005',
    ...getPointAlongRoute(routeStops[4], routeStops[5], 0.6),
    status: 'online',
    route: 'Anonas-Lagro',
    vehicleType: 'Jeepney',
  },
  // Between Stop 6 and Stop 7
  {
    id: 'DEMO-006',
    ...getPointAlongRoute(routeStops[5], routeStops[6], 0.4),
    status: 'online',
    route: 'Lagro-Anonas',
    vehicleType: 'Bus',
  },
  // Between Stop 7 and Stop 8
  {
    id: 'DEMO-007',
    ...getPointAlongRoute(routeStops[6], routeStops[7], 0.8),
    status: 'online',
    route: 'Anonas-Lagro',
    vehicleType: 'Jeepney',
  },
  // Between Stop 8 and Stop 9
  {
    id: 'DEMO-008',
    ...getPointAlongRoute(routeStops[7], routeStops[8], 0.3),
    status: 'online',
    route: 'Lagro-Anonas',
    vehicleType: 'Tricycle',
  },
];

// All jeepneys (for backward compatibility)
export const mockAllJeepneys: Jeepney[] = mockOnlineJeepneys;
