-- ============================================================================
-- Jeepney Monitoring System Database Schema
-- Database: aahron_db
-- ============================================================================

CREATE DATABASE IF NOT EXISTS aahron_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aahron_db;

-- ============================================================================
-- USERS TABLE (Unified for Passengers and Drivers)
-- ============================================================================
-- This table stores both passengers and drivers in a unified structure.
-- Role: 0 = Passenger, 1 = Driver
-- Driver-specific fields are nullable for passengers.
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role TINYINT DEFAULT 0 COMMENT '0 = Passenger, 1 = Driver',
    
    -- Driver-specific fields (nullable for passengers)
    address TEXT,
    plate_number VARCHAR(20) UNIQUE,
    license_number VARCHAR(50) UNIQUE,
    jeepney_id VARCHAR(50) UNIQUE,
    vehicle_type VARCHAR(50) DEFAULT 'Jeepney',
    vehicle_model VARCHAR(100),
    vehicle_color VARCHAR(50),
    
    -- Status flags
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_online BOOLEAN DEFAULT FALSE,
    
    -- Capacity tracking (for drivers)
    current_passengers INT DEFAULT 0,
    max_capacity INT DEFAULT 20,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_role (role),
    INDEX idx_plate_number (plate_number),
    INDEX idx_license_number (license_number),
    INDEX idx_jeepney_id (jeepney_id),
    INDEX idx_is_online (is_online),
    INDEX idx_role_online (role, is_online)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- LOGIN HISTORY TABLE
-- ============================================================================
-- Tracks all login attempts (successful and failed) for security auditing.
-- ============================================================================
CREATE TABLE IF NOT EXISTS login_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    role TINYINT COMMENT '0 = Passenger, 1 = Driver',
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    login_status ENUM('success', 'failed') NOT NULL,
    failure_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_role (role),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DRIVER LOCATIONS TABLE
-- ============================================================================
-- Stores historical location data for drivers/jeepneys.
-- Used for tracking, analytics, and route optimization.
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    driver_id INT NOT NULL,
    jeepney_id VARCHAR(50),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    speed DECIMAL(10, 2),
    heading DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_driver_id (driver_id),
    INDEX idx_jeepney_id (jeepney_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SAVED LOCATIONS TABLE
-- ============================================================================
-- Stores user's saved favorite locations (home, work, school, custom).
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    type ENUM('home', 'work', 'school', 'custom') DEFAULT 'custom',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================================================
-- Manages password reset tokens with expiration and usage tracking.
-- ============================================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


