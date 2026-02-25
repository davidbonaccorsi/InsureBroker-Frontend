import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, LoginCredentials, AuthContextType, ROLE_PERMISSIONS } from '@/types/auth';
import { api } from '../lib/api';


const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage key for users
const USERS_STORAGE_KEY = 'insurebroker_users';

// Default admin user - always available
const DEFAULT_ADMIN: User & { password: string } = {
  id: 1,
  email: 'admin@insurebroker.com',
  password: 'admin123',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMINISTRATOR',
  active: true,
  createdAt: '2024-01-01T00:00:00Z',
};

// Initialize with default users
const getInitialUsers = (): (User & { password: string })[] => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (stored) {
    try {
      const parsedUsers = JSON.parse(stored);
      // Ensure admin is always present
      const hasAdmin = parsedUsers.some((u: User) => u.email === DEFAULT_ADMIN.email);
      if (!hasAdmin) {
        return [DEFAULT_ADMIN, ...parsedUsers];
      }
      return parsedUsers;
    } catch {
      return [DEFAULT_ADMIN];
    }
  }
  return [DEFAULT_ADMIN];
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// Export function to add users from Brokers page
export function addBrokerUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  brokerId: number;
}): User {
  const users = getInitialUsers();
  const newId = Math.max(...users.map(u => u.id), 0) + 1;

  const newUser: User & { password: string } = {
    id: newId,
    email: userData.email,
    password: userData.password,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
    brokerId: userData.brokerId,
    active: true,
    createdAt: new Date().toISOString(),
  };

  // Check if user already exists
  const existingIndex = users.findIndex(u => u.email === userData.email);
  if (existingIndex >= 0) {
    users[existingIndex] = newUser;
  } else {
    users.push(newUser);
  }

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

// Export function to update user
export function updateBrokerUser(email: string, userData: Partial<User & { password: string }>): void {
  const users = getInitialUsers();
  const index = users.findIndex(u => u.email === email);

  if (index >= 0) {
    users[index] = { ...users[index], ...userData };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
}

// Export function to deactivate user
export function deactivateBrokerUser(email: string): void {
  const users = getInitialUsers();
  const index = users.findIndex(u => u.email === email);

  if (index >= 0 && users[index].email !== DEFAULT_ADMIN.email) {
    users[index].active = false;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }
}

// Export function to get all users (for checking existing emails)
export function getAllUsers(): User[] {
  return getInitialUsers().map(u => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = u;
    return userWithoutPassword;
  });
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);

    try {
      // 1. Hit the real Spring Boot API
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;

      if (!user.active) {
        throw new Error('Account is deactivated');
      }

      // 2. Update React State
      setUser(user);
      setToken(token);

      // 3. Keep the exact LocalStorage keys your app expects!
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));

    } catch (error: any) {
      // Catch bad passwords from Spring Boot
      const errorMessage = error.response?.data?.message || 'Invalid email or password';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }, []);

  const hasPermission = useCallback((allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  }, [user]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { ROLE_PERMISSIONS };
