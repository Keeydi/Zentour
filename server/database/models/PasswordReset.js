const crypto = require('crypto');
const db = require('../connection');

class PasswordReset {
  // Generate a secure reset token
  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create a password reset token
  static async createToken(userId) {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour
    
    const sql = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `;
    
    await db.query(sql, [userId, token, expiresAt]);
    return token;
  }

  // Find token and verify it's valid
  static async findValidToken(token) {
    const sql = `
      SELECT prt.*, u.email, u.name
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = ? 
        AND prt.expires_at > NOW()
        AND prt.used = FALSE
    `;
    const results = await db.query(sql, [token]);
    return results[0] || null;
  }

  // Mark token as used
  static async markAsUsed(token) {
    const sql = 'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?';
    await db.query(sql, [token]);
  }

  // Delete expired tokens (cleanup)
  static async deleteExpiredTokens() {
    const sql = 'DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE';
    await db.query(sql);
  }
}

module.exports = PasswordReset;

