import { Jeepney } from '../types';

/**
 * Filter jeepneys to show only online ones
 */
export function filterOnlineJeepneys(jeepneys: Jeepney[] | undefined | null): Jeepney[] {
  if (!jeepneys || jeepneys.length === 0) {
    return [];
  }
  return jeepneys.filter((jeepney) => jeepney.status === 'online');
}


