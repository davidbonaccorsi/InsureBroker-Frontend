/**
 * Service Layer for RBAC-based Data Filtering
 * 
 * This service layer simulates secure backend responses by filtering data
 * based on user roles and permissions. When connecting to the Java backend,
 * these service calls will be replaced with actual API calls.
 * 
 * Role-Based Access:
 * - ADMINISTRATOR: Full access to all data, treated as a broker with admin privileges
 * - BROKER_MANAGER: Can toggle between own data and all data
 * - BROKER: Can only see their own clients, policies, offers, commissions, renewals
 * 
 * Permission Rules:
 * - Delete operations: BROKER_MANAGER and ADMINISTRATOR only
 * - Policy cancellation: BROKER_MANAGER and ADMINISTRATOR only (soft delete)
 * - Commission payment: BROKER_MANAGER and ADMINISTRATOR only
 */

import { UserRole } from '@/types/auth';
import { 
  Client, 
  InsurancePolicy, 
  Commission, 
  Renewal, 
  Offer,
  InsuranceProduct,
  PremiumCalculationRequest,
  PremiumCalculationResponse
} from '@/types';

export interface ServiceContext {
  userId: number;
  userRole: UserRole;
  brokerId: number | null;
  showAllData: boolean;
}

// Permission checker utilities
export const PermissionService = {
  canViewAllData: (context: ServiceContext): boolean => {
    if (context.userRole === 'ADMINISTRATOR') return true;
    if (context.userRole === 'BROKER_MANAGER' && context.showAllData) return true;
    return false;
  },

  canDeleteClient: (context: ServiceContext): boolean => {
    return context.userRole === 'ADMINISTRATOR' || context.userRole === 'BROKER_MANAGER';
  },

  canDeleteOffer: (context: ServiceContext): boolean => {
    return context.userRole === 'ADMINISTRATOR' || context.userRole === 'BROKER_MANAGER';
  },

  canDeleteRenewal: (context: ServiceContext): boolean => {
    return context.userRole === 'ADMINISTRATOR' || context.userRole === 'BROKER_MANAGER';
  },

  // Policies cannot be deleted - only cancelled (soft delete)
  canCancelPolicy: (context: ServiceContext): boolean => {
    return context.userRole === 'ADMINISTRATOR' || context.userRole === 'BROKER_MANAGER';
  },

  canManageBrokers: (context: ServiceContext): boolean => {
    return context.userRole === 'ADMINISTRATOR' || context.userRole === 'BROKER_MANAGER';
  },

  canManageProducts: (context: ServiceContext): boolean => {
    return context.userRole === 'ADMINISTRATOR';
  },

  canManageInsurers: (context: ServiceContext): boolean => {
    return context.userRole === 'ADMINISTRATOR';
  },

  canPayCommission: (context: ServiceContext): boolean => {
    return context.userRole === 'ADMINISTRATOR' || context.userRole === 'BROKER_MANAGER';
  },

  canValidatePayment: (context: ServiceContext): boolean => {
    return context.userRole === 'ADMINISTRATOR' || context.userRole === 'BROKER_MANAGER';
  },
};

// Data filtering service - simulates backend filtering
export const DataFilterService = {
  filterClients: (clients: Client[], context: ServiceContext): Client[] => {
    if (PermissionService.canViewAllData(context)) return clients;
    if (context.brokerId === null) return clients;
    return clients.filter(c => c.brokerId === context.brokerId);
  },

  filterPolicies: (policies: InsurancePolicy[], context: ServiceContext): InsurancePolicy[] => {
    if (PermissionService.canViewAllData(context)) return policies;
    if (context.brokerId === null) return policies;
    return policies.filter(p => p.brokerId === context.brokerId);
  },

  filterCommissions: (commissions: Commission[], context: ServiceContext): Commission[] => {
    if (PermissionService.canViewAllData(context)) return commissions;
    if (context.brokerId === null) return commissions;
    return commissions.filter(c => c.brokerId === context.brokerId);
  },

  filterRenewals: (renewals: Renewal[], context: ServiceContext): Renewal[] => {
    if (PermissionService.canViewAllData(context)) return renewals;
    if (context.brokerId === null) return renewals;
    return renewals.filter(r => r.brokerId === context.brokerId);
  },

  filterOffers: (offers: Offer[], context: ServiceContext): Offer[] => {
    if (PermissionService.canViewAllData(context)) return offers;
    if (context.brokerId === null) return offers;
    return offers.filter(o => o.brokerId === context.brokerId);
  },
};

// Premium Calculation Service - will call Java backend
export const PremiumCalculationService = {
  /**
   * Calculate premium for an insurance product
   * This will be replaced with an actual API call to the Java backend
   * 
   * Backend Endpoint: POST /api/v1/premium/calculate
   */
  calculatePremium: async (
    request: PremiumCalculationRequest,
    product: InsuranceProduct
  ): Promise<PremiumCalculationResponse> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const baseRate = product.baseRate || 0.02;
    let basePremium = request.sumInsured * baseRate;
    
    const factors: Array<{ name: string; multiplier: number; reason: string }> = [];

    // Apply custom field factors
    if (product.customFields && request.customFieldValues) {
      product.customFields.forEach(field => {
        if (field.factorMultiplier && field.factorCondition) {
          const value = request.customFieldValues[field.name];
          let shouldApply = false;

          try {
            // Safely evaluate the condition
            if (field.factorCondition.includes('===')) {
              const [, expectedValue] = field.factorCondition.split('===').map(s => s.trim());
              if (expectedValue === 'true') {
                shouldApply = value === true;
              } else if (expectedValue === 'false') {
                shouldApply = value === false;
              } else {
                shouldApply = String(value) === expectedValue.replace(/['"]/g, '');
              }
            } else if (field.factorCondition.includes('<')) {
              const threshold = parseInt(field.factorCondition.split('<')[1].trim());
              shouldApply = Number(value) < threshold;
            } else if (field.factorCondition.includes('>')) {
              const threshold = parseInt(field.factorCondition.split('>')[1].trim());
              shouldApply = Number(value) > threshold;
            }
          } catch {
            // Skip factor if condition evaluation fails
          }

          if (shouldApply) {
            factors.push({
              name: field.label,
              multiplier: field.factorMultiplier,
              reason: `Factor applied for ${field.label}`,
            });
          }
        }
      });
    }

    // Apply age factor based on CNP
    const birthYear = parseInt(request.clientData.cnp.substring(1, 3));
    const century = request.clientData.cnp.charAt(0) === '1' || request.clientData.cnp.charAt(0) === '2' ? 1900 : 2000;
    const age = new Date().getFullYear() - (century + birthYear);

    if (age > 60) {
      factors.push({
        name: 'Age Factor',
        multiplier: 1.25,
        reason: 'Client is over 60 years old',
      });
    } else if (age < 25) {
      factors.push({
        name: 'Young Driver Factor',
        multiplier: 1.15,
        reason: 'Client is under 25 years old',
      });
    }

    // Calculate final premium
    let finalPremium = basePremium;
    factors.forEach(factor => {
      finalPremium *= factor.multiplier;
    });

    return {
      premium: Math.round(finalPremium * 100) / 100,
      breakdown: {
        basePremium: Math.round(basePremium * 100) / 100,
        factors,
        finalPremium: Math.round(finalPremium * 100) / 100,
      },
    };
  },
};

// Policy Status Service - handles soft deletes and status changes
export const PolicyStatusService = {
  /**
   * Cancel a policy (soft delete)
   * Sets status to CANCELLED and logs the action
   */
  cancelPolicy: (
    policyId: number,
    reason: string,
    context: ServiceContext
  ): { success: boolean; error?: string } => {
    if (!PermissionService.canCancelPolicy(context)) {
      return { success: false, error: 'You do not have permission to cancel policies' };
    }
    // The actual update will be handled by the DataContext
    // This validates permissions only
    return { success: true };
  },

  /**
   * Suspend a policy
   * Sets status to SUSPENDED
   */
  suspendPolicy: (
    policyId: number,
    context: ServiceContext
  ): { success: boolean; error?: string } => {
    if (!PermissionService.canCancelPolicy(context)) {
      return { success: false, error: 'You do not have permission to suspend policies' };
    }
    return { success: true };
  },
};

// Export a hook-friendly context builder
export function buildServiceContext(
  user: { id: number; role: UserRole } | null,
  brokerId: number | null,
  showAllData: boolean
): ServiceContext | null {
  if (!user) return null;
  
  return {
    userId: user.id,
    userRole: user.role,
    brokerId,
    showAllData,
  };
}
