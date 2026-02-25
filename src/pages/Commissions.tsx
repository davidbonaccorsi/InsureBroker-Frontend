import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ViewAllToggle } from '@/components/ViewAllToggle';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Commission } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, DollarSign, Check, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Commissions() {
  const { filteredCommissions, updateCommission, showAllData, setShowAllData } = useData();
  const { user, hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const isManagerOrAdmin = hasPermission(['ADMINISTRATOR', 'BROKER_MANAGER']);

  const displayedCommissions = filteredCommissions.filter((commission) => {
    const matchesSearch =
      commission.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.brokerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleMarkAsPaid = (commission: Commission) => {
    updateCommission(commission.id, {
      status: 'PAID',
      paymentDate: new Date().toISOString().split('T')[0],
    });
    toast.success('Commission marked as paid');
  };

  const totalPending = filteredCommissions
    .filter((c) => c.status === 'PENDING')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPaid = filteredCommissions
    .filter((c) => c.status === 'PAID')
    .reduce((sum, c) => sum + c.amount, 0);

  const columns = [
    {
      key: 'policyNumber',
      header: 'Policy Number',
      render: (commission: Commission) => (
        <span className="font-medium text-primary">{commission.policyNumber}</span>
      ),
    },
    { 
      key: 'brokerName', 
      header: 'Broker',
      render: (commission: Commission) => (
        <div className="flex items-center gap-2">
          <span>{commission.brokerName}</span>
          {isManagerOrAdmin && showAllData && (
            <span className="text-xs text-muted-foreground">(ID: {commission.brokerId})</span>
          )}
        </div>
      ),
    },
    {
      key: 'rate',
      header: 'Rate',
      render: (commission: Commission) => <span>{commission.rate}%</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (commission: Commission) => (
        <span className="font-semibold">{formatCurrency(commission.amount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (commission: Commission) => <StatusBadge status={commission.status} />,
    },
    {
      key: 'paymentDate',
      header: 'Payment Date',
      render: (commission: Commission) => commission.paymentDate || '-',
    },
    { key: 'createdAt', header: 'Created' },
    {
      key: 'actions',
      header: 'Actions',
      render: (commission: Commission) =>
        commission.status === 'PENDING' && isManagerOrAdmin ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkAsPaid(commission)}
            className="text-success border-success/50 hover:bg-success/10"
          >
            <Check className="w-4 h-4 mr-1" />
            Mark Paid
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="min-h-screen">
      <Header title="Commissions" subtitle="Track and manage broker commissions" />

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
                    ? 'Showing commissions from all brokers' 
                    : 'Showing only your commissions'}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Commissions</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Commissions</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Commissions</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(totalPending + totalPaid)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Role indicator */}
        {user && (
          <div className="text-sm text-muted-foreground">
            Logged in as: <span className="font-medium text-foreground">{user.firstName} {user.lastName}</span>
            {' '}({user.role === 'ADMINISTRATOR' ? 'Administrator' : user.role === 'BROKER_MANAGER' ? 'Broker Manager' : 'Broker'})
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search commissions..."
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
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={displayedCommissions}
          emptyMessage={
            filteredCommissions.length === 0 
              ? "No commissions found for your account" 
              : "No commissions match your search"
          }
        />
      </div>
    </div>
  );
}
