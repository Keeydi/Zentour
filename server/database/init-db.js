/**
 * Database Initialization Script
 * 
 * Creates the database and all required tables from schema.sql
 * 
 * Usage: node database/init-db.js
 * 
 * Environment Variables:
 * - DB_HOST: MySQL host (default: localhost)
 * - DB_USER: MySQL user (default: root)
 * - DB_PASSWORD: MySQL password (default: empty)
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
  let connection;
  
  try {
    console.log('🔧 Initializing database...\n');
    
    // Connect to MySQL server (without database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Connected to MySQL server');

    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Schema file loaded\n');

    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let executedCount = 0;
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
          executedCount++;
        } catch (error) {
          // Ignore "database already exists" and "table already exists" errors
          if (!error.message.includes('already exists') && 
              !error.message.includes('Duplicate')) {
            console.error(`❌ Error executing statement:`, error.message);
            throw error;
          }
        }
      }
    }

    console.log(`✅ Executed ${executedCount} SQL statements\n`);
    console.log('✨ Database initialized successfully!');
    console.log('📊 Database: aahron_db');
    console.log('📋 Tables:');
    console.log('   - users');
    console.log('   - login_history');
    console.log('   - driver_locations');
    console.log('   - saved_locations');
    console.log('   - password_reset_tokens\n');
    
  } catch (error) {
    console.error('\n❌ Error initializing database:');
    console.error(`   ${error.message}\n`);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed\n');
    }
  }
}

// Run initialization
initDatabase();

