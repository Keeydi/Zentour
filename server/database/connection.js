/**
 * Database Connection Module
 * 
 * Manages MySQL connection pool and provides query execution helpers.
 * 
 * Environment Variables:
 * - DB_HOST: MySQL host (default: localhost)
 * - DB_USER: MySQL user (default: root)
 * - DB_PASSWORD: MySQL password (default: empty)
 * - DB_NAME: Database name (default: aahron_db)
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'aahron_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful, false otherwise
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error.message);
    return false;
  }
}

/**
 * Execute a SQL query with parameters
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 * @throws {Error} If query execution fails
 */
async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', {
      message: error.message,
      sql: sql.substring(0, 100) + '...',
      params: params
    });
    throw error;
  }
}

/**
 * Get a connection from the pool
 * @returns {Promise<Connection>} MySQL connection
 */
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Failed to get database connection:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  getConnection,
  testConnection
};

