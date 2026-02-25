import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  UserCog,
  Package,
  Settings,
  Shield,
  LogOut,
  PlusCircle,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, ROLE_PERMISSIONS } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRoles?: UserRole[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'New Policy', href: '/new-policy', icon: PlusCircle },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { 
    name: 'Products', 
    href: '/products', 
    icon: Package,
    requiredRoles: ['ADMINISTRATOR'],
  },
  { 
    name: 'Insurers', 
    href: '/insurers', 
    icon: Building2,
    requiredRoles: ['ADMINISTRATOR'],
  },
  { 
    name: 'Brokers', 
    href: '/brokers', 
    icon: UserCog,
    requiredRoles: ['ADMINISTRATOR', 'BROKER_MANAGER'],
  },
];

const secondaryNavigation: NavigationItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();

  const filteredNavigation = navigation.filter(item => {
    if (!item.requiredRoles) return true;
    return hasPermission(item.requiredRoles);
  });

  const roleLabel = user ? ROLE_PERMISSIONS[user.role].label : '';
  const initials = user 
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : 'U';

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <Shield className="w-6 h-6 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-sidebar-primary-foreground">InsureBroker</h1>
          <p className="text-xs text-sidebar-muted">Management System</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="mb-2 px-3">
          <span className="text-xs font-semibold text-sidebar-muted uppercase tracking-wider">
            Main Menu
          </span>
        </div>
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          );
        })}

        <div className="pt-6 mb-2 px-3">
          <span className="text-xs font-semibold text-sidebar-muted uppercase tracking-wider">
            System
          </span>
        </div>
        {secondaryNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sm font-semibold text-sidebar-accent-foreground">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user ? `${user.firstName} ${user.lastName}` : 'User'}
            </p>
            <p className="text-xs text-sidebar-muted truncate">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
