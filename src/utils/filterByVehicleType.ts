import { Jeepney, VehicleType } from '../types';

/**
 * Filter jeepneys by vehicle type
 */
export function filterByVehicleType(
  jeepneys: Jeepney[],
  vehicleTypes: VehicleType[]
): Jeepney[] {
  if (!jeepneys || jeepneys.length === 0) {
    return [];
  }
  
  if (vehicleTypes.length === 0) {
    return [];
  }
  
  return jeepneys.filter((jeepney) => {
    // If jeepney doesn't have vehicleType, include it (for backward compatibility)
    if (!jeepney.vehicleType) {
      return true;
    }
    return vehicleTypes.includes(jeepney.vehicleType);
  });
}

