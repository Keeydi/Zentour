import { useState, useEffect } from 'react';

interface CapacityInfo {
  current_passengers: number;
  max_capacity: number;
  available_seats: number;
}

export function useJeepneyCapacity(jeepneyId: string | null) {
  const [capacity, setCapacity] = useState<CapacityInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jeepneyId) {
      setCapacity(null);
      return;
    }

    const fetchCapacity = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.3:3001';
        const response = await fetch(`${API_URL}/api/jeepneys/${jeepneyId}/capacity`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.capacity) {
            setCapacity(data.capacity);
          }
        }
      } catch (error) {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchCapacity();
    
    // Refresh capacity every 30 seconds
    const interval = setInterval(fetchCapacity, 30000);
    return () => clearInterval(interval);
  }, [jeepneyId]);

  return { capacity, loading };
}

