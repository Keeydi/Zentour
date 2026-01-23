const db = require('../connection');

class LoginHistory {
  // Record login attempt
  // role: 0 = Passenger, 1 = Driver
  static async record(loginData) {
    try {
      const {
        user_id,
        role, // 0 = Passenger, 1 = Driver
        email,
        ip_address,
        user_agent,
        login_status,
        failure_reason
      } = loginData;
      
      const sql = `
        INSERT INTO login_history (
          user_id, role, email, ip_address,
          user_agent, login_status, failure_reason
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await db.query(sql, [
        user_id || null,
        role !== undefined ? role : null,
        email || '',
        ip_address || null,
        user_agent || null,
        login_status,
        failure_reason || null
      ]);
      
      return result.insertId;
    } catch (error) {
      // Log error but don't throw - login history is optional
      console.error('Error recording login history:', error);
      console.error('Error details:', error.message);
      return null;
    }
  }

  // Get login history for a user
  static async getByUserId(userId, role, limit = 50) {
    const sql = `
      SELECT * FROM login_history
      WHERE user_id = ? AND role = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    return await db.query(sql, [userId, role, limit]);
  }

  // Get recent login attempts
  static async getRecent(limit = 100) {
    const sql = `
      SELECT * FROM login_history
      ORDER BY created_at DESC
      LIMIT ?
    `;
    return await db.query(sql, [limit]);
  }

  // Get failed login attempts for an email
  static async getFailedAttempts(email, hours = 24) {
    const sql = `
      SELECT COUNT(*) as count FROM login_history
      WHERE email = ? 
        AND login_status = 'failed'
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    `;
    const results = await db.query(sql, [email, hours]);
    return results[0].count;
  }
}

module.exports = LoginHistory;

