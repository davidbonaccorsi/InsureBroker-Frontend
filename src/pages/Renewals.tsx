import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ViewAllToggle } from '@/components/ViewAllToggle';
import { useData } from '@/contexts/DataContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Renewal } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, RefreshCw, Check, X, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Renewals() {
  const { filteredRenewals, showAllData, setShowAllData } = useData();
  const { canDeleteRenewal, isManagerOrAdmin } = usePermissions();
  
  const [renewals, setRenewals] = useState<Renewal[]>(filteredRenewals);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Update renewals when filtered data changes
  const displayedRenewals = filteredRenewals.filter((renewal) => {
    const matchesSearch =
      renewal.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      renewal.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || renewal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleComplete = (renewal: Renewal) => {
    setRenewals(
      renewals.map((r) =>
        r.id === renewal.id ? { ...r, status: 'COMPLETED' as const } : r
      )
    );
    toast.success('Renewal completed successfully');
  };

  const handleDecline = (renewal: Renewal) => {
    setRenewals(
      renewals.map((r) =>
        r.id === renewal.id ? { ...r, status: 'DECLINED' as const } : r
      )
    );
    toast.success('Renewal declined');
  };

  const handleDelete = (renewal: Renewal) => {
    if (!canDeleteRenewal) {
      toast.error('You do not have permission to delete renewals');
      return;
    }
    if (confirm(`Are you sure you want to delete renewal for ${renewal.clientName}?`)) {
      setRenewals(renewals.filter(r => r.id !== renewal.id));
      toast.success('Renewal deleted successfully');
    }
  };

  const pendingCount = filteredRenewals.filter((r) => r.status === 'PENDING').length;

  const columns = [
    {
      key: 'policyNumber',
      header: 'Policy Number',
      render: (renewal: Renewal) => (
        <span className="font-medium text-primary">{renewal.policyNumber}</span>
      ),
    },
    { key: 'clientName', header: 'Client' },
    { key: 'renewalDate', header: 'Renewal Date' },
    {
      key: 'previousPremium',
      header: 'Previous Premium',
      render: (renewal: Renewal) => formatCurrency(renewal.previousPremium),
    },
    {
      key: 'newPremium',
      header: 'New Premium',
      render: (renewal: Renewal) => (
        <span className="font-semibold">{formatCurrency(renewal.newPremium)}</span>
      ),
    },
    {
      key: 'change',
      header: 'Change',
      render: (renewal: Renewal) => {
        const change = ((renewal.newPremium - renewal.previousPremium) / renewal.previousPremium) * 100;
        const isIncrease = change > 0;
        return (
          <span className={isIncrease ? 'text-destructive' : 'text-success'}>
            {isIncrease ? '+' : ''}
            {change.toFixed(1)}%
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (renewal: Renewal) => <StatusBadge status={renewal.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (renewal: Renewal) => (
        <div className="flex items-center gap-2">
          {renewal.status === 'PENDING' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleComplete(renewal)}
                className="text-success border-success/50 hover:bg-success/10"
              >
                <Check className="w-4 h-4 mr-1" />
                Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDecline(renewal)}
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
              >
                <X className="w-4 h-4 mr-1" />
                Decline
              </Button>
            </>
          )}
          {canDeleteRenewal && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(renewal)}
              title="Delete Renewal"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header title="Renewals" subtitle="Process policy renewals" />

      <div className="p-6 space-y-6">
        {/* View All Toggle for Managers */}
        {isManagerOrAdmin && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Data View Mode</p>
                <p className="text-sm text-muted-foreground">
                  {showAllData 
                    ? 'Showing renewals from all brokers' 
                    : 'Showing only your renewals'}
                </p>
              </div>
            </div>
            <ViewAllToggle 
              showAll={showAllData} 
              onToggle={setShowAllData}
              label="View All Brokers"
            />
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Renewals</p>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search renewals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="DECLINED">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data Table */}
        <DataTable 
          columns={columns} 
          data={displayedRenewals} 
          emptyMessage={
            filteredRenewals.length === 0 
              ? "No renewals found for your account" 
              : "No renewals match your search"
          }
        />
      </div>
    </div>
  );
}
