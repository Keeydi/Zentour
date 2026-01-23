/**
 * Seed Accounts Script
 * Creates test accounts for passengers and drivers
 * Usage: node database/seed-accounts.js
 */

const User = require('./models/User');
require('dotenv').config();

// Test passenger accounts
const passengerAccounts = [
  {
    name: 'John Doe',
    email: 'passenger1@test.com',
    password: 'password123',
    phone: '+639123456789'
  },
  {
    name: 'Jane Smith',
    email: 'passenger2@test.com',
    password: 'password123',
    phone: '+639987654321'
  },
  {
    name: 'Maria Garcia',
    email: 'passenger3@test.com',
    password: 'password123',
    phone: '+639555123456'
  }
];

// Test driver accounts
const driverAccounts = [
  {
    name: 'Juan Dela Cruz',
    email: 'driver1@test.com',
    password: 'password123',
    phone: '+639111222333',
    address: '123 Main Street, Manila, Philippines',
    plate_number: 'ABC-1234',
    license_number: 'DL-2024-001',
    jeepney_id: 'JEEP-001',
    vehicle_type: 'Jeepney',
    vehicle_model: 'Sarao',
    vehicle_color: 'Blue'
  },
  {
    name: 'Pedro Santos',
    email: 'driver2@test.com',
    password: 'password123',
    phone: '+639444555666',
    address: '456 Rizal Avenue, Quezon City, Philippines',
    plate_number: 'XYZ-5678',
    license_number: 'DL-2024-002',
    jeepney_id: 'JEEP-002',
    vehicle_type: 'Jeepney',
    vehicle_model: 'Francisco Motors',
    vehicle_color: 'Red'
  },
  {
    name: 'Carlos Reyes',
    email: 'driver3@test.com',
    password: 'password123',
    phone: '+639777888999',
    address: '789 EDSA, Makati, Philippines',
    plate_number: 'DEF-9012',
    license_number: 'DL-2024-003',
    jeepney_id: 'JEEP-003',
    vehicle_type: 'Jeepney',
    vehicle_model: 'Sarao',
    vehicle_color: 'Green'
  }
];

async function seedAccounts() {
  console.log('🌱 Starting to seed accounts...\n');

  // Seed passenger accounts
  console.log('📱 Creating passenger accounts...');
  for (const account of passengerAccounts) {
    try {
      // Check if account already exists
      const existingUser = await User.findByEmail(account.email);
      if (existingUser) {
        console.log(`   ⚠️  Passenger ${account.email} already exists, updating verification status...`);
        // Update existing account to be verified
        await User.update(existingUser.id, {
          is_verified: true
        });
        console.log(`   ✅ Updated passenger: ${account.name} (${account.email}) - Verified`);
        continue;
      }

      const userId = await User.create({
        ...account,
        is_verified: true
      });
      console.log(`   ✅ Created passenger: ${account.name} (${account.email}) - ID: ${userId}`);
    } catch (error) {
      console.error(`   ❌ Error creating passenger ${account.email}:`, error.message);
    }
  }

  console.log('\n🚗 Creating driver accounts...');
  // Seed driver accounts
  for (const account of driverAccounts) {
    try {
      // Check if account already exists
      const existingDriver = await User.findByEmail(account.email);
      if (existingDriver) {
        console.log(`   ⚠️  Driver ${account.email} already exists, updating verification status...`);
        // Update existing account to be verified
        await User.update(existingDriver.id, {
          is_verified: true
        });
        console.log(`   ✅ Updated driver: ${account.name} (${account.email}) - Verified`);
        continue;
      }

      const driverId = await User.create({
        ...account,
        role: 1, // Set role to 1 (Driver)
        is_verified: true
      });
      console.log(`   ✅ Created driver: ${account.name} (${account.email}) - ID: ${driverId}`);
      console.log(`      Jeepney ID: ${account.jeepney_id}, Plate: ${account.plate_number}`);
    } catch (error) {
      console.error(`   ❌ Error creating driver ${account.email}:`, error.message);
    }
  }

  console.log('\n✨ Seeding completed!\n');
  console.log('📋 Test Accounts Summary:');
  console.log('\n📱 Passengers:');
  passengerAccounts.forEach(acc => {
    console.log(`   Email: ${acc.email} | Password: ${acc.password}`);
  });
  console.log('\n🚗 Drivers:');
  driverAccounts.forEach(acc => {
    console.log(`   Email: ${acc.email} | Password: ${acc.password} | Jeepney ID: ${acc.jeepney_id}`);
  });
  console.log('\n');
}

// Run seeding
seedAccounts()
  .then(() => {
    console.log('✅ Seed script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });

