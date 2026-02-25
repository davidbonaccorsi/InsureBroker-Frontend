import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { ProductCustomField, InsuranceProduct, Broker } from '@/types';
import { toast } from 'sonner';
import { api } from '../lib/api';
import {
  ArrowLeft,
  ArrowRight,
  User,
  FileText,
  Shield,
  CheckCircle,
  Search,
  Package,
  Calculator,
  Loader2,
  UserPlus,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, title: 'Select Client', icon: User },
  { id: 2, title: 'Select Product', icon: Package },
  { id: 3, title: 'Policy Details', icon: FileText },
  { id: 4, title: 'GDPR Consent', icon: Shield },
  { id: 5, title: 'Review & Generate', icon: CheckCircle },
];

export default function NewPolicy() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { filteredClients, addOffer, addActivityLog } = useData();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [clientSearch, setClientSearch] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedPremium, setCalculatedPremium] = useState<number | null>(null);
  const [premiumBreakdown, setPremiumBreakdown] = useState<{ basePremium: number; factors: Array<{ name: string; multiplier: number; reason: string }> } | null>(null);

  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);

  // Starea nouă pentru validarea datelor calendaristice
  const [dateError, setDateError] = useState<string>('');

  const [formData, setFormData] = useState({
    clientId: searchParams.get('clientId') || '',
    productId: '',
    brokerId: '',
    startDate: '',
    endDate: '',
    sumInsured: '',
    gdprConsent: false,
    customFieldValues: {} as Record<string, unknown>,
  });

  useEffect(() => {
    const loadData = async () => {
      // 1. Aducem Produsele
      try {
        const productsRes = await api.get('/products');
        setProducts(productsRes.data);
      } catch (error) {
        console.error("Failed to load products", error);
      }

      // 2. Aducem Brokerii
      if (user?.role === 'ADMINISTRATOR' || user?.role === 'BROKER_MANAGER') {
        try {
          const brokersRes = await api.get('/brokers');
          setBrokers(brokersRes.data);
        } catch (error) {
          console.error("Failed to load brokers", error);
        }
      } else if (user) {
        setBrokers([{
          id: user.brokerId || 1,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        } as any]);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  // Validarea Live a datelor din Calendar
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start <= today) {
        setDateError('Start date must be starting from tomorrow.');
      } else if (end <= start) {
        setDateError('End date must be strictly after the Start date.');
      } else {
        setDateError('');
      }
    }
  }, [formData.startDate, formData.endDate]);

  const selectedClient = filteredClients.find(c => c.id.toString() === formData.clientId);
  const selectedProduct = products.find(p => p.id.toString() === formData.productId);
  const selectedBroker = brokers.find(b => b.id.toString() === formData.brokerId);

  const filteredClientList = useMemo(() => {
    return filteredClients.filter(client => {
      if (!clientSearch) return true;
      const search = clientSearch.toLowerCase();
      return (
          `${client.firstName} ${client.lastName}`.toLowerCase().includes(search) ||
          client.email.toLowerCase().includes(search) ||
          client.phone.includes(search) ||
          (client.cnp && client.cnp.includes(search))
      );
    });
  }, [filteredClients, clientSearch]);

  const productsByCategory = useMemo(() => {
    const grouped: Record<string, typeof products> = {};
    products.filter(p => p.active).forEach(product => {
      if (!grouped[product.category]) {
        grouped[product.category] = [];
      }
      grouped[product.category].push(product);
    });
    return grouped;
  }, [products]);

  const handleCalculatePremium = async () => {
    if (dateError) {
      toast.error("Please fix the date errors before calculating premium.");
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error("Please select both Start Date and End Date.");
      return;
    }

    if (!selectedProduct || !formData.sumInsured) return;
    setIsCalculating(true);

    try {
      const response = await api.post('/premium/calculate', {
        productId: selectedProduct.id,
        sumInsured: parseFloat(formData.sumInsured),
        startDate: formData.startDate,
        endDate: formData.endDate,
        customFieldValues: formData.customFieldValues
      });

      setCalculatedPremium(response.data.premium);
      setPremiumBreakdown(response.data.breakdown);
      toast.success('Premium calculated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to calculate premium');
    } finally {
      setIsCalculating(false);
    }
  };

  const areRequiredFieldsFilled = useMemo(() => {
    if (!selectedProduct) return true;

    const requiredFields = selectedProduct.customFields?.filter(f => f.required) || [];
    return requiredFields.every(field => {
      const value = formData.customFieldValues[field.name];
      return value !== undefined && value !== '';
    });
  }, [selectedProduct, formData.customFieldValues]);

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!formData.clientId;
      case 2: return !!formData.productId;
        // La step 3 am adăugat verificarea ca să nu lase să treacă dacă există eroare la date
      case 3: return formData.startDate && formData.endDate && formData.sumInsured && areRequiredFieldsFilled && calculatedPremium !== null && dateError === '';
      case 4: return formData.gdprConsent;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!selectedClient || !selectedProduct || calculatedPremium === null) {
      toast.error('Missing required information');
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    try {
      const newOffer = await addOffer({
        clientId: parseInt(formData.clientId),
        clientName: `${selectedClient.firstName} ${selectedClient.lastName}`,
        productId: parseInt(formData.productId),
        productName: selectedProduct.name,
        insurerName: selectedProduct.insurerName,
        brokerId: selectedBroker ? selectedBroker.id : (user?.brokerId || 0),
        brokerName: selectedBroker ? `${selectedBroker.firstName} ${selectedBroker.lastName}` : `${user?.firstName} ${user?.lastName}`,
        startDate: formData.startDate,
        endDate: formData.endDate,
        premium: calculatedPremium,
        sumInsured: parseFloat(formData.sumInsured),
        status: 'PENDING',
        expiresAt: expiresAt.toISOString().split('T')[0],
        gdprConsent: formData.gdprConsent,
        gdprConsentDate: new Date().toISOString().split('T')[0],
        customFieldValues: formData.customFieldValues,
      });

      if (newOffer) {
        await addActivityLog({
          entityType: 'OFFER',
          entityId: newOffer.id,
          activityType: 'OFFER_CREATED',
          description: `Offer ${newOffer.offerNumber} created for ${selectedClient.firstName} ${selectedClient.lastName}`,
          performedBy: user?.id || 0,
          performedByName: `${user?.firstName} ${user?.lastName}`
        });

        toast.success('Offer generated successfully! Proceed to checkout to finalize the policy.');
        navigate(`/checkout/${newOffer.id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create offer');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderCustomField = (field: ProductCustomField) => {
    const value = formData.customFieldValues[field.name] || '';

    switch (field.type) {
      case 'select':
        return (
            <Select
                value={value as string}
                onValueChange={(val) => setFormData(prev => ({
                  ...prev,
                  customFieldValues: { ...prev.customFieldValues, [field.name]: val }
                }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        );

      case 'checkbox':
        return (
            <div className="flex items-center space-x-2">
              <Checkbox
                  id={field.name}
                  checked={value as boolean}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    customFieldValues: { ...prev.customFieldValues, [field.name]: checked }
                  }))}
              />
              <Label htmlFor={field.name} className="cursor-pointer">{field.label}</Label>
            </div>
        );

      case 'number':
        return (
            <Input
                type="number"
                value={value as string}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  customFieldValues: { ...prev.customFieldValues, [field.name]: e.target.value }
                }))}
                placeholder={field.placeholder}
            />
        );

      case 'date':
        return (
            <Input
                type="date"
                value={value as string}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  customFieldValues: { ...prev.customFieldValues, [field.name]: e.target.value }
                }))}
            />
        );

      default:
        return (
            <Input
                type="text"
                value={value as string}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  customFieldValues: { ...prev.customFieldValues, [field.name]: e.target.value }
                }))}
                placeholder={field.placeholder}
            />
        );
    }
  };

  return (
      <div className="min-h-screen">
        <Header title="Create New Policy" subtitle="Generate an offer for a new insurance policy" />

        <div className="p-6 space-y-6">
          <Button variant="outline" onClick={() => navigate('/reports')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Button>

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

          <Card className="max-w-4xl mx-auto">
            {currentStep === 1 && (
                <>
                  <CardHeader>
                    <CardTitle>Select Client</CardTitle>
                    <CardDescription>Choose an existing client or create a new one</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, phone, or CNP..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="pl-9"
                        />
                      </div>
                      <Button onClick={() => navigate('/new-client')}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        New Client
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {filteredClientList.length > 0 ? (
                          filteredClientList.map(client => (
                              <button
                                  key={client.id}
                                  className={cn(
                                      "w-full p-4 text-left rounded-lg border transition-colors",
                                      formData.clientId === client.id.toString()
                                          ? "border-primary bg-primary/5"
                                          : "border-border hover:border-primary/50"
                                  )}
                                  onClick={() => setFormData({ ...formData, clientId: client.id.toString() })}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{client.firstName} {client.lastName}</p>
                                    <p className="text-sm text-muted-foreground">{client.email} • {client.phone}</p>
                                    {client.cnp && (
                                        <p className="text-xs text-muted-foreground mt-1">CNP: {client.cnp}</p>
                                    )}
                                  </div>
                                </div>
                              </button>
                          ))
                      ) : (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">No clients found matching "{clientSearch}"</p>
                            <Button variant="outline" onClick={() => navigate('/new-client')}>
                              <UserPlus className="w-4 h-4 mr-2" />
                              Create New Client
                            </Button>
                          </div>
                      )}
                    </div>
                  </CardContent>
                </>
            )}

            {currentStep === 2 && (
                <>
                  <CardHeader>
                    <CardTitle>Select Insurance Product</CardTitle>
                    <CardDescription>Choose the type of insurance for this policy</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                        <div key={category}>
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                            {category} Insurance
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {categoryProducts.map(product => (
                                <button
                                    key={product.id}
                                    className={cn(
                                        "p-4 text-left rounded-lg border transition-all",
                                        formData.productId === product.id.toString()
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                                    )}
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        productId: product.id.toString(),
                                        customFieldValues: {}
                                      });
                                      setCalculatedPremium(null);
                                      setPremiumBreakdown(null);
                                    }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        formData.productId === product.id.toString()
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                    )}>
                                      <Package className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium">{product.name}</p>
                                      <p className="text-sm text-muted-foreground truncate">{product.insurerName}</p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Base rate: {(product.basePremium)}
                                      </p>
                                      {product.customFields && product.customFields.length > 0 && (
                                          <p className="text-xs text-primary mt-1">
                                            {product.customFields.length} custom fields
                                          </p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                            ))}
                          </div>
                        </div>
                    ))}
                  </CardContent>
                </>
            )}

            {currentStep === 3 && (
                <>
                  <CardHeader>
                    <CardTitle>Policy Details</CardTitle>
                    <CardDescription>
                      Enter coverage details and calculate the premium
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Sum Insured Ocupa Tot Randul Acum */}
                    <div className="space-y-2">
                      <Label>Sum Insured ($) *</Label>
                      <Input
                          type="number"
                          value={formData.sumInsured}
                          onChange={(e) => {
                            setFormData({ ...formData, sumInsured: e.target.value });
                            setCalculatedPremium(null);
                          }}
                          placeholder="Enter the total coverage amount"
                      />
                      <p className="text-xs text-muted-foreground">
                        The maximum amount the insurance will pay in case of a claim
                      </p>
                    </div>

                    {/* Datele cu block-uri din HTML */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Coverage Start Date *</Label>
                        <Input
                            type="date"
                            value={formData.startDate}
                            min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Coverage End Date *</Label>
                        <Input
                            type="date"
                            value={formData.endDate}
                            min={formData.startDate ? new Date(new Date(formData.startDate).setDate(new Date(formData.startDate).getDate() + 1)).toISOString().split('T')[0] : ''}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Afisare eroare date */}
                    {dateError && (
                        <div className="text-sm text-destructive mt-1 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-destructive"></span>
                          {dateError}
                        </div>
                    )}

                    {selectedProduct?.customFields && selectedProduct.customFields.length > 0 && (
                        <div className="border rounded-lg p-4 space-y-4">
                          <h4 className="font-medium flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            {selectedProduct.name} - Required Information
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            These fields are required to calculate an accurate premium
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedProduct.customFields.map(field => (
                                <div key={field.name} className="space-y-2">
                                  <Label className={field.required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ""}>
                                    {field.label}
                                  </Label>
                                  {renderCustomField(field)}
                                  {field.factorMultiplier && (
                                      <p className="text-xs text-muted-foreground">
                                        Affects premium calculation (factor: {field.factorMultiplier}x)
                                      </p>
                                  )}
                                </div>
                            ))}
                          </div>
                        </div>
                    )}

                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-primary" />
                          Premium Calculation
                        </h4>
                        <Button
                            onClick={handleCalculatePremium}
                            disabled={!formData.sumInsured || !areRequiredFieldsFilled || isCalculating || !!dateError}
                            size="sm"
                        >
                          {isCalculating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Calculating...
                              </>
                          ) : (
                              <>
                                <Calculator className="w-4 h-4 mr-2" />
                                Calculate Premium
                              </>
                          )}
                        </Button>
                      </div>

                      {calculatedPremium !== null && premiumBreakdown && (
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Base Premium:</span>
                              <span>{formatCurrency(premiumBreakdown.basePremium)}</span>
                            </div>

                            {premiumBreakdown.factors.map((factor, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{factor.name}:</span>
                                  <span className={factor.multiplier > 1 ? 'text-destructive' : 'text-success'}>
                            {factor.multiplier > 1 ? '+' : ''}{((factor.multiplier - 1) * 100).toFixed(0)}% ({factor.reason})
                          </span>
                                </div>
                            ))}

                            <div className="border-t pt-3 flex justify-between items-center">
                              <span className="font-semibold">Total Premium:</span>
                              <span className="text-2xl font-bold text-primary">
                          {formatCurrency(calculatedPremium)}
                        </span>
                            </div>
                          </div>
                      )}

                      {!calculatedPremium && (
                          <p className="text-sm text-muted-foreground">
                            Fill in all required fields and click "Calculate Premium" to get the policy cost
                          </p>
                      )}
                    </div>
                  </CardContent>
                </>
            )}

            {currentStep === 4 && (
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

            {currentStep === 5 && (
                <>
                  <CardHeader>
                    <CardTitle>Review & Generate Offer</CardTitle>
                    <CardDescription>Verify all information before generating the offer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Client</span>
                        <span className="font-medium">{selectedClient?.firstName} {selectedClient?.lastName}</span>
                      </div>
                      {selectedClient?.cnp && (
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">CNP</span>
                            <span className="font-medium">{selectedClient.cnp}</span>
                          </div>
                      )}
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Product</span>
                        <span className="font-medium">{selectedProduct?.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Insurer</span>
                        <span className="font-medium">{selectedProduct?.insurerName}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Broker</span>
                        <span className="font-medium">{selectedBroker?.firstName} {selectedBroker?.lastName}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Period</span>
                        <span className="font-medium">{formData.startDate} to {formData.endDate}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Sum Insured</span>
                        <span className="font-medium">{formatCurrency(parseFloat(formData.sumInsured || '0'))}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Calculated Premium</span>
                        <span className="font-medium text-primary text-lg">{formatCurrency(calculatedPremium || 0)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">GDPR Consent</span>
                        <span className="font-medium text-success">✓ Signed</span>
                      </div>

                      {selectedProduct?.customFields && Object.keys(formData.customFieldValues).length > 0 && (
                          <div className="pt-4">
                            <h4 className="font-medium mb-3">Additional Information</h4>
                            {selectedProduct.customFields.map(field => {
                              const value = formData.customFieldValues[field.name];
                              if (!value) return null;
                              return (
                                  <div key={field.name} className="flex justify-between py-2 border-b text-sm">
                                    <span className="text-muted-foreground">{field.label}</span>
                                    <span className="font-medium">{String(value)}</span>
                                  </div>
                              );
                            })}
                          </div>
                      )}
                    </div>

                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm text-center">
                        <strong>Note:</strong> This will generate an offer that can be converted to a policy at checkout.
                        The offer will be valid for 30 days.
                      </p>
                    </div>
                  </CardContent>
                </>
            )}

            <div className="flex justify-between p-6 border-t">
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
              >
                {currentStep === 5 ? 'Generate Offer' : 'Next'}
                {currentStep < 5 && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </Card>
        </div>
      </div>
  );
}