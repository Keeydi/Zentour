const db = require('../connection');
const bcrypt = require('bcrypt');

class User {
  // Create a new user (passenger or driver)
  // role: 0 = Passenger, 1 = Driver
  static async create(userData) {
    const {
      name,
      email,
      password,
      phone,
      role = 0, // Default to passenger
      // Driver-specific fields
      address,
      plate_number,
      license_number,
      jeepney_id,
      vehicle_type,
      vehicle_model,
      vehicle_color,
      // Verification fields
      is_verified = false
    } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Build SQL based on role
    if (role === 1) {
      // Driver signup - require driver-specific fields
      if (!plate_number || !license_number) {
        throw new Error('Plate number and license number are required for drivers');
      }
      
      const sql = `
        INSERT INTO users (
          name, email, password, phone, role,
          address, plate_number, license_number, jeepney_id,
          vehicle_type, vehicle_model, vehicle_color,
          is_verified
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        name,
        email,
        hashedPassword,
        phone || null,
        role,
        address || null,
        plate_number,
        license_number,
        jeepney_id || null,
        vehicle_type || 'Jeepney',
        vehicle_model || null,
        vehicle_color || null,
        is_verified ? 1 : 0
      ];
      
      const result = await db.query(sql, params);
      return result.insertId;
    } else {
      // Passenger signup
      const sql = `
        INSERT INTO users (name, email, password, phone, role, is_verified)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const result = await db.query(sql, [
        name, 
        email, 
        hashedPassword, 
        phone || null, 
        role,
        is_verified ? 1 : 0
      ]);
      return result.insertId;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const sql = `
        SELECT id, name, email, password, phone, role,
               address, plate_number, license_number, jeepney_id,
               vehicle_type, vehicle_model, vehicle_color,
               is_verified, is_active, is_online, 
               COALESCE(current_passengers, 0) as current_passengers,
               COALESCE(max_capacity, 20) as max_capacity,
               created_at
        FROM users WHERE email = ?
      `;
      const results = await db.query(sql, [email]);
      
      // Ensure we return null if no results or if results is not an array
      if (!Array.isArray(results) || results.length === 0) {
        return null;
      }
      
      return results[0] || null;
    } catch (error) {
      console.error('Error in findByEmail:', error);
      console.error('Error details:', error.message);
      // Return null instead of throwing to prevent server crashes
      return null;
    }
  }

  // Find user by ID
  static async findById(id) {
    const sql = `
      SELECT id, name, email, phone, role,
             address, plate_number, license_number, jeepney_id,
             vehicle_type, vehicle_model, vehicle_color,
             is_verified, is_active, is_online, created_at
      FROM users WHERE id = ?
    `;
    const results = await db.query(sql, [id]);
    return results[0] || null;
  }

  // Find driver by jeepney_id
  static async findByJeepneyId(jeepneyId) {
    const sql = `
      SELECT id, name, email, phone, role,
             address, plate_number, license_number, jeepney_id,
             vehicle_type, vehicle_model, vehicle_color,
             is_verified, is_active, is_online, created_at
      FROM users WHERE jeepney_id = ? AND role = 1
    `;
    const results = await db.query(sql, [jeepneyId]);
    return results[0] || null;
  }

  // Verify password
  static async verifyPassword(email, password) {
    try {
      const user = await this.findByEmail(email);
      
      // If user doesn't exist, return null
      if (!user) {
        return null;
      }
      
      // If user exists but has no password (shouldn't happen, but safety check)
      if (!user.password) {
        return null;
      }
      
      // Compare password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return null;
      }
      
      // Return user without password
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at
      };

      // Include driver-specific fields if role is driver
      if (user.role === 1) {
        userData.address = user.address;
        userData.plate_number = user.plate_number;
        userData.license_number = user.license_number;
        userData.jeepney_id = user.jeepney_id;
        userData.vehicle_type = user.vehicle_type;
        userData.vehicle_model = user.vehicle_model;
        userData.vehicle_color = user.vehicle_color;
        userData.is_verified = user.is_verified;
        userData.is_online = user.is_online;
      }

      return userData;
    } catch (error) {
      // Log error and return null to reject login
      console.error('Error in verifyPassword:', error);
      return null;
    }
  }

  // Update user information
  static async update(id, userData) {
    const {
      name,
      phone,
      address,
      plate_number,
      license_number,
      vehicle_type,
      vehicle_model,
      vehicle_color,
      is_verified
    } = userData;

    // Get user to check role
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Build update fields dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (is_verified !== undefined) {
      updateFields.push('is_verified = ?');
      updateValues.push(is_verified ? 1 : 0);
    }
    
    if (user.role === 1) {
      // Driver update - include driver-specific fields
      if (address !== undefined) {
        updateFields.push('address = ?');
        updateValues.push(address || null);
      }
      if (plate_number !== undefined) {
        updateFields.push('plate_number = ?');
        updateValues.push(plate_number);
      }
      if (license_number !== undefined) {
        updateFields.push('license_number = ?');
        updateValues.push(license_number);
      }
      if (vehicle_type !== undefined) {
        updateFields.push('vehicle_type = ?');
        updateValues.push(vehicle_type || 'Jeepney');
      }
      if (vehicle_model !== undefined) {
        updateFields.push('vehicle_model = ?');
        updateValues.push(vehicle_model || null);
      }
      if (vehicle_color !== undefined) {
        updateFields.push('vehicle_color = ?');
        updateValues.push(vehicle_color || null);
      }
    }
    
    if (updateFields.length === 0) {
      // No fields to update
      return await this.findById(id);
    }
    
    updateValues.push(id);
    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    await db.query(sql, updateValues);
    
    return await this.findById(id);
  }

  // Update online status (for drivers)
  static async updateOnlineStatus(id, isOnline) {
    const sql = 'UPDATE users SET is_online = ? WHERE id = ? AND role = 1';
    await db.query(sql, [isOnline, id]);
    return await this.findById(id);
  }

  // Get all online drivers
  static async getOnlineDrivers() {
    const sql = `
      SELECT id, name, email, phone, jeepney_id,
             vehicle_type, vehicle_model, vehicle_color,
             is_online
      FROM users 
      WHERE role = 1 AND is_online = 1 AND is_active = 1
    `;
    return await db.query(sql);
  }

  // Check if email exists
  static async emailExists(email) {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
    const results = await db.query(sql, [email]);
    return results[0].count > 0;
  }

  // Check if plate number exists (for drivers)
  static async plateNumberExists(plateNumber) {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE plate_number = ? AND role = 1';
    const results = await db.query(sql, [plateNumber]);
    return results[0].count > 0;
  }

  // Check if license number exists (for drivers)
  static async licenseNumberExists(licenseNumber) {
    const sql = 'SELECT COUNT(*) as count FROM users WHERE license_number = ? AND role = 1';
    const results = await db.query(sql, [licenseNumber]);
    return results[0].count > 0;
  }
}

module.exports = User;

