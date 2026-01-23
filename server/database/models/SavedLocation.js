const db = require('../connection');

class SavedLocation {
  // Create a new saved location
  static async create(locationData) {
    const {
      user_id,
      name,
      latitude,
      longitude,
      address,
      type = 'custom'
    } = locationData;
    
    const sql = `
      INSERT INTO saved_locations (user_id, name, latitude, longitude, address, type)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(sql, [
      user_id,
      name,
      latitude,
      longitude,
      address || null,
      type
    ]);
    
    return result.insertId;
  }

  // Get all saved locations for a user
  static async getByUserId(userId) {
    const sql = `
      SELECT id, name, latitude, longitude, address, type, created_at, updated_at
      FROM saved_locations
      WHERE user_id = ?
      ORDER BY type, name ASC
    `;
    return await db.query(sql, [userId]);
  }

  // Get saved location by ID
  static async findById(id, userId) {
    const sql = `
      SELECT id, name, latitude, longitude, address, type, created_at, updated_at
      FROM saved_locations
      WHERE id = ? AND user_id = ?
    `;
    const results = await db.query(sql, [id, userId]);
    return results[0] || null;
  }

  // Update saved location
  static async update(id, userId, locationData) {
    const { name, latitude, longitude, address, type } = locationData;
    
    const sql = `
      UPDATE saved_locations
      SET name = ?, latitude = ?, longitude = ?, address = ?, type = ?
      WHERE id = ? AND user_id = ?
    `;
    
    await db.query(sql, [name, latitude, longitude, address || null, type, id, userId]);
    return await this.findById(id, userId);
  }

  // Delete saved location
  static async delete(id, userId) {
    const sql = 'DELETE FROM saved_locations WHERE id = ? AND user_id = ?';
    await db.query(sql, [id, userId]);
    return true;
  }
}

module.exports = SavedLocation;

