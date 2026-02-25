export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  nationality?: string;
  // Romanian CNP - 13 character unique identifier
  cnp: string;
  idType?: 'ID_CARD' | 'PASSPORT' | 'DRIVERS_LICENSE';
  idNumber?: string;
  idExpiry?: string;
  gdprConsent: boolean;
  gdprConsentDate?: string;
  brokerId: number; // The broker who owns this client
  createdAt: string;
  updatedAt: string;
}

export interface Insurer {
  id: number;
  name: string;
  code: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  active: boolean;
  createdAt: string;
}

// Custom field definition for product-specific data collection
export interface ProductCustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'checkbox';
  required: boolean;
  options?: string[]; // For select type
  placeholder?: string;
  // Factor multiplier for premium calculation (e.g., 1.2 for 20% increase)
  factorMultiplier?: number;
  factorCondition?: string; // Condition to apply factor (e.g., "value > 50")
}

export interface InsuranceProduct {
  id: number;
  name: string;
  code: string;
  description: string;
  category: 'LIFE' | 'HEALTH' | 'AUTO' | 'HOME' | 'TRAVEL' | 'BUSINESS';
  insurerId: number;
  insurerName: string;
  basePremium: number;
  active: boolean;
  // Custom fields for this product type
  customFields?: ProductCustomField[];
  // Base rate for premium calculation (percentage of sum insured)
  baseRate?: number;
}

export interface Broker {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  commissionRate: number;
  hireDate: string;
  active: boolean;
  // User account fields
  userId?: number;
  role: 'BROKER' | 'BROKER_MANAGER' | 'ADMINISTRATOR';
  password?: string; // Only used for creation, not stored in state
}

export type PolicyStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING' | 'SUSPENDED' | 'AWAITING_PAYMENT' | 'AWAITING_VALIDATION';

export type OfferStatus = 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REJECTED';

export type PaymentMethod = 'CASH' | 'POS' | 'CARD_ONLINE' | 'BANK_TRANSFER' | 'BROKER_PAYMENT';

export type PaymentStatus = 'PENDING' | 'PAID' | 'VALIDATED' | 'REJECTED';

export interface PolicyPayment {
  id: number;
  policyId: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  proofOfPayment?: string; // File reference
  validatedBy?: number; // Broker manager ID
  validatedAt?: string;
  createdAt: string;
}

// Offer - created before payment, converts to Policy
export interface Offer {
  id: number;
  offerNumber: string;
  clientId: number;
  clientName: string;
  productId: number;
  productName: string;
  insurerName: string;
  brokerId: number;
  brokerName: string;
  startDate: string;
  endDate: string;
  premium: number;
  sumInsured: number;
  status: OfferStatus;
  gdprConsent: boolean;
  gdprConsentDate?: string;
  expiresAt: string; // Offer expiration date
  createdAt: string;
  updatedAt: string;
  // Custom field values for the product
  customFieldValues?: Record<string, unknown>;
}

export interface InsurancePolicy {
  id: number;
  policyNumber: string;
  offerId?: number; // Reference to original offer
  clientId: number;
  clientName: string;
  productId: number;
  productName: string;
  insurerName: string;
  brokerId: number;
  brokerName: string;
  startDate: string;
  endDate: string;
  premium: number;
  sumInsured: number;
  status: PolicyStatus;
  // Additional fields for workflow
  gdprConsent: boolean;
  gdprConsentDate?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  proofOfPayment?: string;
  validatedBy?: number;
  validatedAt?: string;
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
  // Custom field values for the product
  customFieldValues?: Record<string, unknown>;
}

export interface Commission {
  id: number;
  policyId: number;
  policyNumber: string;
  brokerId: number;
  brokerName: string;
  amount: number;
  rate: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  paymentDate: string | null;
  createdAt: string;
}

export interface Renewal {
  id: number;
  originalPolicyId: number;
  newPolicyId: number;
  policyNumber: string;
  clientName: string;
  renewalDate: string;
  previousPremium: number;
  newPremium: number;
  status: 'PENDING' | 'COMPLETED' | 'DECLINED';
  brokerId: number;
}

export interface DashboardStats {
  totalClients: number;
  activePolicies: number;
  totalPremium: number;
  pendingRenewals: number;
  monthlyCommissions: number;
  expiringThisMonth: number;
}

// Activity Log types
export type ActivityType = 
  | 'CLIENT_CREATED'
  | 'CLIENT_UPDATED'
  | 'POLICY_CREATED'
  | 'POLICY_UPDATED'
  | 'POLICY_RENEWED'
  | 'POLICY_CANCELLED'
  | 'PAYMENT_UPLOADED'
  | 'PAYMENT_VALIDATED'
  | 'PAYMENT_REJECTED'
  | 'GDPR_SIGNED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DOWNLOADED'
  | 'COMMISSION_PAID'
  | 'STATUS_CHANGED'
  | 'OFFER_CREATED'
  | 'OFFER_ACCEPTED'
  | 'OFFER_EXPIRED';

export interface ActivityLog {
  id: number;
  entityType: 'CLIENT' | 'POLICY' | 'OFFER';
  entityId: number;
  activityType: ActivityType;
  description: string;
  performedBy: number;
  performedByName: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// Notification types
export type NotificationType = 
  | 'POLICY_EXPIRING'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_VALIDATED'
  | 'RENEWAL_DUE'
  | 'COMMISSION_READY'
  | 'NEW_CLIENT'
  | 'NEW_OFFER'
  | 'OFFER_EXPIRING'
  | 'SYSTEM';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  userId: number;
  relatedEntityType?: 'CLIENT' | 'POLICY' | 'COMMISSION' | 'OFFER';
  relatedEntityId?: number;
  createdAt: string;
}

// Search result types
export interface SearchResult {
  type: 'CLIENT' | 'POLICY' | 'OFFER';
  id: number;
  title: string;
  subtitle: string;
  url: string;
}

// Document types for policy attachments
export interface PolicyDocument {
  id: number;
  policyId: number;
  name: string;
  type: 'PAYMENT_PROOF' | 'ID_DOCUMENT' | 'CONTRACT' | 'OTHER';
  fileName: string;
  fileSize: number;
  uploadedBy: number;
  uploadedByName: string;
  createdAt: string;
}

// Premium calculation request/response for backend
export interface PremiumCalculationRequest {
  productId: number;
  sumInsured: number;
  clientData: {
    cnp: string;
    dateOfBirth: string;
  };
  customFieldValues: Record<string, unknown>;
}

export interface PremiumCalculationResponse {
  premium: number;
  breakdown: {
    basePremium: number;
    factors: Array<{
      name: string;
      multiplier: number;
      reason: string;
    }>;
    finalPremium: number;
  };
}
