import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ViewAllToggle } from '@/components/ViewAllToggle';
import { useData } from '@/contexts/DataContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Offer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Filter, ShoppingCart, Eye, FileText, Clock, Users, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function Offers() {
  const navigate = useNavigate();
  const { user, canDeleteOffer, isManagerOrAdmin } = usePermissions();
  const { filteredOffers, updateOffer, showAllData, setShowAllData, addActivityLog } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);

  // SAFE FILTERING: adaugam fallback '' in caz ca sunt null
  const offers = filteredOffers.filter((offer) => {
    const safeOfferNumber = offer.offerNumber || '';
    const safeClientName = offer.clientName || '';
    const searchLow = searchTerm.toLowerCase();

    const matchesSearch =
        safeOfferNumber.toLowerCase().includes(searchLow) ||
        safeClientName.toLowerCase().includes(searchLow);

    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount || 0); // fallback la 0
  };

  const handleDeleteClick = (offer: Offer) => {
    if (!canDeleteOffer) {
      toast.error('You do not have permission to delete offers');
      return;
    }
    setOfferToDelete(offer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!offerToDelete || !user) return;

    // In a real app, we would have a deleteOffer function
    // For now, we'll mark it as rejected (soft delete pattern)
    updateOffer(offerToDelete.id, { status: 'REJECTED' });
    addActivityLog({
      entityType: 'OFFER',
      entityId: offerToDelete.id,
      activityType: 'STATUS_CHANGED',
      description: `Offer ${offerToDelete.offerNumber || 'Unknown'} was deleted/rejected`,
      performedBy: user.id,
      performedByName: `${user.firstName} ${user.lastName}`,
    });
    toast.success('Offer deleted successfully');
    setDeleteDialogOpen(false);
    setOfferToDelete(null);
  };

  const pendingOffers = filteredOffers.filter(o => o.status === 'PENDING').length;
  const draftOffers = filteredOffers.filter(o => o.status === 'DRAFT').length;

  const columns = [
    {
      key: 'offerNumber',
      header: 'Offer Number',
      render: (offer: Offer) => (
          <span
              className="font-medium text-primary cursor-pointer hover:underline"
              onClick={() => navigate(`/offers/${offer.id}`)}
          >
          {offer.offerNumber || 'N/A'}
        </span>
      ),
    },
    {
      key: 'clientName',
      header: 'Client',
      render: (offer: Offer) => <span>{offer.clientName || 'Unknown'}</span>
    },
    {
      key: 'productName',
      header: 'Product',
      render: (offer: Offer) => <span>{offer.productName || 'Unknown'}</span>
    },
    {
      key: 'premium',
      header: 'Premium',
      render: (offer: Offer) => (
          <span className="font-semibold">{formatCurrency(offer.premium)}</span>
      ),
    },
    {
      key: 'expiresAt',
      header: 'Expires',
      render: (offer: Offer) => {
        if (!offer.expiresAt) return <span>N/A</span>;

        const isExpiringSoon = new Date(offer.expiresAt) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const isExpired = new Date(offer.expiresAt) < new Date();
        return (
            <span className={isExpired ? 'text-destructive font-medium' : isExpiringSoon ? 'text-warning font-medium' : ''}>
            {offer.expiresAt.split('T')[0]}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (offer: Offer) => <StatusBadge status={offer.status || 'PENDING'} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (offer: Offer) => <span>{offer.createdAt ? offer.createdAt.split('T')[0] : 'N/A'}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (offer: Offer) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/offers/${offer.id}`)}>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </Button>
            {offer.status === 'PENDING' && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/checkout/${offer.id}`)}
                    className="text-primary"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Checkout
                </Button>
            )}
            {canDeleteOffer && offer.status !== 'ACCEPTED' && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(offer)}
                    title="Delete Offer"
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
        <Header title="Offers" subtitle="Manage pending offers and convert to policies" />

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
                          ? 'Showing offers from all brokers'
                          : 'Showing only your offers'}
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
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Draft Offers</p>
                  <p className="text-2xl font-bold text-foreground">{draftOffers}</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Checkout</p>
                  <p className="text-2xl font-bold text-foreground">{pendingOffers}</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Offers</p>
                  <p className="text-2xl font-bold text-foreground">{filteredOffers.length}</p>
                </div>
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
                    placeholder="Search offers..."
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
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => navigate('/new-policy')} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create New Offer
            </Button>
          </div>

          {/* Data Table */}
          <DataTable
              columns={columns}
              data={offers}
              emptyMessage={
                filteredOffers.length === 0
                    ? "No offers found for your account"
                    : "No offers match your search"
              }
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Offer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete offer {offerToDelete?.offerNumber || 'Unknown'}?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setOfferToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}