import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, ChevronDown, LogOut, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { SearchResult } from '@/types';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { filteredClients, filteredPolicies, getUserNotifications, markNotificationRead } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const notifications = getUserNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];
    
    // Search clients
    filteredClients.forEach(client => {
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      const matches = 
        fullName.includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.phone.includes(query);
      
      if (matches) {
        results.push({
          type: 'CLIENT',
          id: client.id,
          title: `${client.firstName} ${client.lastName}`,
          subtitle: `${client.email} • ${client.phone}`,
          url: `/clients/${client.id}`,
        });
      }
    });
    
    // Search policies
    filteredPolicies.forEach(policy => {
      const matches = 
        policy.policyNumber.toLowerCase().includes(query) ||
        policy.clientName.toLowerCase().includes(query) ||
        policy.productName.toLowerCase().includes(query);
      
      if (matches) {
        results.push({
          type: 'POLICY',
          id: policy.id,
          title: policy.policyNumber,
          subtitle: `${policy.clientName} • ${policy.productName}`,
          url: `/policies/${policy.id}`,
        });
      }
    });
    
    return results.slice(0, 10);
  }, [searchQuery, filteredClients, filteredPolicies]);
  
  const handleSearchSelect = (result: SearchResult) => {
    navigate(result.url);
    setSearchQuery('');
    setIsSearchOpen(false);
  };
  
  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markNotificationRead(notification.id);
    
    if (notification.relatedEntityType && notification.relatedEntityId) {
      const url = notification.relatedEntityType === 'CLIENT' 
        ? `/clients/${notification.relatedEntityId}`
        : notification.relatedEntityType === 'POLICY'
        ? `/policies/${notification.relatedEntityId}`
        : null;
      
      if (url) {
        navigate(url);
        setIsNotificationsOpen(false);
      }
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients, policies..."
              className="w-72 pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(e.target.value.length >= 2);
              }}
              onFocus={() => searchQuery.length >= 2 && setIsSearchOpen(true)}
            />
            
            {/* Search Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50">
                <ScrollArea className="max-h-80">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      className="w-full px-4 py-3 text-left hover:bg-muted/50 border-b border-border last:border-0 transition-colors"
                      onClick={() => handleSearchSelect(result)}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded",
                          result.type === 'CLIENT' ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent-foreground"
                        )}>
                          {result.type}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{result.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </ScrollArea>
              </div>
            )}
            
            {isSearchOpen && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 p-4 text-center text-muted-foreground">
                No results found
              </div>
            )}
          </div>
          
          {/* Click outside to close search */}
          {isSearchOpen && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsSearchOpen(false)}
            />
          )}

          {/* Notifications */}
          <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setIsNotificationsOpen(true)}
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive rounded-full text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {unreadCount} unread
                    </span>
                  )}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-96">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        className={cn(
                          "w-full p-3 text-left rounded-lg transition-colors",
                          notification.read ? "bg-background" : "bg-primary/5",
                          "hover:bg-muted/50"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                            notification.read ? "bg-muted" : "bg-primary"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground">
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationRead(notification.id);
                              }}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary-foreground">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <span className="hidden md:inline text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="font-medium text-sm">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-primary mt-1 font-medium">{user?.role.replace('_', ' ')}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
