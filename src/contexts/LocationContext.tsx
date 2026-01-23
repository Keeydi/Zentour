import React, { createContext, useContext } from 'react';
import * as Location from 'expo-location';

interface LocationContextType {
  location: Location.LocationObject | null;
  error: string | null;
}

export const LocationContext = createContext<LocationContextType>({
  location: null,
  error: null,
});

export const useLocation = () => useContext(LocationContext);

