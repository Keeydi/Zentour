const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
require('dotenv').config();

// Database imports
const db = require('../database/connection');
const User = require('../database/models/User');
const LoginHistory = require('../database/models/LoginHistory');
const SavedLocation = require('../database/models/SavedLocation');
const PasswordReset = require('../database/models/PasswordReset');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket server with proper configuration
const wss = new WebSocket.Server({ 
  server,
  // Allow connections from any origin (for development)
  // In production, specify allowed origins
  verifyClient: (info) => {
    return true; // Accept all connections for now
  }
});

// Handle WebSocket server errors
wss.on('error', (error) => {
  // WebSocket Server error
});

// Log when server is ready
wss.on('listening', () => {
  // WebSocket server is listening for connections
});

// Store active connections and data
const activeConnections = new Map(); // jeepneyId -> Set of WebSockets (multi-device support)
const jeepneyLocations = new Map(); // jeepneyId -> location data
const jeepneyStatuses = new Map(); // jeepneyId -> 'online' | 'offline'
const jeepneyVehicleTypes = new Map(); // jeepneyId -> vehicle_type
const passengerConnections = new Set(); // Set of passenger WebSocket connections
const deviceConnections = new Map(); // WebSocket -> { jeepneyId, deviceId }

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleWebSocketMessage(ws, data);
    } catch (error) {
      // Error parsing WebSocket message
    }
  });

  ws.on('close', () => {
    // Remove from passenger connections
    passengerConnections.delete(ws);
    
    // Remove device connection info
    const deviceInfo = deviceConnections.get(ws);
    if (deviceInfo) {
      const { jeepneyId } = deviceInfo;
      const connections = activeConnections.get(jeepneyId);
      if (connections) {
        connections.delete(ws);
        // If no more devices for this jeepney, mark as offline
        if (connections.size === 0) {
          activeConnections.delete(jeepneyId);
          jeepneyStatuses.set(jeepneyId, 'offline');
          broadcastStatusUpdate(jeepneyId, 'offline');
        }
      }
      deviceConnections.delete(ws);
    }
  });

  ws.on('error', (error) => {
    // WebSocket error
  });
});

function handleWebSocketMessage(ws, data) {
  switch (data.type) {
    case 'driver_register':
      // Driver registering their jeepney (multi-device support)
      const { jeepneyId, deviceId } = data;
      const deviceIdFinal = deviceId || `device-${Date.now()}-${Math.random()}`;
      
      // Get or create connection set for this jeepney
      if (!activeConnections.has(jeepneyId)) {
        activeConnections.set(jeepneyId, new Set());
      }
      const connections = activeConnections.get(jeepneyId);
      connections.add(ws);
      
      // Store device info
      deviceConnections.set(ws, { jeepneyId, deviceId: deviceIdFinal });
      
      // Mark as online if first device
      if (connections.size === 1) {
        jeepneyStatuses.set(jeepneyId, 'online');
        broadcastStatusUpdate(jeepneyId, 'online');
      }
      
      // Send confirmation
      ws.send(JSON.stringify({
        type: 'registered',
        jeepneyId,
        deviceId: deviceIdFinal,
        status: 'online',
        totalDevices: connections.size
      }));
      
      // Send current location if available
      const currentLocation = jeepneyLocations.get(jeepneyId);
      if (currentLocation) {
        broadcastLocationUpdate(jeepneyId, currentLocation);
      }
      break;

    case 'location_update':
      // Driver sending location update (from any device)
      const { jeepneyId: updateJeepneyId, location } = data;
      const deviceInfo = deviceConnections.get(ws);
      
      // Verify this device is registered for this jeepney
      if (deviceInfo && deviceInfo.jeepneyId === updateJeepneyId) {
        const connections = activeConnections.get(updateJeepneyId);
        if (connections && connections.has(ws)) {
          jeepneyLocations.set(updateJeepneyId, location);
          jeepneyStatuses.set(updateJeepneyId, 'online');
          
          // Get and cache vehicle type (fire-and-forget, don't block)
          if (!jeepneyVehicleTypes.has(updateJeepneyId)) {
            User.findByJeepneyId(updateJeepneyId).then((driver) => {
              if (driver && driver.vehicle_type) {
                jeepneyVehicleTypes.set(updateJeepneyId, driver.vehicle_type);
              }
            }).catch(() => {
              // Silently fail
            });
          }
          
          // Broadcast to all passengers
          broadcastLocationUpdate(updateJeepneyId, location);
          
          // Store location history (async, don't block)
          storeLocationHistory(updateJeepneyId, location).catch(() => {
            // Silently fail if history storage fails
          });
        }
      }
      break;

    case 'status_update':
      // Driver updating status
      const { jeepneyId: statusJeepneyId, status } = data;
      if (activeConnections.has(statusJeepneyId)) {
        jeepneyStatuses.set(statusJeepneyId, status);
        broadcastStatusUpdate(statusJeepneyId, status);
        
        if (status === 'offline') {
          jeepneyLocations.delete(statusJeepneyId);
        }
      }
      break;

    case 'passenger_connect':
      // Passenger connecting to receive updates
      passengerConnections.add(ws);
      
      // Send all current online jeepneys
      const onlineJeepneys = [];
      jeepneyStatuses.forEach((status, jeepneyId) => {
        if (status === 'online') {
          const location = jeepneyLocations.get(jeepneyId);
          const vehicleType = jeepneyVehicleTypes.get(jeepneyId) || 'Jeepney';
          if (location) {
            onlineJeepneys.push({
              jeepneyId,
              location,
              status: 'online',
              vehicleType
            });
          }
        }
      });
      
      ws.send(JSON.stringify({
        type: 'initial_data',
        jeepneys: onlineJeepneys
      }));
      break;

    default:
      // Unknown message type
      break;
  }
}

async function broadcastLocationUpdate(jeepneyId, location) {
  // Get vehicle type from database if not cached
  let vehicleType = jeepneyVehicleTypes.get(jeepneyId);
  if (!vehicleType) {
    try {
      const driver = await User.findByJeepneyId(jeepneyId);
      if (driver && driver.vehicle_type) {
        vehicleType = driver.vehicle_type;
        jeepneyVehicleTypes.set(jeepneyId, vehicleType);
      } else {
        vehicleType = 'Jeepney'; // Default
      }
    } catch (error) {
      vehicleType = 'Jeepney'; // Default on error
    }
  }
  
  const message = JSON.stringify({
    type: 'location_update',
    jeepneyId,
    location,
    vehicleType
  });

  passengerConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (error) {
        // Error broadcasting location
      }
    }
  });
}

function broadcastStatusUpdate(jeepneyId, status) {
  const message = JSON.stringify({
    type: 'status_update',
    jeepneyId,
    status
  });

  passengerConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (error) {
        // Error broadcasting status
      }
    }
  });
}

// Store location history in database
async function storeLocationHistory(jeepneyId, location) {
  try {
    // Find driver by jeepney_id (role = 1)
    const driver = await User.findByJeepneyId(jeepneyId);

    if (!driver) {
      return; // Driver not found
    }

    const driverId = driver.id;

    // Insert location history (only store every 30 seconds to reduce database load)
    // In production, you might want to batch these or use a time-based filter
    await db.query(
      `INSERT INTO driver_locations 
       (driver_id, jeepney_id, latitude, longitude, accuracy, speed, heading, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        driverId,
        jeepneyId,
        location.coords.latitude,
        location.coords.longitude,
        location.coords.accuracy || null,
        location.coords.speed || null,
        location.coords.heading || null,
      ]
    );
  } catch (error) {
    // Silently fail - location history is optional
    console.error('Error storing location history:', error);
  }
}

// REST API Routes

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Jeepney Location Server',
    status: 'running',
    websocket: `ws://${req.hostname}:${PORT}`,
    api: {
      health: '/health',
      onlineJeepneys: '/api/jeepneys/online',
      jeepneyById: '/api/jeepneys/:jeepneyId',
      stats: '/api/stats'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    websocket: 'ready',
    activeConnections: activeConnections.size,
    passengerConnections: passengerConnections.size
  });
});

// Get all online jeepneys
app.get('/api/jeepneys/online', (req, res) => {
      const onlineJeepneys = [];
      jeepneyStatuses.forEach((status, jeepneyId) => {
        if (status === 'online') {
          const location = jeepneyLocations.get(jeepneyId);
          const vehicleType = jeepneyVehicleTypes.get(jeepneyId) || 'Jeepney';
          if (location) {
            onlineJeepneys.push({
              id: jeepneyId,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              status: 'online',
              vehicleType,
              lastUpdate: location.timestamp
            });
          }
        }
      });
  res.json({ jeepneys: onlineJeepneys });
});

// Get specific jeepney location
app.get('/api/jeepneys/:jeepneyId', (req, res) => {
  const { jeepneyId } = req.params;
  const location = jeepneyLocations.get(jeepneyId);
  const status = jeepneyStatuses.get(jeepneyId);

  if (!location || !status) {
    return res.status(404).json({ error: 'Jeepney not found' });
  }

  const vehicleType = jeepneyVehicleTypes.get(jeepneyId) || 'Jeepney';
  
  res.json({
    id: jeepneyId,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    status,
    vehicleType,
    lastUpdate: location.timestamp
  });
});

// User/Passenger Authentication
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    if (!email || !password) {
      try {
        await LoginHistory.record({
          user_id: null,
          role: 0, // Passenger
          email: email || '',
          ip_address: ipAddress,
          user_agent: userAgent,
          login_status: 'failed',
          failure_reason: 'Missing credentials'
        });
      } catch (historyError) {
        // Log history error but don't fail the request
        console.error('Error recording login history:', historyError);
      }
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Verify password - this should return null if user doesn't exist or password is wrong
    let user;
    try {
      user = await User.verifyPassword(email, password);
    } catch (verifyError) {
      console.error('Error in verifyPassword:', verifyError);
      console.error('Error stack:', verifyError.stack);
      return res.status(500).json({ 
        error: 'Server error during authentication',
        details: process.env.NODE_ENV === 'development' ? verifyError.message : undefined
      });
    }
    
    if (user && user.role === 0) {
      // User exists, password is correct, and is a passenger
      try {
        await LoginHistory.record({
          user_id: user.id,
          role: 0, // Passenger
          email: email,
          ip_address: ipAddress,
          user_agent: userAgent,
          login_status: 'success',
          failure_reason: null
        });
      } catch (historyError) {
        // Log history error but don't fail the request
        console.error('Error recording login history:', historyError);
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        }
      });
    } else {
      // User doesn't exist, password is wrong, or is not a passenger - reject login
      try {
        await LoginHistory.record({
          user_id: null,
          role: 0, // Passenger
          email: email,
          ip_address: ipAddress,
          user_agent: userAgent,
          login_status: 'failed',
          failure_reason: user && user.role === 1 ? 'Account is a driver account' : 'Invalid credentials'
        });
      } catch (historyError) {
        // Log history error but don't fail the request
        console.error('Error recording login history:', historyError);
      }
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('==================');
    res.status(500).json({ 
      error: 'Server error during login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.post('/api/users/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const emailExists = await User.emailExists(email);
    if (emailExists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = await User.create({ name, email, password, phone, role: 0 });
    const user = await User.findById(userId);

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Driver Authentication
app.post('/api/drivers/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    if (!email || !password) {
      try {
        await LoginHistory.record({
          user_id: null,
          role: 1, // Driver
          email: email || '',
          ip_address: ipAddress,
          user_agent: userAgent,
          login_status: 'failed',
          failure_reason: 'Missing credentials'
        });
      } catch (historyError) {
        console.error('Error recording login history:', historyError);
      }
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Verify password - this should return null if driver doesn't exist or password is wrong
    let driver;
    try {
      driver = await User.verifyPassword(email, password);
    } catch (verifyError) {
      console.error('Error in verifyPassword:', verifyError);
      console.error('Error stack:', verifyError.stack);
      return res.status(500).json({ 
        error: 'Server error during authentication',
        details: process.env.NODE_ENV === 'development' ? verifyError.message : undefined
      });
    }
    
    if (driver && driver.role === 1) {
      // Driver exists, password is correct, and is a driver
      try {
        await LoginHistory.record({
          user_id: driver.id,
          role: 1, // Driver
          email: email,
          ip_address: ipAddress,
          user_agent: userAgent,
          login_status: 'success',
          failure_reason: null
        });
      } catch (historyError) {
        console.error('Error recording login history:', historyError);
      }

      res.json({
        success: true,
        driver: {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          address: driver.address,
          plate_number: driver.plate_number,
          license_number: driver.license_number,
          jeepney_id: driver.jeepney_id,
          vehicle_type: driver.vehicle_type,
          vehicle_model: driver.vehicle_model,
          vehicle_color: driver.vehicle_color,
          is_verified: driver.is_verified,
          is_online: driver.is_online
        }
      });
    } else {
      // Driver doesn't exist, password is wrong, or is not a driver - reject login
      try {
        await LoginHistory.record({
          user_id: null,
          role: 1, // Driver
          email: email,
          ip_address: ipAddress,
          user_agent: userAgent,
          login_status: 'failed',
          failure_reason: driver && driver.role === 0 ? 'Account is a passenger account' : 'Invalid credentials'
        });
      } catch (historyError) {
        console.error('Error recording login history:', historyError);
      }
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Driver login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Server error during login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.post('/api/drivers/signup', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      plate_number,
      license_number,
      jeepney_id,
      vehicle_type,
      vehicle_model,
      vehicle_color
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !plate_number || !license_number) {
      return res.status(400).json({ 
        error: 'Name, email, password, phone, plate number, and license number are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const emailExists = await User.emailExists(email);
    if (emailExists) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if plate number already exists
    const plateExists = await User.plateNumberExists(plate_number);
    if (plateExists) {
      return res.status(400).json({ error: 'Plate number already registered' });
    }

    // Check if license number already exists
    const licenseExists = await User.licenseNumberExists(license_number);
    if (licenseExists) {
      return res.status(400).json({ error: 'License number already registered' });
    }

    const driverId = await User.create({
      name,
      email,
      password,
      phone,
      role: 1, // Driver
      address,
      plate_number,
      license_number,
      jeepney_id,
      vehicle_type,
      vehicle_model,
      vehicle_color
    });

    const driver = await User.findById(driverId);

    res.status(201).json({
      success: true,
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        address: driver.address,
        plate_number: driver.plate_number,
        license_number: driver.license_number,
        jeepney_id: driver.jeepney_id,
        vehicle_type: driver.vehicle_type,
        vehicle_model: driver.vehicle_model,
        vehicle_color: driver.vehicle_color
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Update driver online status
app.put('/api/drivers/:id/online-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_online } = req.body;

    const driver = await User.updateOnlineStatus(id, is_online);
    res.json({ success: true, driver });
  } catch (error) {
    res.status(500).json({ error: 'Server error updating online status' });
  }
});

// Get server stats
app.get('/api/stats', (req, res) => {
  res.json({
    activeDrivers: activeConnections.size,
    onlineJeepneys: Array.from(jeepneyStatuses.values()).filter(s => s === 'online').length,
    passengerConnections: passengerConnections.size,
    totalJeepneys: jeepneyStatuses.size
  });
});

// ==================== SAVED LOCATIONS API ====================

// Get user's saved locations
app.get('/api/saved-locations', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const locations = await SavedLocation.getByUserId(userId);
    res.json({ success: true, locations });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching saved locations' });
  }
});

// Create saved location
app.post('/api/saved-locations', async (req, res) => {
  try {
    const { user_id, name, latitude, longitude, address, type } = req.body;

    if (!user_id || !name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'User ID, name, latitude, and longitude are required' });
    }

    const locationId = await SavedLocation.create({
      user_id,
      name,
      latitude,
      longitude,
      address,
      type: type || 'custom'
    });

    const location = await SavedLocation.findById(locationId, user_id);
    res.status(201).json({ success: true, location });
  } catch (error) {
    res.status(500).json({ error: 'Server error creating saved location' });
  }
});

// Update saved location
app.put('/api/saved-locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, name, latitude, longitude, address, type } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const location = await SavedLocation.update(id, user_id, {
      name,
      latitude,
      longitude,
      address,
      type: type || 'custom'
    });

    if (!location) {
      return res.status(404).json({ error: 'Saved location not found' });
    }

    res.json({ success: true, location });
  } catch (error) {
    res.status(500).json({ error: 'Server error updating saved location' });
  }
});

// Delete saved location
app.delete('/api/saved-locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await SavedLocation.delete(id, user_id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting saved location' });
  }
});

// ==================== PASSWORD RECOVERY API ====================

// Request password reset
app.post('/api/users/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ 
        success: true, 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }

    const token = await PasswordReset.createToken(user.id);
    
    // TODO: Send email with reset link
    // For now, return token in response (remove in production)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    console.log(`Password reset link for ${email}: ${resetLink}`);
    
    res.json({ 
      success: true, 
      message: 'If an account exists with this email, a password reset link has been sent.',
      // Remove token in production - only for development
      token: process.env.NODE_ENV === 'development' ? token : undefined
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error processing password reset request' });
  }
});

// Reset password with token
app.post('/api/users/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const tokenData = await PasswordReset.findValidToken(token);
    if (!tokenData) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, tokenData.user_id]);

    // Mark token as used
    await PasswordReset.markAsUsed(token);

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error resetting password' });
  }
});


// ==================== SEAT AVAILABILITY API ====================

// Update passenger count (for drivers)
app.put('/api/drivers/:id/passenger-count', async (req, res) => {
  try {
    const { id } = req.params;
    const { current_passengers, max_capacity } = req.body;

    if (current_passengers === undefined) {
      return res.status(400).json({ error: 'Current passenger count is required' });
    }

    if (current_passengers < 0) {
      return res.status(400).json({ error: 'Passenger count cannot be negative' });
    }

    // Get driver to verify they exist and are a driver
    const driver = await User.findById(id);
    if (!driver || driver.role !== 1) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Update passenger count
    const updateFields = ['current_passengers = ?'];
    const params = [current_passengers];

    if (max_capacity !== undefined) {
      updateFields.push('max_capacity = ?');
      params.push(max_capacity);
    }

    params.push(id);

    await db.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ? AND role = 1`,
      params
    );

    const updatedDriver = await User.findById(id);
    res.json({ 
      success: true, 
      driver: {
        current_passengers: updatedDriver.current_passengers,
        max_capacity: updatedDriver.max_capacity
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error updating passenger count' });
  }
});

// Get capacity info for a jeepney
app.get('/api/jeepneys/:jeepneyId/capacity', async (req, res) => {
  try {
    const { jeepneyId } = req.params;
    
    const driver = await User.findByJeepneyId(jeepneyId);
    if (!driver) {
      return res.status(404).json({ error: 'Jeepney not found' });
    }

    res.json({
      success: true,
      capacity: {
        current_passengers: driver.current_passengers || 0,
        max_capacity: driver.max_capacity || 20,
        available_seats: (driver.max_capacity || 20) - (driver.current_passengers || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching capacity info' });
  }
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces

// Test database connection on startup
db.testConnection().then((connected) => {
  if (connected) {
    console.log('✓ Database connection successful');
    server.listen(PORT, HOST, () => {
      console.log(`✓ Server running on http://${HOST}:${PORT}`);
      console.log(`✓ WebSocket server ready on ws://${HOST}:${PORT}`);
      console.log(`✓ Health check: http://${HOST}:${PORT}/health`);
    });
  } else {
    console.error('✗ Database connection failed');
    console.error('Please check your database configuration in .env file');
    process.exit(1);
  }
}).catch((error) => {
  console.error('✗ Database connection error:', error.message);
  process.exit(1);
});

