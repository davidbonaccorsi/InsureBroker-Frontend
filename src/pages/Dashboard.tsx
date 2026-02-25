import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ViewAllToggle } from '@/components/ViewAllToggle';
import { useData } from '@/contexts/DataContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  Users,
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { isManagerOrAdmin } = usePermissions();
  const {
    filteredClients,
    filteredPolicies,
    filteredCommissions,
    filteredRenewals,
    showAllData,
    setShowAllData
  } = useData();

  // 1. Numărăm DOAR polițele care sunt ACTIVE (excludem anulate, expirate sau în așteptare)
  const activePoliciesCount = filteredPolicies.filter(p => p.status === 'ACTIVE').length;

  // 2. Calculăm suma PREMIUM
  // Folosim un filtru mult mai strict:
  // - Să NU fie CANCELLED
  // - Să fie ori ACTIVE ori să aibă plata deja VALIDATED/PAID
  const rawTotalPremium = filteredPolicies
      .filter(p => {
        const isCancelled = p.status === 'CANCELLED';
        const isAwaiting = p.status === 'AWAITING_PAYMENT' || p.status === 'PENDING';
        const isActive = p.status === 'ACTIVE';
        const isPaid = p.paymentStatus === 'PAID' || p.paymentStatus === 'VALIDATED';

        // Păstrăm polița DOAR dacă nu e anulată ȘI (e activă SAU plătită)
        return !isCancelled && !isAwaiting && (isActive || isPaid);
      })
      .reduce((sum, p) => sum + (p.premium || 0), 0);

  const totalPremium = Math.floor(rawTotalPremium);

  const monthlyCommissions = filteredCommissions
      .filter(c => c.status === 'PAID')
      .reduce((sum, c) => sum + (c.amount || 0), 0);

  const pendingRenewals = filteredRenewals.filter(r => r.status === 'PENDING');

  const expiringThisMonth = filteredPolicies.filter(p => {
    if (!p.endDate || p.status !== 'ACTIVE') return false;
    const endDate = new Date(p.endDate);
    const now = new Date();
    return endDate.getMonth() === now.getMonth() && endDate.getFullYear() === now.getFullYear();
  });

  const recentPolicies = [...filteredPolicies]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 10000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
      <div className="min-h-screen">
        <Header title="Dashboard" subtitle="Welcome back! Here's an overview of your brokerage." />

        <div className="p-6 space-y-6">
          {isManagerOrAdmin && (
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Data View Mode</p>
                    <p className="text-sm text-muted-foreground">
                      {showAllData
                          ? 'Showing company-wide statistics'
                          : 'Showing only your statistics'}
                    </p>
                  </div>
                </div>
                <ViewAllToggle
                    showAll={showAllData}
                    onToggle={setShowAllData}
                    label="Show All Company Data"
                />
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
                title="Total Clients"
                value={filteredClients.length}
                icon={Users}
                change={12}
                changeLabel="this month"
            />
            <StatCard
                title="Active Policies"
                value={activePoliciesCount}
                icon={FileText}
                change={8}
                changeLabel="this month"
            />
            <StatCard
                title="Total Premium"
                value={formatCompactCurrency(totalPremium)}
                icon={DollarSign}
                change={15}
                changeLabel="vs last month"
            />
            <StatCard
                title="Monthly Commissions"
                value={formatCompactCurrency(monthlyCommissions)}
                icon={TrendingUp}
                change={5}
                changeLabel="vs last month"
            />
            <StatCard
                title="Pending Renewals"
                value={pendingRenewals.length}
                icon={Clock}
                iconColor="bg-warning/10 text-warning"
            />
            <StatCard
                title="Expiring Soon"
                value={expiringThisMonth.length}
                icon={AlertTriangle}
                iconColor="bg-destructive/10 text-destructive"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Recent Policies</h2>
                <Link to="/policies">
                  <Button variant="ghost" size="sm" className="text-primary">
                    View all
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                  <tr>
                    <th>Policy Number</th>
                    <th>Client</th>
                    <th>Product</th>
                    <th>Premium</th>
                    <th>Status</th>
                  </tr>
                  </thead>
                  <tbody>
                  {recentPolicies.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted-foreground py-8">
                          No policies found
                        </td>
                      </tr>
                  ) : (
                      recentPolicies.map((policy) => (
                          <tr key={policy.id}>
                            <td className="font-medium text-primary">{policy.policyNumber}</td>
                            <td>{policy.clientName}</td>
                            <td>{policy.productName}</td>
                            <td>{formatCurrency(policy.premium || 0)}</td>
                            <td>
                              <StatusBadge status={policy.status} />
                            </td>
                          </tr>
                      ))
                  )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Pending Renewals</h2>
                <Link to="/renewals">
                  <Button variant="ghost" size="sm" className="text-primary">
                    View all
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="p-4 space-y-4">
                {pendingRenewals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No pending renewals
                    </p>
                ) : (
                    pendingRenewals.map((renewal) => (
                        <div
                            key={renewal.id}
                            className="p-4 rounded-lg bg-muted/50 border border-border"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-foreground">{renewal.clientName}</p>
                              <p className="text-sm text-muted-foreground">{renewal.policyNumber}</p>
                            </div>
                            <StatusBadge status={renewal.status} />
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Due: {new Date(renewal.renewalDate).toLocaleDateString()}</span>
                            <span className="font-medium text-foreground">
                        {formatCurrency(renewal.newPremium || 0)}
                      </span>
                          </div>
                        </div>
                    ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/clients">
                <Button className="bg-primary hover:bg-primary/90">
                  <Users className="w-4 h-4 mr-2" />
                  Add New Client
                </Button>
              </Link>
              <Link to="/new-policy">
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Create Policy
                </Button>
              </Link>
              <Link to="/renewals">
                <Button variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  Process Renewals
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
}