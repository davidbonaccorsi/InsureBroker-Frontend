export type UserRole = 'ADMINISTRATOR' | 'BROKER_MANAGER' | 'BROKER';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  brokerId?: number; // Only for BROKER role - links to broker entity
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  brokerId?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
}

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, {
  label: string;
  description: string;
  allowedPages: string[];
  canViewAllCommissions: boolean;
  canManageBrokers: boolean;
  canManageProducts: boolean;
  canManageInsurers: boolean;
}> = {
  ADMINISTRATOR: {
    label: 'Administrator',
    description: 'Full access to all system features - treated as broker with admin privileges',
    allowedPages: ['/', '/clients', '/policies', '/products', '/insurers', '/brokers', '/commissions', '/renewals', '/settings', '/reports', '/new-policy', '/offers'],
    canViewAllCommissions: true,
    canManageBrokers: true,
    canManageProducts: true,
    canManageInsurers: true,
  },
  BROKER_MANAGER: {
    label: 'Broker Manager',
    description: 'Can manage brokers and view all commissions',
    allowedPages: ['/', '/clients', '/policies', '/brokers', '/commissions', '/renewals', '/settings', '/reports', '/new-policy', '/offers'],
    canViewAllCommissions: true,
    canManageBrokers: true,
    canManageProducts: false,
    canManageInsurers: false,
  },
  BROKER: {
    label: 'Broker',
    description: 'Can manage own clients, policies, and view own commissions',
    allowedPages: ['/', '/clients', '/policies', '/commissions', '/renewals', '/settings', '/reports', '/new-policy', '/offers'],
    canViewAllCommissions: false,
    canManageBrokers: false,
    canManageProducts: false,
    canManageInsurers: false,
  },
};
