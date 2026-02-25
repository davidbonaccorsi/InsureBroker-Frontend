import { useState } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
import { Search, Filter, Check, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function CommissionsTab() {
  const { filteredCommissions, updateCommission } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const commissions = filteredCommissions.filter((commission) => {
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

  const totalPending = commissions
    .filter((c) => c.status === 'PENDING')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalPaid = commissions
    .filter((c) => c.status === 'PAID')
    .reduce((sum, c) => sum + c.amount, 0);

  const canMarkAsPaid = user?.role === 'ADMINISTRATOR' || user?.role === 'BROKER_MANAGER';

  const columns = [
    {
      key: 'policyNumber',
      header: 'Policy Number',
      render: (commission: Commission) => (
        <span className="font-medium text-primary">{commission.policyNumber}</span>
      ),
    },
    { key: 'brokerName', header: 'Broker' },
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
        commission.status === 'PENDING' && canMarkAsPaid ? (
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
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-xl font-bold">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{formatCurrency(totalPending + totalPaid)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
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

      <DataTable columns={columns} data={commissions} emptyMessage="No commissions found" />
    </div>
  );
}
