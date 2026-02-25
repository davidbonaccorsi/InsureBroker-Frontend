import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { 
  PermissionService, 
  buildServiceContext, 
  ServiceContext 
} from '@/services';

/**
 * Custom hook for checking user permissions
 * Provides a unified interface for permission checks across the application
 */
export function usePermissions() {
  const { user } = useAuth();
  const { showAllData, getBrokerIdForCurrentUser } = useData();

  const context: ServiceContext | null = useMemo(() => {
    if (!user) return null;
    const brokerId = getBrokerIdForCurrentUser();
    return buildServiceContext(user, brokerId, showAllData);
  }, [user, showAllData, getBrokerIdForCurrentUser]);

  const permissions = useMemo(() => ({
    // View permissions
    canViewAllData: context ? PermissionService.canViewAllData(context) : false,
    
    // Delete permissions
    canDeleteClient: context ? PermissionService.canDeleteClient(context) : false,
    canDeleteOffer: context ? PermissionService.canDeleteOffer(context) : false,
    canDeleteRenewal: context ? PermissionService.canDeleteRenewal(context) : false,
    
    // Policy permissions - no delete, only cancel
    canCancelPolicy: context ? PermissionService.canCancelPolicy(context) : false,
    
    // Management permissions
    canManageBrokers: context ? PermissionService.canManageBrokers(context) : false,
    canManageProducts: context ? PermissionService.canManageProducts(context) : false,
    canManageInsurers: context ? PermissionService.canManageInsurers(context) : false,
    
    // Financial permissions
    canPayCommission: context ? PermissionService.canPayCommission(context) : false,
    canValidatePayment: context ? PermissionService.canValidatePayment(context) : false,
    
    // Role checks
    isAdministrator: user?.role === 'ADMINISTRATOR',
    isBrokerManager: user?.role === 'BROKER_MANAGER',
    isBroker: user?.role === 'BROKER',
    isManagerOrAdmin: user?.role === 'ADMINISTRATOR' || user?.role === 'BROKER_MANAGER',
  }), [context, user?.role]);

  return {
    ...permissions,
    context,
    user,
  };
}

export default usePermissions;
