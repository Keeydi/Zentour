import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (email: string, password: string, name: string, phone?: string) => Promise<LoginResult>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false, error: 'Not initialized' }),
  signup: async () => ({ success: false, error: 'Not initialized' }),
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token on mount
    // In a real app, you would check AsyncStorage or secure storage
    const checkAuth = async () => {
      try {
        // Simulate checking for stored auth
        // In production, check AsyncStorage for token
        // For now, always start fresh (show splash)
        setUser(null);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      // Call backend API for user login
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.3:3001';
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser({
            id: data.user.id.toString(),
            email: data.user.email,
            name: data.user.name,
            phone: data.user.phone,
          });
          return { success: true };
        }
      } else {
        // Handle different error status codes
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          return { success: false, error: 'Account does not exist or password is incorrect' };
        } else if (response.status === 400) {
          return { success: false, error: errorData.error || 'Invalid request' };
        } else if (response.status === 500) {
          return { success: false, error: 'Server error. Please try again later' };
        }
        return { success: false, error: errorData.error || 'Login failed' };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      // Network error or server not reachable
      return { success: false, error: 'Cannot connect to server. Please check your connection' };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    phone?: string
  ): Promise<LoginResult> => {
    try {
      // Call backend API for user signup
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.3:3001';
      const response = await fetch(`${API_URL}/api/users/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, phone }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser({
            id: data.user.id.toString(),
            email: data.user.email,
            name: data.user.name,
            phone: data.user.phone,
          });
          return { success: true };
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400) {
          return { success: false, error: errorData.error || 'Invalid request' };
        } else if (response.status === 500) {
          return { success: false, error: 'Server error. Please try again later' };
        }
        return { success: false, error: errorData.error || 'Signup failed' };
      }
      return { success: false, error: 'Signup failed' };
    } catch (error) {
      return { success: false, error: 'Cannot connect to server. Please check your connection' };
    }
  };

  const logout = () => {
    setUser(null);
    // In real app, clear AsyncStorage and tokens
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

