import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { useData } from '@/contexts/DataContext';
import { usePermissions } from '@/hooks/usePermissions';
import { mockProducts, mockClients, mockBrokers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import {
  ArrowLeft,
  ShoppingCart,
  User,
  FileText,
  Calendar,
  DollarSign,
  Shield,
  Building2,
  Clock,
  XCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function OfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isManagerOrAdmin } = usePermissions();
  const { offers, filteredOffers, getActivitiesForEntity, updateOffer, addActivityLog } = useData();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  
  const offerId = parseInt(id || '0');
  
  // Find the offer - managers can see all, brokers only their own
  const offer = isManagerOrAdmin 
    ? offers.find(o => o.id === offerId)
    : filteredOffers.find(o => o.id === offerId);
  
  const client = mockClients.find(c => c.id === offer?.clientId);
  const product = mockProducts.find(p => p.id === offer?.productId);
  const broker = mockBrokers.find(b => b.id === offer?.brokerId);
  const activities = getActivitiesForEntity('OFFER', offerId);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleRejectOffer = () => {
    if (!offer || !user) return;
    
    updateOffer(offerId, { status: 'REJECTED' });
    addActivityLog({
      entityType: 'OFFER',
      entityId: offerId,
      activityType: 'STATUS_CHANGED',
      description: `Offer ${offer.offerNumber} was rejected`,
      performedBy: user.id,
      performedByName: `${user.firstName} ${user.lastName}`,
    });
    toast.success('Offer rejected');
    setShowRejectDialog(false);
  };

  const isExpired = offer ? new Date(offer.expiresAt) < new Date() : false;
  const isExpiringSoon = offer ? new Date(offer.expiresAt) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : false;
  
  const canCheckout = offer?.status === 'PENDING' && !isExpired;
  const canReject = offer?.status === 'PENDING' && isManagerOrAdmin;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen">
        <Header title="Offer Not Found" subtitle="" />
        <div className="p-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-8 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Offer Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The offer you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate('/offers')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Offers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        title={offer.offerNumber} 
        subtitle="Offer Details"
      />

      <div className="p-6 space-y-6">
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/offers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Offers
          </Button>
          
          <div className="flex items-center gap-3">
            {canReject && (
              <Button 
                variant="outline" 
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Offer
              </Button>
            )}
            {canCheckout && (
              <Button 
                onClick={() => navigate(`/checkout/${offer.id}`)}
                className="bg-primary hover:bg-primary/90"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Proceed to Checkout
              </Button>
            )}
          </div>
        </div>

        {/* Status Banner */}
        {isExpired && offer.status === 'PENDING' && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">This offer has expired</p>
              <p className="text-sm text-muted-foreground">
                Expired on {offer.expiresAt}. Please create a new offer.
              </p>
            </div>
          </div>
        )}

        {isExpiringSoon && !isExpired && offer.status === 'PENDING' && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-warning" />
            <div>
              <p className="font-medium text-warning">This offer expires soon</p>
              <p className="text-sm text-muted-foreground">
                Expires on {offer.expiresAt}. Complete checkout to convert to policy.
              </p>
            </div>
          </div>
        )}

        {offer.status === 'ACCEPTED' && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <div>
              <p className="font-medium text-success">Offer Accepted</p>
              <p className="text-sm text-muted-foreground">
                This offer has been converted to a policy.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Offer Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Offer Summary
                </CardTitle>
                <StatusBadge status={offer.status} />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Offer Number</p>
                    <p className="font-semibold text-lg">{offer.offerNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created Date</p>
                    <p className="font-medium">{offer.createdAt}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Coverage Period</p>
                    <p className="font-medium">{offer.startDate} - {offer.endDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expires</p>
                    <p className={`font-medium ${isExpired ? 'text-destructive' : isExpiringSoon ? 'text-warning' : ''}`}>
                      {offer.expiresAt}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Sum Insured</p>
                    <p className="font-bold text-xl">{formatCurrency(offer.sumInsured)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Premium</p>
                    <p className="font-bold text-xl text-primary">{formatCurrency(offer.premium)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <Link 
                      to={`/clients/${offer.clientId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {offer.clientName}
                    </Link>
                  </div>
                  {client && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">CNP</p>
                        <p className="font-mono font-medium">{client.cnp}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{client.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{client.phone}</p>
                      </div>
                    </>
                  )}
                </div>
                
                {offer.gdprConsent && (
                  <div className="mt-4 flex items-center gap-2 text-success">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">GDPR consent obtained on {offer.gdprConsentDate}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Product</p>
                    <p className="font-medium">{offer.productName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Insurer</p>
                    <p className="font-medium">{offer.insurerName}</p>
                  </div>
                  {product && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <Badge variant="outline">{product.category}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Product Code</p>
                        <p className="font-mono text-sm">{product.code}</p>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Custom Field Values */}
                {offer.customFieldValues && Object.keys(offer.customFieldValues).length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-3">Custom Fields</p>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(offer.customFieldValues).map(([key, value]) => {
                          const field = product?.customFields?.find(f => f.name === key);
                          return (
                            <div key={key} className="bg-muted/50 p-3 rounded-lg">
                              <p className="text-xs text-muted-foreground">{field?.label || key}</p>
                              <p className="font-medium">
                                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Broker Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Broker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{offer.brokerName}</p>
                  </div>
                  {broker && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium text-sm">{broker.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">License</p>
                        <p className="font-mono text-sm">{broker.licenseNumber}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Activity Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTimeline activities={activities} maxHeight="350px" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject offer {offer.offerNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectOffer}
              className="bg-destructive hover:bg-destructive/90"
            >
              Reject Offer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
