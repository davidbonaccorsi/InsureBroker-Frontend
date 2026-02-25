import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentMethod } from '@/types';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Banknote,
  Building,
  CreditCard,
  Wallet,
  CheckCircle,
  FileText,
  User,
  Calendar,
  DollarSign,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const paymentMethods: { value: PaymentMethod; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'CASH', label: 'Cash', icon: Banknote, description: 'Pay in cash at the office' },
  { value: 'POS', label: 'POS Terminal', icon: CreditCard, description: 'Card payment at terminal' },
  { value: 'CARD_ONLINE', label: 'Online Card', icon: CreditCard, description: 'Pay online with card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building, description: 'Wire transfer to bank account' },
  { value: 'BROKER_PAYMENT', label: 'Broker Payment', icon: Wallet, description: 'Broker handles payment' },
];

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { offers, convertOfferToPolicy, addActivityLog } = useData();
  const { user } = useAuth();
  
  const offer = offers.find(o => o.id === parseInt(id || '0'));
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [proofOfPayment, setProofOfPayment] = useState<File | null>(null);
  
  if (!offer) {
    return (
      <div className="min-h-screen">
        <Header title="Checkout" subtitle="Complete your offer" />
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Offer not found</p>
            <Button className="mt-4" onClick={() => navigate('/offers')}>
              Back to Offers
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleCheckout = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Determine if auto-validated
    const isAutoValidated = paymentMethod === 'CARD_ONLINE';

    try {
      // 1. Wait for the Spring Boot backend to issue the Policy
      const policy = await convertOfferToPolicy(offer.id, paymentMethod, proofOfPayment?.name);

      if (policy) {
        // 2. Wait for the Activity Log to save
        await addActivityLog({
          entityType: 'POLICY',
          entityId: policy.id,
          activityType: 'POLICY_CREATED',
          description: `Policy ${policy.policyNumber} created from offer ${offer.offerNumber}`,
          performedBy: user?.id || 0,
          performedByName: `${user?.firstName} ${user?.lastName}`,
        });

        toast.success(
            isAutoValidated
                ? 'Payment validated! Policy is now active.'
                : 'Offer converted to policy. Awaiting payment validation.'
        );
        navigate(`/policies/${policy.id}`);
      } else {
        toast.error('Failed to create policy');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'An error occurred during checkout');
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofOfPayment(file);
      toast.success('Proof of payment uploaded');
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Checkout" subtitle={`Complete offer ${offer.offerNumber}`} />

      <div className="p-6 space-y-6">
        {/* Back button */}
        <Button variant="outline" onClick={() => navigate('/offers')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Offers
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Offer Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Offer Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Client:</span>
                      <span className="font-medium">{offer.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Product:</span>
                      <span className="font-medium">{offer.productName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Insurer:</span>
                      <span className="font-medium">{offer.insurerName}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Period:</span>
                      <span className="font-medium">{offer.startDate} - {offer.endDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Sum Insured:</span>
                      <span className="font-medium">{formatCurrency(offer.sumInsured)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {offer.gdprConsent ? (
                        <span className="text-success flex items-center gap-1 text-sm">
                          <CheckCircle className="w-4 h-4" /> GDPR Consent Signed
                        </span>
                      ) : (
                        <span className="text-destructive text-sm">GDPR Consent Missing</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Select Payment Method</CardTitle>
                <CardDescription>Choose how the premium will be paid</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {paymentMethods.map(method => (
                    <button
                      key={method.value}
                      className={cn(
                        "p-4 text-left rounded-lg border transition-colors",
                        paymentMethod === method.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setPaymentMethod(method.value)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <method.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{method.label}</p>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                {paymentMethod === 'CARD_ONLINE' && (
                  <div className="p-3 bg-success/10 text-success rounded-lg text-sm">
                    ✓ Online card payments are automatically validated
                  </div>
                )}
                
                {paymentMethod && paymentMethod !== 'CARD_ONLINE' && (
                  <>
                    <div className="p-3 bg-warning/10 text-warning rounded-lg text-sm">
                      ⚠ This payment method requires manual validation by a broker manager
                    </div>
                    
                    {/* Proof of Payment Upload */}
                    <div className="space-y-2">
                      <Label>Upload Proof of Payment (Optional)</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Drag & drop or click to upload
                        </p>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileUpload}
                          className="cursor-pointer"
                        />
                        {proofOfPayment && (
                          <p className="mt-2 text-sm text-success">
                            ✓ {proofOfPayment.name} uploaded
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product:</span>
                    <span className="font-medium">{offer.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coverage Period:</span>
                    <span className="font-medium">12 months</span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Premium</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(offer.premium)}
                    </span>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={!paymentMethod}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Checkout
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  By completing this checkout, you confirm that all information is accurate.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
