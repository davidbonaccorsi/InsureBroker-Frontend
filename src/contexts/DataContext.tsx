import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';
import {
  Client,
  InsurancePolicy,
  Commission,
  Renewal,
  ActivityLog,
  Notification,
  Offer,
  PaymentMethod
} from '@/types';

interface DataContextType {
  // Data
  clients: Client[];
  policies: InsurancePolicy[];
  commissions: Commission[];
  renewals: Renewal[];
  activityLogs: ActivityLog[];
  notifications: Notification[];
  offers: Offer[];

  // View toggle for managers
  showAllData: boolean;
  setShowAllData: (show: boolean) => void;

  // Filtered data based on user role
  filteredClients: Client[];
  filteredPolicies: InsurancePolicy[];
  filteredCommissions: Commission[];
  filteredRenewals: Renewal[];
  filteredOffers: Offer[];

  // CRUD operations
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client | undefined>;
  updateClient: (id: number, client: Partial<Client>) => void;
  deleteClient: (id: number) => void;

  addPolicy: (policy: Omit<InsurancePolicy, 'id' | 'createdAt' | 'updatedAt' | 'policyNumber'>) => Promise<InsurancePolicy | undefined>;
  updatePolicy: (id: number, policy: Partial<InsurancePolicy>) => Promise<void>;
  deletePolicy: (id: number) => void;

  // Offer operations
  addOffer: (offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt' | 'offerNumber'>) => Promise<Offer | undefined>;
  updateOffer: (id: number, offer: Partial<Offer>) => void;
  convertOfferToPolicy: (offerId: number, paymentMethod: PaymentMethod, proofOfPayment?: string) => Promise<InsurancePolicy | null>;

  addActivityLog: (log: Omit<ActivityLog, 'id' | 'createdAt'>) => Promise<void>;
  getActivitiesForEntity: (entityType: 'CLIENT' | 'POLICY' | 'OFFER', entityId: number) => ActivityLog[];

  markNotificationRead: (id: number) => void;
  getUserNotifications: () => Notification[];

  // Commission operations
  updateCommission: (id: number, commission: Partial<Commission>) => void;

  // Broker lookup
  getBrokerIdForCurrentUser: () => number | null;

  uploadPaymentProof: (policyId: number, file: File) => Promise<void>;
  downloadPaymentProof: (policyId: number, fileName: string) => Promise<void>;
  downloadPolicyPdf: (policyId: number, policyNumber: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Start with empty arrays for data that comes from the backend
  const [clients, setClients] = useState<Client[]>([]);
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [showAllData, setShowAllData] = useState(false);

// FETCH REAL DATA ON LOAD
  useEffect(() => {
    if (!user) return;

    const fetchAllData = async () => {
      try {
        const queryParam = `?showAll=${showAllData}`;
        const [
          clientsRes,
          policiesRes,
          offersRes,
          logsRes,
          commissionsRes,   // <--- ADD THIS
          renewalsRes,      // <--- ADD THIS
          notificationsRes  // <--- ADD THIS
        ] = await Promise.all([
          api.get(`/clients${queryParam}`),
          api.get(`/policies${queryParam}`),
          api.get(`/offers${queryParam}`),
          api.get(`/activity-logs${queryParam}`),
          api.get(`/commissions${queryParam}`),  // <--- ADD THIS
          api.get(`/renewals${queryParam}`),     // <--- ADD THIS
          api.get(`/notifications`)              // <--- ADD THIS (No query param needed)
        ]);

        setClients(clientsRes.data);
        setPolicies(policiesRes.data);
        setOffers(offersRes.data);
        setActivityLogs(logsRes.data);
        setCommissions(commissionsRes.data);     // <--- ADD THIS
        setRenewals(renewalsRes.data);           // <--- ADD THIS
        setNotifications(notificationsRes.data); // <--- ADD THIS
      } catch (error) {
        console.error("Failed to load data from backend:", error);
      }
    };

    fetchAllData();
  }, [user, showAllData]);

  const getBrokerIdForCurrentUser = useCallback(() => {
    if (!user) return null;
    // Real broker ID comes directly from our JWT!
    return user.brokerId || null;
  }, [user]);

  const canSeeAllData = useMemo(() => {
    if (!user) return false;
    if (user.role === 'ADMINISTRATOR') return true;
    if (user.role === 'BROKER_MANAGER' && showAllData) return true;
    return false;
  }, [user, showAllData]);

  const filteredClients = useMemo(() => {
    if (canSeeAllData) return clients;
    const brokerId = getBrokerIdForCurrentUser();
    if (brokerId === null) return clients;
    return clients.filter(c => c.brokerId === brokerId);
  }, [clients, canSeeAllData, getBrokerIdForCurrentUser]);

  const filteredPolicies = useMemo(() => {
    if (canSeeAllData) return policies;
    const brokerId = getBrokerIdForCurrentUser();
    if (brokerId === null) return policies;
    return policies.filter(p => p.brokerId === brokerId);
  }, [policies, canSeeAllData, getBrokerIdForCurrentUser]);

  const filteredCommissions = useMemo(() => {
    if (canSeeAllData) return commissions;
    const brokerId = getBrokerIdForCurrentUser();
    if (brokerId === null) return commissions;
    return commissions.filter(c => c.brokerId === brokerId);
  }, [commissions, canSeeAllData, getBrokerIdForCurrentUser]);

  const filteredRenewals = useMemo(() => {
    if (canSeeAllData) return renewals;
    const brokerId = getBrokerIdForCurrentUser();
    if (brokerId === null) return renewals;
    return renewals.filter(r => r.brokerId === brokerId);
  }, [renewals, canSeeAllData, getBrokerIdForCurrentUser]);

  const filteredOffers = useMemo(() => {
    if (canSeeAllData) return offers;
    const brokerId = getBrokerIdForCurrentUser();
    if (brokerId === null) return offers;
    return offers.filter(o => o.brokerId === brokerId);
  }, [offers, canSeeAllData, getBrokerIdForCurrentUser]);

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await api.post('/clients', clientData);
      const newClient = response.data;
      setClients(prev => [...prev, newClient]);
      return newClient;
    } catch (error) {
      console.error("Failed to add client", error);
      throw error;
    }
  }, []);

  const updateClient = useCallback((id: number, clientData: Partial<Client>) => {
    setClients(prev => prev.map(c =>
        c.id === id
            ? { ...c, ...clientData, updatedAt: new Date().toISOString().split('T')[0] }
            : c
    ));
  }, []);

  const deleteClient = useCallback((id: number) => {
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  const addPolicy = useCallback(async (policyData: Omit<InsurancePolicy, 'id' | 'createdAt' | 'updatedAt' | 'policyNumber'>) => {
    try {
      // Direct policy addition isn't fully supported without an offer ID, but we keep the structure
      const newId = Math.max(...policies.map(p => p.id), 0) + 1;
      const policyNumber = `POL-${new Date().getFullYear()}-${String(newId).padStart(5, '0')}`;
      const newPolicy: InsurancePolicy = {
        ...policyData,
        id: newId,
        policyNumber,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      setPolicies(prev => [...prev, newPolicy]);
      return newPolicy;
    } catch (error) {
      console.error("Failed to add policy", error);
    }
  }, [policies]);

  const updatePolicy = useCallback(async (id: number, policyData: Partial<InsurancePolicy>) => {
    try {
      if (policyData.status === 'CANCELLED' && policyData.cancellationReason) {
        // Dacă e CANCEL: trimite la endpoint-ul vechi de Cancel
        const response = await api.post(`/policies/${id}/cancel`, {
          cancellationReason: policyData.cancellationReason
        });
        setPolicies(prev => prev.map(p => p.id === id ? response.data : p));
      } else {
        // PENTRU TOATE CELELALTE (Validate, Reject, Upload): Trimite PATCH la Backend!
        const response = await api.patch(`/policies/${id}`, policyData);
        setPolicies(prev => prev.map(p => p.id === id ? response.data : p));
      }
    } catch (error) {
      console.error("Failed to update policy", error);
      throw error;
    }
  }, []);

  const uploadPaymentProof = useCallback(async (policyId: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // axios știe automat să trimită ca multipart/form-data când folosești FormData
      const response = await api.post(`/policies/${policyId}/upload-proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Actualizăm starea locală cu răspunsul primit de la backend (care are statusul updatat)
      setPolicies(prev => prev.map(p => p.id === policyId ? response.data : p));
    } catch (error) {
      console.error("Failed to upload proof", error);
      throw error;
    }
  }, []);

  const downloadPaymentProof = useCallback(async (policyId: number, fileName: string) => {
    try {
      const response = await api.get(`/policies/${policyId}/download-proof`, {
        responseType: 'blob', // Foarte important pentru fisiere (poze/pdf)
      });

      // Creăm un link invizibil și forțăm browserul să descarce fișierul
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Failed to download file", error);
      throw error;
    }
  }, []);

  const downloadPolicyPdf = useCallback(async (policyId: number, policyNumber: string) => {
    try {
      const response = await api.get(`/policies/${policyId}/pdf`, {
        responseType: 'blob', // Asteptam un fisier
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Policy_${policyNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Failed to generate PDF", error);
      throw error;
    }
  }, []);

  const deletePolicy = useCallback((id: number) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
  }, []);

  const addOffer = useCallback(async (offerData: Omit<Offer, 'id' | 'createdAt' | 'updatedAt' | 'offerNumber'>) => {
    try {
      const response = await api.post('/offers', offerData);
      setOffers(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error("Failed to create offer", error);
      throw error; // This allows NewPolicy.tsx to catch and display the error
    }
  }, []);

  const updateOffer = useCallback((id: number, offerData: Partial<Offer>) => {
    setOffers(prev => prev.map(o =>
        o.id === id
            ? { ...o, ...offerData, updatedAt: new Date().toISOString().split('T')[0] }
            : o
    ));
  }, []);

  const convertOfferToPolicy = useCallback(async (offerId: number, paymentMethod: PaymentMethod, proofOfPayment?: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return null;

    try {
      const response = await api.post('/policies', {
        offerId: offer.id,
        // Trimitem datele din ofertă sau fallback pe data de azi
        startDate: offer.startDate || new Date().toISOString().split('T')[0],
        endDate: offer.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        // ACEASTA ESTE LINIA CARE LIPSEA:
        paymentMethod: paymentMethod,
        proofOfPayment: proofOfPayment
      });

      const newPolicy = response.data;
      setPolicies(prev => [...prev, newPolicy]);

      // Mark offer as accepted locally
      updateOffer(offerId, { status: 'ACCEPTED' });

      return newPolicy;
    } catch (error) {
      console.error("Failed to convert offer to policy", error);
      throw error; // Aruncăm eroarea ca să o prindă interfața grafică cu toast
    }
  }, [offers, updateOffer]);

  const addActivityLog = useCallback(async (logData: Omit<ActivityLog, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      const response = await api.post('/activity-logs', {
        ...logData,
        performedBy: user.id,
        performedByName: `${user.firstName} ${user.lastName}`
      });
      setActivityLogs(prev => [response.data, ...prev]);
    } catch (error) {
      console.error("Failed to log activity", error);
    }
  }, [user]);

  const getActivitiesForEntity = useCallback((entityType: 'CLIENT' | 'POLICY' | 'OFFER', entityId: number) => {
    return activityLogs
        .filter(log => log.entityType === entityType && log.entityId === entityId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activityLogs]);

  const markNotificationRead = useCallback(async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n =>
          n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  }, []);

  const getUserNotifications = useCallback(() => {
    if (!user) return [];

    // For admin, show all notifications
    if (user.role === 'ADMINISTRATOR') {
      return notifications.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const brokerId = getBrokerIdForCurrentUser();

    return notifications
        .filter(n => n.userId === user.id) // Simplified for the real system
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, user, getBrokerIdForCurrentUser]);

  const updateCommission = useCallback((id: number, commissionData: Partial<Commission>) => {
    setCommissions(prev => prev.map(c =>
        c.id === id ? { ...c, ...commissionData } : c
    ));
  }, []);

  const value: DataContextType = {
    clients,
    policies,
    commissions,
    renewals,
    activityLogs,
    notifications,
    offers,
    showAllData,
    setShowAllData,
    filteredClients,
    filteredPolicies,
    filteredCommissions,
    filteredRenewals,
    filteredOffers,
    addClient,
    updateClient,
    deleteClient,
    addPolicy,
    updatePolicy,
    deletePolicy,
    addOffer,
    updateOffer,
    convertOfferToPolicy,
    addActivityLog,
    getActivitiesForEntity,
    markNotificationRead,
    getUserNotifications,
    updateCommission,
    getBrokerIdForCurrentUser,
    uploadPaymentProof,
    downloadPaymentProof,
    downloadPolicyPdf,
  };

  return (
      <DataContext.Provider value={value}>
        {children}
      </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}