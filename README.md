# ZenRoute - Jeepney Real-Time Monitoring & Tracking System
**Like Rush PH - Real-Time Location Tracking & ETA**

A mobile application built with Expo (React Native) that helps passengers **monitor and track jeepneys in real-time**.

## 🚀 Getting Started (For Beginners)

**New to development? Start here!**

📖 **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Start here! Complete guide to all documentation.

📘 **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete step-by-step setup instructions for beginners (includes all tools, applications, and detailed instructions).

📋 **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick reference card for daily use (print this!).

👁️ **[VISUAL_GUIDE.md](./VISUAL_GUIDE.md)** - Visual step-by-step guide showing exactly which buttons to click.

**For experienced developers, see [Setup Instructions](#setup-instructions) below.** 

**This is a MONITORING/TRACKING SYSTEM (NOT a booking system)** - it shows:
- **Where jeepneys are RIGHT NOW** (real-time location)
- **When they will arrive** to your location or destination (ETA)
- **Distance** from your location
- **Multiple jeepney comparison** (compare ETAs)

## Core Features (Monitoring & Tracking)

### For Passengers:
- **Real-time Location Tracking**: See where jeepneys are RIGHT NOW on the map
- **Live Jeepney Display**: Displays markers for all online jeepneys with real-time positions
- **Distance Calculation**: Calculates distance between you and selected jeepney
- **ETA to Your Location**: Estimates when jeepney will arrive to your current location
- **ETA to Destination**: Estimates when jeepney will arrive to your selected destination
- **Multiple Jeepney Comparison**: Compare ETAs of different jeepneys
- **Arrival Notifications**: Get notified when jeepney arrives at destination
- **Route Monitoring**: Track jeepneys along their routes in real-time

### For Drivers:
- **Automatic Location Tracking**: Location tracked automatically after login
- **Continuous Updates**: Location updates every 2 minutes automatically
- **Real-time Broadcasting**: Share your location with passengers in real-time
- **Online/Offline Status**: Control your availability

## 📚 Documentation

All project documentation is available in the [`docs/`](./docs/) directory:
- **Feature Verification**: See `docs/PAPER_FEATURES_VERIFICATION.md` for complete feature verification
- **Thesis Comparison**: See `docs/THESIS_FEATURES_COMPARISON.md` for thesis compliance
- **System Status**: See `docs/SYSTEM_FEATURES_STATUS.md` for implementation status
- **Core Features**: See `docs/FEATURE_VERIFICATION.md` for core feature details

## Project Structure

```
zenrout/
├── App.tsx                 # Main app entry point with navigation
├── docs/                   # Project documentation
│   ├── README.md          # Documentation index
│   ├── PAPER_FEATURES_VERIFICATION.md
│   ├── THESIS_FEATURES_COMPARISON.md
│   ├── FEATURE_VERIFICATION.md
│   └── SYSTEM_FEATURES_STATUS.md
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── OnlineStatusBanner.tsx
│   │   ├── DestinationSearchBar.tsx
│   │   ├── DistanceBadge.tsx
│   │   ├── ETABadge.tsx
│   │   └── JeepneyInfoModal.tsx
│   ├── screens/            # Screen components
│   │   ├── SplashScreen.tsx
│   │   ├── LandingScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── MapScreen.tsx
│   │   └── DriverDashboard.tsx
│   ├── contexts/           # React contexts for state management
│   │   ├── LocationContext.tsx
│   │   ├── JeepneyContext.tsx
│   │   ├── JeepneyLocationContext.tsx
│   │   ├── AuthContext.tsx
│   │   └── DriverContext.tsx
│   ├── services/           # Services
│   │   └── LocationBroadcastService.ts
│   ├── data/              # Route data
│   │   └── mockData.ts
│   ├── utils/             # Utility functions
│   │   ├── calculations.ts
│   │   └── filterOnlineJeepneys.ts
│   ├── hooks/             # Custom hooks
│   │   └── useNearestJeepney.ts
│   └── types/             # TypeScript type definitions
│       └── index.ts
├── package.json
├── app.json
└── tsconfig.json
```

## Setup Instructions

### Frontend (React Native App)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm start
   ```

3. **Run on Device/Emulator**
   - For Android: `npm run android`
   - For iOS: `npm run ios`
   - Scan QR code with Expo Go app on your phone

### Backend Server

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up database** (see `server/DATABASE_SETUP.md` for details)
   - Create MySQL database using `server/database/schema.sql`
   - Configure `.env` file with database credentials

4. **Start the server**
   ```bash
   npm start
   ```

The server will run on `http://localhost:3001` by default.

**Note**: The backend server must be running for real-time location tracking across devices.

## Permissions

The app requires location permissions to function properly:
- **Android**: `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` (configured in app.json)
- **iOS**: Location permissions are requested at runtime

## Route Information

The app tracks jeepneys on the **Anonas-Lagro** route in Quezon City, Philippines:
- **Anonas**: ~14.6250° N, 121.0500° E
- **Lagro**: ~14.7000° N, 121.0300° E

## Key Components

### HomeScreen
- Entry point showing nearby jeepneys on a map
- Displays online status banner
- Includes destination search bar
- Shows user location and all online jeepneys

### MapScreen
- Detailed map view with selected jeepney
- Shows distance and ETA badges
- Displays route information
- Interactive markers for all online jeepneys

### DriverDashboard
- Driver's main dashboard
- Toggle online/offline status
- View current location on map
- Real-time location sharing when online

## Authentication

### Hardcoded Logins (for testing)
- **Passenger**: `admin@zenrout.com` / `admin123`
- **Driver**: `driver@zenrout.com` / `driver123`

## State Management

- **LocationContext**: Manages user location and permission status
- **JeepneyContext**: Manages selected jeepney state
- **JeepneyLocationContext**: Manages real-time jeepney locations from drivers
- **AuthContext**: Manages passenger authentication
- **DriverContext**: Manages driver authentication and online status

## Real-time Updates

- **LocationBroadcastService**: Simulates WebSocket for real-time location updates
- Drivers broadcast their location when online
- Passengers receive real-time updates of all online jeepneys
- Location updates every 5 seconds when driver is online

## Calculations

- **Distance**: Uses Haversine formula to calculate distance between coordinates
- **ETA**: Estimates based on average jeepney speed of 25 km/h

## Technologies Used

- Expo ~54.0.31
- React Native 0.81.5
- React Navigation
- react-native-maps
- expo-location
- TypeScript

## Documentation

- **SYSTEM_FEATURES_STATUS.md** - Complete feature status and implementation details
- **server/README.md** - Backend server documentation and API reference
- **server/DATABASE_SETUP.md** - Database setup instructions

## Notes

- **Real-time Monitoring System**: This is a monitoring/tracking system (like Rush PH), NOT a booking system
- **Location Tracking**: Driver location tracking starts automatically after login and updates every 2 minutes
- **Destination Search**: Currently uses mock coordinates (can be integrated with geocoding API)
- **Route Calculation**: Supports Google Maps/Mapbox API (requires API key in `.env`)
- **WebSocket**: Real-time location updates use WebSocket for cross-device tracking
- **Backend Required**: Backend server must be running for real-time tracking across devices
