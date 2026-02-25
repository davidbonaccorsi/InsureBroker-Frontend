import { useState } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useData } from '@/contexts/DataContext';
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
import { Search, Filter, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function RenewalsTab() {
  const { filteredRenewals } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const renewals = filteredRenewals.filter((renewal) => {
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
    toast.success(`Renewal ${renewal.policyNumber} completed`);
  };

  const handleDecline = (renewal: Renewal) => {
    toast.info(`Renewal ${renewal.policyNumber} declined`);
  };

  const pendingCount = renewals.filter(r => r.status === 'PENDING').length;

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
      key: 'status',
      header: 'Status',
      render: (renewal: Renewal) => <StatusBadge status={renewal.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (renewal: Renewal) =>
        renewal.status === 'PENDING' ? (
          <div className="flex items-center gap-2">
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
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-card rounded-lg border border-border p-4 inline-flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-warning" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Pending Renewals</p>
          <p className="text-xl font-bold">{pendingCount}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
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

      <DataTable columns={columns} data={renewals} emptyMessage="No renewals found" />
    </div>
  );
}
