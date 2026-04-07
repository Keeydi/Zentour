const { supabase } = require('../connection');

class DriverLocation {
  static async create(locationData) {
    const { error } = await supabase.from('driver_locations').insert({
      driver_id: locationData.driver_id,
      jeepney_id: locationData.jeepney_id || null,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      accuracy: locationData.accuracy ?? null,
      speed: locationData.speed ?? null,
      heading: locationData.heading ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = DriverLocation;
