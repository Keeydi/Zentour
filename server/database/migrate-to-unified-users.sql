-- ============================================================================
-- MIGRATION SCRIPT: Merge users and drivers into unified users table
-- ============================================================================
-- 
-- PURPOSE:
-- This script migrates existing data from separate 'users' and 'drivers' 
-- tables into the new unified 'users' table structure.
--
-- WHEN TO USE:
-- - Only run this if you have an existing database with separate users/drivers tables
-- - If starting fresh, use schema.sql instead (which already has unified structure)
-- - Run this BEFORE deploying the new unified User model
--
-- USAGE:
--   mysql -u root -p aahron_db < server/database/migrate-to-unified-users.sql
--
-- WARNING:
-- - Backup your database before running this migration
-- - Verify all data is migrated correctly before dropping the old drivers table
-- - Test thoroughly in a development environment first
--
-- ============================================================================

USE aahron_db;

-- Step 1: Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TINYINT DEFAULT 0 COMMENT '0 = Passenger, 1 = Driver',
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS plate_number VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS license_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS jeepney_id VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) DEFAULT 'Jeepney',
ADD COLUMN IF NOT EXISTS vehicle_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS vehicle_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- Step 2: Migrate drivers data to users table
INSERT INTO users (
    name, email, password, phone, address,
    plate_number, license_number, jeepney_id,
    vehicle_type, vehicle_model, vehicle_color,
    is_verified, is_active, is_online,
    role, created_at, updated_at
)
SELECT 
    name, email, password, phone, address,
    plate_number, license_number, jeepney_id,
    vehicle_type, vehicle_model, vehicle_color,
    is_verified, is_active, is_online,
    1 as role, -- Set role to 1 (Driver)
    created_at, updated_at
FROM drivers
WHERE email NOT IN (SELECT email FROM users)
ON DUPLICATE KEY UPDATE
    role = 1,
    address = VALUES(address),
    plate_number = VALUES(plate_number),
    license_number = VALUES(license_number),
    jeepney_id = VALUES(jeepney_id),
    vehicle_type = VALUES(vehicle_type),
    vehicle_model = VALUES(vehicle_model),
    vehicle_color = VALUES(vehicle_color),
    is_verified = VALUES(is_verified),
    is_active = VALUES(is_active),
    is_online = VALUES(is_online);

-- Step 3: Update foreign keys in related tables
-- Update driver_locations to reference users table
ALTER TABLE driver_locations
DROP FOREIGN KEY IF EXISTS driver_locations_ibfk_1;

ALTER TABLE driver_locations
MODIFY COLUMN driver_id INT NOT NULL,
ADD CONSTRAINT fk_driver_locations_user 
FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update bookings to reference users table for driver_id
ALTER TABLE bookings
DROP FOREIGN KEY IF EXISTS bookings_ibfk_2;

ALTER TABLE bookings
MODIFY COLUMN driver_id INT,
ADD CONSTRAINT fk_bookings_driver 
FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL;

-- Step 4: Update login_history to use role instead of user_type
ALTER TABLE login_history
ADD COLUMN IF NOT EXISTS role TINYINT COMMENT '0 = Passenger, 1 = Driver';

UPDATE login_history
SET role = CASE 
    WHEN user_type = 'user' THEN 0
    WHEN user_type = 'driver' THEN 1
    ELSE 0
END;

-- Step 5: Add indexes
CREATE INDEX IF NOT EXISTS idx_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_plate_number ON users(plate_number);
CREATE INDEX IF NOT EXISTS idx_license_number ON users(license_number);
CREATE INDEX IF NOT EXISTS idx_jeepney_id ON users(jeepney_id);
CREATE INDEX IF NOT EXISTS idx_is_online ON users(is_online);
CREATE INDEX IF NOT EXISTS idx_role_online ON users(role, is_online);

-- Step 6: Drop drivers table (after migration is verified)
-- Uncomment the line below only after verifying all data is migrated correctly
-- DROP TABLE IF EXISTS drivers;

