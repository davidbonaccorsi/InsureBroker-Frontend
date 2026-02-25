import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '../lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowLeft,
  FileText,
  User,
  Calendar,
  DollarSign,
  Shield,
  CreditCard,
  Upload,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  Pencil,
  RefreshCw
} from 'lucide-react';

export default function PolicyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { policies, clients, updatePolicy, uploadPaymentProof, downloadPaymentProof, downloadPolicyPdf, getActivitiesForEntity, addActivityLog } = useData();  const { user } = useAuth();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null); // NOU

  const policy = policies.find(p => p.id === parseInt(id || '0'));
  const client = policy ? clients.find(c => c.id === policy.clientId) : null;
  const activities = getActivitiesForEntity('POLICY', parseInt(id || '0'));

  const canValidatePayment = user?.role === 'BROKER_MANAGER' || user?.role === 'ADMINISTRATOR';

  if (!policy) {
    return (
        <div className="min-h-screen">
          <Header title="Policy Not Found" />
          <div className="p-6">
            <Button variant="outline" onClick={() => navigate('/policies')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Policies
            </Button>
            <div className="mt-8 text-center text-muted-foreground">
              The policy you're looking for doesn't exist or you don't have access.
            </div>
          </div>
        </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const handleUploadPaymentProof = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      // Trimitem fisierul REAL la backend
      await uploadPaymentProof(policy.id, uploadFile);

      addActivityLog({
        entityType: 'POLICY',
        entityId: policy.id,
        activityType: 'PAYMENT_UPLOADED',
        description: `Payment proof uploaded: ${uploadFile.name}`,
        performedBy: user?.id || 0,
        performedByName: `${user?.firstName} ${user?.lastName}`,
      });

      toast.success('Payment proof uploaded successfully');
      setIsUploadDialogOpen(false);
      setUploadFile(null); // Resetăm starea
    } catch (error) {
      toast.error('Failed to upload payment proof. Please try again.');
    }
  };

  // Pentru Polița PDF Generată pe loc
  const handlePolicyAction = async (action: 'view' | 'download') => {
    try {
      // 1. Facem log inainte de a downloada
      addActivityLog({
        entityType: 'POLICY',
        entityId: policy.id,
        activityType: 'DOCUMENT_DOWNLOADED',
        description: `Policy PDF was ${action === 'view' ? 'viewed' : 'downloaded'}`,
        performedBy: user?.id || 0,
        performedByName: `${user?.firstName} ${user?.lastName}`,
      });

      // 2. Cerem fisierul (aceeasi logica ca la tine, doar ca adaptata pentru "View")
      const response = await api.get(`/policies/${policy.id}/pdf`, { responseType: 'blob' });
      const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

      if (action === 'view') {
        window.open(fileURL, '_blank'); // Deschide intr-un tab nou
      } else {
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', `Policy_${policy.policyNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      }
    } catch (error) {
      toast.error(`Failed to ${action} policy PDF.`);
    }
  };

  // Pentru Dovada de Plata incarcata
  const handleProofAction = async (action: 'view' | 'download') => {
    if (!policy.proofOfPayment) return;
    try {
      addActivityLog({
        entityType: 'POLICY',
        entityId: policy.id,
        activityType: 'DOCUMENT_DOWNLOADED',
        description: `Payment proof (${policy.proofOfPayment}) was ${action === 'view' ? 'viewed' : 'downloaded'}`,
        performedBy: user?.id || 0,
        performedByName: `${user?.firstName} ${user?.lastName}`,
      });

      const response = await api.get(`/policies/${policy.id}/download-proof`, { responseType: 'blob' });

      // Determinăm tipul Mime grosier in functie de extensie
      let mimeType = 'application/pdf';
      const fileNameLower = policy.proofOfPayment.toLowerCase();
      if(fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if(fileNameLower.endsWith('.png')) mimeType = 'image/png';

      const fileURL = URL.createObjectURL(new Blob([response.data], { type: mimeType }));

      if (action === 'view') {
        window.open(fileURL, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', policy.proofOfPayment);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      }
    } catch (error) {
      toast.error(`Failed to ${action} payment proof.`);
    }
  };

  const handleValidatePayment = () => {
    updatePolicy(policy.id, {
      paymentStatus: 'VALIDATED',
      validatedBy: user?.id,
      validatedAt: new Date().toISOString(),
      status: 'ACTIVE',
    });

    addActivityLog({
      entityType: 'POLICY',
      entityId: policy.id,
      activityType: 'PAYMENT_VALIDATED',
      description: 'Payment validated and policy activated',
      performedBy: user?.id || 0,
      performedByName: `${user?.firstName} ${user?.lastName}`,
    });

    toast.success('Payment validated - Policy is now active');
  };

  const handleRejectPayment = () => {
    updatePolicy(policy.id, {
      paymentStatus: 'REJECTED',
      status: 'AWAITING_PAYMENT',
    });

    addActivityLog({
      entityType: 'POLICY',
      entityId: policy.id,
      activityType: 'PAYMENT_REJECTED',
      description: 'Payment proof rejected - new proof required',
      performedBy: user?.id || 0,
      performedByName: `${user?.firstName} ${user?.lastName}`,
    });

    toast.error('Payment rejected - Customer needs to resubmit');
  };

  const getPaymentMethodLabel = (method?: string) => {
    const labels: Record<string, string> = {
      CASH: 'Cash',
      POS: 'POS Terminal',
      CARD_ONLINE: 'Online Card Payment',
      BANK_TRANSFER: 'Bank Transfer',
      BROKER_PAYMENT: 'Broker Payment',
    };
    return method ? labels[method] || method : 'Not selected';
  };

  const needsAction = policy.status === 'AWAITING_PAYMENT' || policy.status === 'AWAITING_VALIDATION';

  return (
      <div className="min-h-screen">
        <Header
            title={policy.policyNumber}
            subtitle={`${policy.productName} • ${policy.insurerName}`}
        />

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Button variant="outline" onClick={() => navigate('/policies')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Policies
            </Button>
            <div className="flex gap-2 flex-wrap">
              <Button
                  className="bg-primary text-primary-foreground"
                  onClick={() => {
                    toast.success("Generating PDF...");
                    downloadPolicyPdf(policy.id, policy.policyNumber);
                  }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate PDF
              </Button>
              <Button variant="outline" onClick={() => navigate(`/clients/${policy.clientId}`)}>
                <User className="w-4 h-4 mr-2" />
                View Client
              </Button>
              <Button variant="outline">
                <Pencil className="w-4 h-4 mr-2" />
                Edit Policy
              </Button>
              {policy.status === 'EXPIRED' && (
                  <Button>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renew Policy
                  </Button>
              )}
            </div>
          </div>

          {needsAction && (
              <Card className={policy.status === 'AWAITING_VALIDATION' ? 'border-warning bg-warning/5' : 'border-primary bg-primary/5'}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-6 h-6 text-warning" />
                      <div>
                        <p className="font-medium">
                          {policy.status === 'AWAITING_PAYMENT'
                              ? 'Awaiting Payment Proof'
                              : 'Awaiting Payment Validation'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {policy.status === 'AWAITING_PAYMENT'
                              ? 'Upload proof of payment to proceed'
                              : 'A manager needs to validate the payment'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(policy.status === 'AWAITING_PAYMENT' || policy.paymentStatus === 'REJECTED') && (
                          <Button onClick={() => setIsUploadDialogOpen(true)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Proof
                          </Button>
                      )}
                      {policy.status === 'AWAITING_VALIDATION' && canValidatePayment && (
                          <>
                            <Button variant="outline" onClick={handleRejectPayment}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button onClick={handleValidatePayment}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Validate
                            </Button>
                          </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Policy Information
                  </CardTitle>
                  <StatusBadge status={policy.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Policy Number</p>
                    <p className="font-medium font-mono text-primary">{policy.policyNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Product</p>
                    <p className="font-medium">{policy.productName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Insurer</p>
                    <p className="font-medium">{policy.insurerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Broker</p>
                    <p className="font-medium">{policy.brokerName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Client</p>
                      <button
                          className="font-medium text-primary hover:underline"
                          onClick={() => navigate(`/clients/${policy.clientId}`)}
                      >
                        {policy.clientName}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-medium">{formatDate(policy.startDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="font-medium">{formatDate(policy.endDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{formatDate(policy.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Premium</p>
                      <p className="font-bold text-xl">{formatCurrency(policy.premium)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sum Insured</p>
                      <p className="font-bold text-xl">{formatCurrency(policy.sumInsured)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">GDPR Consent</p>
                    <p className="font-medium">
                      {policy.gdprConsent
                          ? `Signed on ${formatDate(policy.gdprConsentDate)}`
                          : 'Not signed'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="font-medium">
                    {getPaymentMethodLabel(policy.paymentMethod)}
                  </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={policy.paymentStatus || 'PENDING'} />
                  </div>
                  {policy.proofOfPayment && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Proof</span>
                        <span className="font-medium text-primary truncate max-w-[120px]" title={policy.proofOfPayment}>
                      {policy.proofOfPayment}
                    </span>
                      </div>
                  )}
                  {policy.validatedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Validated</span>
                        <span className="font-medium">
                      {formatDate(policy.validatedAt)}
                    </span>
                      </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityTimeline activities={activities.slice(0, 5)} maxHeight="250px" />
                </CardContent>
              </Card>
            </div>
          </div>

          <Tabs defaultValue="activity" className="w-full">
            <TabsList>
              <TabsTrigger value="activity">
                Activity Log
              </TabsTrigger>
              <TabsTrigger value="documents">
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <ActivityTimeline activities={activities} maxHeight="500px" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* 1. DOCUMENTUL POLIȚEI OFFICIAlE (E mereu valabil) */}
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 text-primary rounded-lg">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Official Insurance Policy</p>
                        <p className="text-sm text-muted-foreground">Generated automatically</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePolicyAction('view')}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handlePolicyAction('download')}>
                        <Upload className="w-4 h-4 mr-2 rotate-180" /> Download
                      </Button>
                    </div>
                  </div>

                  {/* 2. DOVADA DE PLATĂ (Dacă a fost încarcată) */}
                  {policy.proofOfPayment ? (
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-success/10 text-success rounded-lg">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Payment Proof</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]" title={policy.proofOfPayment}>
                              {policy.proofOfPayment}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleProofAction('view')}>
                            <Eye className="w-4 h-4 mr-2" /> View
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => handleProofAction('download')}>
                            <Upload className="w-4 h-4 mr-2 rotate-180" /> Download
                          </Button>
                        </div>
                      </div>
                  ) : (
                      <div className="p-4 border border-dashed rounded-lg bg-muted/5 flex items-center justify-center text-muted-foreground">
                        No payment proof uploaded yet.
                      </div>
                  )}

                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Payment Proof</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select File</Label>
                <Input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setUploadFile(file);
                    }}
                />
                <p className="text-sm text-muted-foreground">
                  Upload a receipt, bank transfer confirmation, or other payment proof
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUploadPaymentProof}>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}