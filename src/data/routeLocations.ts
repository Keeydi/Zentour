/**
 * Route Locations - Anonas to Lagro Route
 * Key landmarks and stops along the route
 */

export interface RouteLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number; // Order along the route
}

export const routeLocations: RouteLocation[] = [
  {
    id: 'lagro',
    name: 'Lagro',
    latitude: 14.7000,
    longitude: 121.0300,
    order: 1,
  },
  {
    id: 'olfu-regalado',
    name: 'OLFU Regalado',
    latitude: 14.6900,
    longitude: 121.0350,
    order: 2,
  },
  {
    id: 'north-fairview',
    name: 'North Fairview',
    latitude: 14.6800,
    longitude: 121.0400,
    order: 3,
  },
  {
    id: 'fcm',
    name: 'FCM',
    latitude: 14.6700,
    longitude: 121.0450,
    order: 4,
  },
  {
    id: 'pearl-drive',
    name: 'Pearl Drive',
    latitude: 14.6600,
    longitude: 121.0480,
    order: 5,
  },
  {
    id: 'puregold-north-fairview',
    name: 'Puregold North Fairview',
    latitude: 14.6500,
    longitude: 121.0500,
    order: 6,
  },
  {
    id: 'litex',
    name: 'Litex',
    latitude: 14.6400,
    longitude: 121.0520,
    order: 7,
  },
  {
    id: 'coa',
    name: 'COA',
    latitude: 14.6300,
    longitude: 121.0530,
    order: 8,
  },
  {
    id: 'sandigan',
    name: 'Sandigan',
    latitude: 14.6250,
    longitude: 121.0520,
    order: 9,
  },
  {
    id: 'don-antonio',
    name: 'Don Antonio',
    latitude: 14.6200,
    longitude: 121.0510,
    order: 10,
  },
  {
    id: 'luzon',
    name: 'Luzon',
    latitude: 14.6150,
    longitude: 121.0500,
    order: 11,
  },
  {
    id: 'tandang-sora',
    name: 'Tandang Sora',
    latitude: 14.6100,
    longitude: 121.0490,
    order: 12,
  },
  {
    id: 'philcoa',
    name: 'Philcoa',
    latitude: 14.6050,
    longitude: 121.0480,
    order: 13,
  },
  {
    id: 'anonas',
    name: 'Anonas',
    latitude: 14.6250,
    longitude: 121.0500,
    order: 14,
  },
];

// Get location by name (case-insensitive)
export const getLocationByName = (name: string): RouteLocation | undefined => {
  return routeLocations.find(
    (loc) => loc.name.toLowerCase() === name.toLowerCase()
  );
};

// Get locations sorted by order
export const getSortedLocations = (): RouteLocation[] => {
  return [...routeLocations].sort((a, b) => a.order - b.order);
};


