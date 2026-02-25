import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ArrowRight,
  User,
  CreditCard,
  Shield,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, title: 'Personal Info', icon: User },
  { id: 2, title: 'ID Documents', icon: CreditCard },
  { id: 3, title: 'GDPR Consent', icon: Shield },
  { id: 4, title: 'Review', icon: CheckCircle },
];

export default function NewClient() {
  const navigate = useNavigate();
  const { addClient, addActivityLog, getBrokerIdForCurrentUser } = useData();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    nationality: '',
    cnp: '',
    idType: '' as 'ID_CARD' | 'PASSPORT' | 'DRIVERS_LICENSE' | '',
    idNumber: '',
    idExpiry: '',
    gdprConsent: false,
  });
  
  const canProceed = () => {
    switch (currentStep) {
      case 1: 
        return formData.firstName && formData.lastName && formData.email && formData.phone && formData.cnp.length === 13;
      case 2: 
        return true; // ID documents are optional
      case 3: 
        return formData.gdprConsent;
      case 4: 
        return true;
      default: 
        return false;
    }
  };
  
  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const brokerId = getBrokerIdForCurrentUser() || 1;

    try {
      // 1. Wait for the API to create the client
      const newClient = await addClient({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality || undefined,
        cnp: formData.cnp,
        idType: formData.idType || undefined,
        idNumber: formData.idNumber || undefined,
        idExpiry: formData.idExpiry || undefined,
        gdprConsent: formData.gdprConsent,
        gdprConsentDate: formData.gdprConsent ? new Date().toISOString().split('T')[0] : undefined,
        brokerId,
      });

      // Since newClient comes from the backend, we only proceed if it exists
      if (newClient) {
        // 2. Wait for the Activity Log to save
        await addActivityLog({
          entityType: 'CLIENT',
          entityId: newClient.id,
          activityType: 'CLIENT_CREATED',
          description: `Client ${newClient.firstName} ${newClient.lastName} created`,
          performedBy: user?.id || 0,
          performedByName: `${user?.firstName} ${user?.lastName}`,
        });

        if (formData.gdprConsent) {
          await addActivityLog({
            entityType: 'CLIENT',
            entityId: newClient.id,
            activityType: 'GDPR_SIGNED',
            description: 'GDPR consent signed during registration',
            performedBy: user?.id || 0,
            performedByName: `${user?.firstName} ${user?.lastName}`,
          });
        }

        toast.success('Client created successfully!');
        navigate(`/clients/${newClient.id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create client');
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Add New Client" subtitle="Step-by-step client registration" />

      <div className="p-6 space-y-6">
        {/* Back button */}
        <Button variant="outline" onClick={() => navigate('/reports/clients')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </Button>

        {/* Progress Steps */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                    currentStep === step.id 
                      ? "bg-primary text-primary-foreground" 
                      : currentStep > step.id
                      ? "bg-success/20 text-success"
                      : "bg-muted text-muted-foreground"
                  )}
                  onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                  disabled={currentStep < step.id}
                >
                  <step.icon className="w-4 h-4" />
                  <span className="hidden md:inline text-sm font-medium">{step.title}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-2",
                    currentStep > step.id ? "bg-success" : "bg-border"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="max-w-3xl mx-auto">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Enter the client's basic information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Smith"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.smith@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 555-0100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main Street, City, State"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CNP (13 digits) *</Label>
                    <Input
                      value={formData.cnp}
                      onChange={(e) => setFormData({ ...formData, cnp: e.target.value.replace(/\D/g, '').slice(0, 13) })}
                      placeholder="1234567890123"
                      maxLength={13}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    placeholder="Romanian"
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: ID Documents */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle>ID Documents</CardTitle>
                <CardDescription>Enter the client's identification documents (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>ID Type</Label>
                  <Select
                    value={formData.idType}
                    onValueChange={(value) => setFormData({ ...formData, idType: value as typeof formData.idType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ID_CARD">ID Card</SelectItem>
                      <SelectItem value="PASSPORT">Passport</SelectItem>
                      <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ID Number</Label>
                    <Input
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      placeholder="ID123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ID Expiry Date</Label>
                    <Input
                      type="date"
                      value={formData.idExpiry}
                      onChange={(e) => setFormData({ ...formData, idExpiry: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: GDPR Consent */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle>GDPR Consent</CardTitle>
                <CardDescription>The client must agree to data processing terms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg text-sm space-y-4">
                  <p><strong>Data Processing Agreement</strong></p>
                  <p>
                    By checking the box below, the client consents to the collection and processing 
                    of their personal data for the purposes of insurance policy management, claims 
                    processing, and regulatory compliance.
                  </p>
                  <p>
                    The client understands their rights under GDPR including the right to access, 
                    rectify, and delete their personal data.
                  </p>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id="gdpr"
                    checked={formData.gdprConsent}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, gdprConsent: checked as boolean })
                    }
                  />
                  <Label htmlFor="gdpr" className="cursor-pointer">
                    Client has read and agrees to the data processing terms
                  </Label>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <>
              <CardHeader>
                <CardTitle>Review & Submit</CardTitle>
                <CardDescription>Verify all information before creating the client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Personal Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{formData.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{formData.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Address:</span>
                        <span className="font-medium">{formData.address || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date of Birth:</span>
                        <span className="font-medium">{formData.dateOfBirth || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">ID Documents</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID Type:</span>
                        <span className="font-medium">{formData.idType || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID Number:</span>
                        <span className="font-medium">{formData.idNumber || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID Expiry:</span>
                        <span className="font-medium">{formData.idExpiry || 'Not provided'}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mt-6">GDPR</h3>
                    <div className="flex items-center gap-2">
                      {formData.gdprConsent ? (
                        <span className="text-success flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Consent signed
                        </span>
                      ) : (
                        <span className="text-destructive">Consent not signed</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between p-6 pt-0">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-primary hover:bg-primary/90"
            >
              {currentStep === 4 ? 'Create Client' : 'Next'}
              {currentStep < 4 && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
