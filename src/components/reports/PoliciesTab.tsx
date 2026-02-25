import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useData } from '@/contexts/DataContext';
import { usePermissions } from '@/hooks/usePermissions';
import { InsurancePolicy } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, Filter, Eye, Ban } from 'lucide-react';
import { toast } from 'sonner';

export default function PoliciesTab() {
  const navigate = useNavigate();
  const { filteredPolicies, updatePolicy, addActivityLog } = useData();
  const { user, canCancelPolicy } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancellingPolicy, setCancellingPolicy] = useState<InsurancePolicy | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const policies = filteredPolicies.filter((policy) => {
    const matchesSearch =
      policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCancelClick = (policy: InsurancePolicy) => {
    if (!canCancelPolicy) {
      toast.error('You do not have permission to cancel policies');
      return;
    }
    if (policy.status === 'CANCELLED' || policy.status === 'EXPIRED') {
      toast.error('This policy is already cancelled or expired');
      return;
    }
    setCancellingPolicy(policy);
    setCancellationReason('');
    setIsCancelDialogOpen(true);
  };

  const handleCancelPolicy = () => {
    if (!cancellingPolicy || !user || !cancellationReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    updatePolicy(cancellingPolicy.id, { status: 'CANCELLED' });
    addActivityLog({
      entityType: 'POLICY',
      entityId: cancellingPolicy.id,
      activityType: 'POLICY_CANCELLED',
      description: `Policy ${cancellingPolicy.policyNumber} was cancelled. Reason: ${cancellationReason.trim()}`,
      performedBy: user.id,
      performedByName: `${user.firstName} ${user.lastName}`,
      metadata: { reason: cancellationReason.trim() },
    });
    toast.success(`Policy ${cancellingPolicy.policyNumber} has been cancelled`, {
      description: 'The cancellation has been logged in the activity timeline.',
    });
    setIsCancelDialogOpen(false);
    setCancellingPolicy(null);
    setCancellationReason('');
  };

  const columns = [
    {
      key: 'policyNumber',
      header: 'Policy Number',
      render: (policy: InsurancePolicy) => (
        <span
          className="font-medium text-primary cursor-pointer hover:underline"
          onClick={() => navigate(`/policies/${policy.id}`)}
        >
          {policy.policyNumber}
        </span>
      ),
    },
    { key: 'clientName', header: 'Client' },
    { key: 'productName', header: 'Product' },
    {
      key: 'premium',
      header: 'Premium',
      render: (policy: InsurancePolicy) => (
        <span className="font-semibold">{formatCurrency(policy.premium)}</span>
      ),
    },
    { key: 'startDate', header: 'Start Date' },
    { key: 'endDate', header: 'End Date' },
    {
      key: 'status',
      header: 'Status',
      render: (policy: InsurancePolicy) => <StatusBadge status={policy.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (policy: InsurancePolicy) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/policies/${policy.id}`)}>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </Button>
          {canCancelPolicy && policy.status !== 'CANCELLED' && policy.status !== 'EXPIRED' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCancelClick(policy)}
              title="Cancel Policy"
            >
              <Ban className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search policies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="AWAITING_PAYMENT">Awaiting Payment</SelectItem>
            <SelectItem value="AWAITING_VALIDATION">Awaiting Validation</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={policies} emptyMessage="No policies found" />

      {/* Cancel Policy Dialog with Reason */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Cancel Policy</DialogTitle>
            <DialogDescription>
              You are about to cancel policy <strong>{cancellingPolicy?.policyNumber}</strong>.
              This action will set the policy status to CANCELLED and cannot be undone.
              The policy record will be preserved for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancellation-reason">
                Cancellation Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="cancellation-reason"
                placeholder="Please provide a reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelDialogOpen(false);
                setCancellingPolicy(null);
                setCancellationReason('');
              }}
            >
              Keep Policy
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelPolicy}
              disabled={!cancellationReason.trim()}
            >
              Cancel Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
