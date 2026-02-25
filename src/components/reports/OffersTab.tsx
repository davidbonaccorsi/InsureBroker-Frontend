import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useData } from '@/contexts/DataContext';
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
import { Search, Filter, Eye, ShoppingCart, Gift, Clock } from 'lucide-react';

export default function OffersTab() {
  const navigate = useNavigate();
  const { filteredOffers } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const offers = filteredOffers.filter((offer) => {
    // SAFE CHECKS: Oferim un string gol ('') in caz ca backend-ul returneaza null
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
    }).format(amount || 0); // Safety check pentru amount
  };

  const pendingOffers = filteredOffers.filter(o => o.status === 'PENDING').length;
  const draftOffers = filteredOffers.filter(o => o.status === 'DRAFT').length;

  const columns = [
    {
      key: 'offerNumber',
      header: 'Offer Number',
      render: (offer: Offer) => (
          <span className="font-medium text-primary">{offer.offerNumber || 'N/A'}</span>
      ),
    },
    {
      key: 'clientName',
      header: 'Client',
      render: (offer: Offer) => <span>{offer.clientName || 'Unknown Client'}</span>
    },
    {
      key: 'productName',
      header: 'Product',
      render: (offer: Offer) => <span>{offer.productName || 'Unknown Product'}</span>
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
        return (
            <span className={isExpiringSoon ? 'text-warning font-medium' : ''}>
            {offer.expiresAt}
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
          </div>
      ),
    },
  ];

  return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex gap-4">
          <div className="bg-card rounded-lg border border-border p-4 inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Draft</p>
              <p className="text-xl font-bold">{draftOffers}</p>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-4 inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold">{pendingOffers}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
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
            </SelectContent>
          </Select>
        </div>

        <DataTable columns={columns} data={offers} emptyMessage="No offers found" />
      </div>
  );
}