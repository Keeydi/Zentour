import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import SplashScreen from './src/screens/SplashScreen';
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DriverLoginScreen from './src/screens/DriverLoginScreen';
import DriverSignupScreen from './src/screens/DriverSignupScreen';
import DriverDashboard from './src/screens/DriverDashboard';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import { LocationContext } from './src/contexts/LocationContext';
import { JeepneyContext } from './src/contexts/TricycleContext';
import { JeepneyLocationProvider } from './src/contexts/JeepneyLocationContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { DriverProvider, useDriver } from './src/contexts/DriverContext';

export type RootStackParamList = {
  Splash: undefined;
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  Map: undefined;
  DriverLogin: undefined;
  DriverSignup: undefined;
  DriverDashboard: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isAuthenticated: isDriverAuthenticated, isLoading: isDriverLoading, driver } = useDriver();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedJeepney, setSelectedJeepney] = useState<string | null>(null);

  useEffect(() => {
    // Only request location if authenticated (passenger or driver)
    if (!isAuthenticated && !isDriverAuthenticated) return;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied');
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);

        // Watch position updates
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            setLocation(newLocation);
          }
        );

        return () => {
          subscription.remove();
        };
      } catch (error: any) {
        // Check if it's the Info.plist error (happens in Expo Go)
        if (error?.message?.includes('NSLocation') || error?.message?.includes('Info.plist')) {
          console.warn('Location permissions not configured. This is expected in Expo Go. Location features will be limited until a development build is created.');
          setLocationError('Location permissions not available in Expo Go. Please use a development build for full location features.');
        } else {
          setLocationError('Failed to get location');
          console.error(error);
        }
      }
    })();
  }, [isAuthenticated, isDriverAuthenticated]);

  if (isLoading || isDriverLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <LocationContext.Provider value={{ location, error: locationError }}>
      <JeepneyContext.Provider value={{ selectedJeepney, setSelectedJeepney }}>
        <JeepneyLocationProvider>
          <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
            initialRouteName={
              isAuthenticated
                ? 'Home'
                : isDriverAuthenticated
                ? 'DriverDashboard'
                : 'Splash'
            }
            screenOptions={{
              headerShown: false,
            }}
            screenListeners={{
              state: (e) => {
                // Reset to Splash when app restarts
                const state = e.data.state;
                if (state && state.routes && state.routes.length > 0) {
                  const currentRoute = state.routes[state.index || 0];
                  // If navigating away from authenticated screens, don't interfere
                }
              },
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="DriverLogin" component={DriverLoginScreen} />
            <Stack.Screen name="DriverSignup" component={DriverSignupScreen} />
            <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        </JeepneyLocationProvider>
      </JeepneyContext.Provider>
      <Toast />
    </LocationContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DriverProvider>
        <AppNavigator />
      </DriverProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

