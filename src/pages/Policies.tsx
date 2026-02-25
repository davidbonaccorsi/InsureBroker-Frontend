import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Eye, Filter, Ban, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ViewAllToggle } from '@/components/ViewAllToggle';

export default function Policies() {
  const navigate = useNavigate();
  const { user, canCancelPolicy, isManagerOrAdmin } = usePermissions();
  const { filteredPolicies, updatePolicy, showAllData, setShowAllData, addActivityLog } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingPolicy, setViewingPolicy] = useState<InsurancePolicy | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancellingPolicy, setCancellingPolicy] = useState<InsurancePolicy | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const policies = filteredPolicies.filter((policy) => {
    const matchesSearch =
      policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.productName.toLowerCase().includes(searchTerm.toLowerCase());
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

  const handleView = (policy: InsurancePolicy) => {
    setViewingPolicy(policy);
    setIsViewDialogOpen(true);
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
    { key: 'insurerName', header: 'Insurer' },
    {
      key: 'premium',
      header: 'Premium',
      render: (policy: InsurancePolicy) => formatCurrency(policy.premium),
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
          <Button variant="ghost" size="icon" onClick={() => handleView(policy)}>
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
    <div className="min-h-screen">
      <Header title="Policies" subtitle="Manage insurance policies" />

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
                    ? 'Showing policies from all brokers' 
                    : 'Showing only your policies'}
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

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
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
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="AWAITING_PAYMENT">Awaiting Payment</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => navigate('/new-policy')} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            New Policy
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Policies</p>
            <p className="text-2xl font-bold text-foreground">{filteredPolicies.length}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-success">
              {filteredPolicies.filter(p => p.status === 'ACTIVE').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-warning">
              {filteredPolicies.filter(p => p.status === 'PENDING' || p.status === 'AWAITING_PAYMENT').length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold text-destructive">
              {filteredPolicies.filter(p => p.status === 'CANCELLED').length}
            </p>
          </div>
        </div>

        {/* Data Table */}
        <DataTable 
          columns={columns} 
          data={policies} 
          emptyMessage={
            filteredPolicies.length === 0 
              ? "No policies found for your account" 
              : "No policies match your search"
          }
        />
      </div>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Policy Details</DialogTitle>
          </DialogHeader>
          {viewingPolicy && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">
                  {viewingPolicy.policyNumber}
                </span>
                <StatusBadge status={viewingPolicy.status} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{viewingPolicy.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Broker</p>
                  <p className="font-medium">{viewingPolicy.brokerName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">{viewingPolicy.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Insurer</p>
                  <p className="font-medium">{viewingPolicy.insurerName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{viewingPolicy.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{viewingPolicy.endDate}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Premium</p>
                  <p className="font-medium text-lg">{formatCurrency(viewingPolicy.premium)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sum Insured</p>
                  <p className="font-medium text-lg">{formatCurrency(viewingPolicy.sumInsured)}</p>
                </div>
              </div>
              {viewingPolicy.paymentMethod && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium">{viewingPolicy.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <p className="font-medium">{viewingPolicy.paymentStatus}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              navigate(`/policies/${viewingPolicy?.id}`);
            }}>
              View Full Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Policy Dialog with Required Reason */}
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
              <Label htmlFor="cancel-reason">
                Cancellation Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="cancel-reason"
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
