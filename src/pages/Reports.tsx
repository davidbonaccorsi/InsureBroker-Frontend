import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ViewAllToggle } from '@/components/ViewAllToggle';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Users, FileText, DollarSign, RefreshCw, Gift } from 'lucide-react';
import ClientsTab from '@/components/reports/ClientsTab';
import PoliciesTab from '@/components/reports/PoliciesTab';
import CommissionsTab from '@/components/reports/CommissionsTab';
import RenewalsTab from '@/components/reports/RenewalsTab';
import OffersTab from '@/components/reports/OffersTab';

export default function Reports() {
  const { user } = useAuth();
  const { showAllData, setShowAllData, filteredClients, filteredPolicies, filteredCommissions, filteredRenewals, filteredOffers } = useData();
  const [activeTab, setActiveTab] = useState('clients');

  const tabs = [
    { id: 'clients', label: 'Clients', icon: Users, count: filteredClients.length },
    { id: 'policies', label: 'Policies', icon: FileText, count: filteredPolicies.length },
    { id: 'commissions', label: 'Commissions', icon: DollarSign, count: filteredCommissions.length },
    { id: 'renewals', label: 'Renewals', icon: RefreshCw, count: filteredRenewals.length },
    { id: 'offers', label: 'Offers', icon: Gift, count: filteredOffers.length },
  ];

  return (
    <div className="min-h-screen">
      <Header title="Reports" subtitle="View and manage all your data" />

      <div className="p-6 space-y-6">
        {/* Manager Toggle */}
        {(user?.role === 'BROKER_MANAGER' || user?.role === 'ADMINISTRATOR') && (
          <div className="flex justify-end">
            <ViewAllToggle showAll={showAllData} onToggle={setShowAllData} />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            {tabs.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-muted">
                  {tab.count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="clients" className="mt-6">
            <ClientsTab />
          </TabsContent>
          
          <TabsContent value="policies" className="mt-6">
            <PoliciesTab />
          </TabsContent>
          
          <TabsContent value="commissions" className="mt-6">
            <CommissionsTab />
          </TabsContent>
          
          <TabsContent value="renewals" className="mt-6">
            <RenewalsTab />
          </TabsContent>
          
          <TabsContent value="offers" className="mt-6">
            <OffersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
