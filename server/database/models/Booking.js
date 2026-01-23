const db = require('../connection');

class Booking {
  // Create a new booking
  static async create(bookingData) {
    const {
      booking_id,
      passenger_id,
      driver_id,
      jeepney_id,
      start_latitude,
      start_longitude,
      start_address,
      destination_latitude,
      destination_longitude,
      destination_address,
      distance,
      fare
    } = bookingData;
    
    const sql = `
      INSERT INTO bookings (
        booking_id, passenger_id, driver_id, jeepney_id,
        start_latitude, start_longitude, start_address,
        destination_latitude, destination_longitude, destination_address,
        distance, fare
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(sql, [
      booking_id,
      passenger_id,
      driver_id || null,
      jeepney_id || null,
      start_latitude,
      start_longitude,
      start_address || null,
      destination_latitude,
      destination_longitude,
      destination_address || null,
      distance,
      fare
    ]);
    
    return result.insertId;
  }

  // Find booking by ID
  static async findById(id) {
    const sql = `
      SELECT b.*, 
             u.name as passenger_name, u.email as passenger_email,
             d.name as driver_name, d.email as driver_email
      FROM bookings b
      LEFT JOIN users u ON b.passenger_id = u.id AND u.role = 0
      LEFT JOIN users d ON b.driver_id = d.id AND d.role = 1
      WHERE b.id = ?
    `;
    const results = await db.query(sql, [id]);
    return results[0] || null;
  }

  // Find booking by booking_id
  static async findByBookingId(bookingId) {
    const sql = `
      SELECT b.*, 
             u.name as passenger_name, u.email as passenger_email,
             d.name as driver_name, d.email as driver_email
      FROM bookings b
      LEFT JOIN users u ON b.passenger_id = u.id AND u.role = 0
      LEFT JOIN users d ON b.driver_id = d.id AND d.role = 1
      WHERE b.booking_id = ?
    `;
    const results = await db.query(sql, [bookingId]);
    return results[0] || null;
  }

  // Get bookings by passenger ID
  static async getByPassengerId(passengerId, limit = 50) {
    const sql = `
      SELECT b.*, 
             d.name as driver_name, d.phone as driver_phone
      FROM bookings b
      LEFT JOIN users d ON b.driver_id = d.id AND d.role = 1
      WHERE b.passenger_id = ?
      ORDER BY b.created_at DESC
      LIMIT ?
    `;
    return await db.query(sql, [passengerId, limit]);
  }

  // Get bookings by driver ID
  static async getByDriverId(driverId, limit = 50) {
    const sql = `
      SELECT b.*, 
             u.name as passenger_name, u.phone as passenger_phone
      FROM bookings b
      LEFT JOIN users u ON b.passenger_id = u.id AND u.role = 0
      WHERE b.driver_id = ?
      ORDER BY b.created_at DESC
      LIMIT ?
    `;
    return await db.query(sql, [driverId, limit]);
  }

  // Update booking status
  static async updateStatus(bookingId, status, driverId = null) {
    const statusFields = {
      'accepted': 'accepted_at',
      'in_progress': 'started_at',
      'completed': 'completed_at',
      'cancelled': 'cancelled_at'
    };
    
    const timestampField = statusFields[status];
    const updates = ['status = ?'];
    const params = [status];
    
    if (timestampField) {
      updates.push(`${timestampField} = NOW()`);
    }
    
    if (driverId && status === 'accepted') {
      updates.push('driver_id = ?');
      params.push(driverId);
    }
    
    params.push(bookingId);
    
    const sql = `UPDATE bookings SET ${updates.join(', ')} WHERE booking_id = ?`;
    await db.query(sql, params);
    
    return await this.findByBookingId(bookingId);
  }

  // Get booking statistics
  static async getStatistics(passengerId = null, driverId = null) {
    let sql = 'SELECT status, COUNT(*) as count FROM bookings WHERE 1=1';
    const params = [];
    
    if (passengerId) {
      sql += ' AND passenger_id = ?';
      params.push(passengerId);
    }
    
    if (driverId) {
      sql += ' AND driver_id = ?';
      params.push(driverId);
    }
    
    sql += ' GROUP BY status';
    
    return await db.query(sql, params);
  }
}

module.exports = Booking;

