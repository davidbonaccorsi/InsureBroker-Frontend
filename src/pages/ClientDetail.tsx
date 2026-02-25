import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { useData } from '@/contexts/DataContext';
import { mockBrokers } from '@/data/mockData';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  Shield, 
  Pencil,
  Plus,
  CreditCard,
  UserCircle
} from 'lucide-react';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, filteredPolicies, getActivitiesForEntity } = useData();
  
  const client = clients.find(c => c.id === parseInt(id || '0'));
  const clientPolicies = filteredPolicies.filter(p => p.clientId === parseInt(id || '0'));
  const activities = getActivitiesForEntity('CLIENT', parseInt(id || '0'));
  const ownerBroker = client ? mockBrokers.find(b => b.id === client.brokerId) : null;
  
  if (!client) {
    return (
      <div className="min-h-screen">
        <Header title="Client Not Found" />
        <div className="p-6">
          <Button variant="outline" onClick={() => navigate('/clients')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
          <div className="mt-8 text-center text-muted-foreground">
            The client you're looking for doesn't exist or you don't have access.
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

  return (
    <div className="min-h-screen">
      <Header 
        title={`${client.firstName} ${client.lastName}`} 
        subtitle="Client Profile"
      />

      <div className="p-6 space-y-6">
        {/* Back button and actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/clients')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">
              <Pencil className="w-4 h-4 mr-2" />
              Edit Client
            </Button>
            <Button onClick={() => navigate('/policies/new?clientId=' + client.id)}>
              <Plus className="w-4 h-4 mr-2" />
              New Policy
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client Info Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">First Name</p>
                  <p className="font-medium">{client.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Name</p>
                  <p className="font-medium">{client.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{client.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nationality</p>
                  <p className="font-medium">{client.nationality || 'Not specified'}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${client.email}`} className="font-medium text-primary hover:underline">
                      {client.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a href={`tel:${client.phone}`} className="font-medium text-primary hover:underline">
                      {client.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{client.address}</p>
                </div>
              </div>

              {/* CNP and Owner Broker */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CNP (Personal Identification)</p>
                    <p className="font-medium font-mono text-lg">{client.cnp || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Owner Broker</p>
                    <p className="font-medium">{ownerBroker ? `${ownerBroker.firstName} ${ownerBroker.lastName}` : 'Unknown'}</p>
                    {ownerBroker && (
                      <p className="text-xs text-muted-foreground">{ownerBroker.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ID Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">ID Type</p>
                  <p className="font-medium">{client.idType?.replace('_', ' ') || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID Number</p>
                  <p className="font-medium font-mono">{client.idNumber || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID Expiry</p>
                  <p className="font-medium">{client.idExpiry || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client Since</p>
                  <p className="font-medium">{client.createdAt}</p>
                </div>
              </div>

              {/* GDPR Status */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GDPR Consent</p>
                  <p className="font-medium">
                    {client.gdprConsent 
                      ? `Signed on ${client.gdprConsentDate}` 
                      : 'Not signed'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active Policies</span>
                  <span className="font-bold text-lg">
                    {clientPolicies.filter(p => p.status === 'ACTIVE').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Policies</span>
                  <span className="font-bold text-lg">{clientPolicies.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Premium</span>
                  <span className="font-bold text-lg text-primary">
                    {formatCurrency(clientPolicies.reduce((sum, p) => sum + p.premium, 0))}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Activity */}
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

        {/* Tabs for Policies and Documents */}
        <Tabs defaultValue="policies" className="w-full">
          <TabsList>
            <TabsTrigger value="policies" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Policies ({clientPolicies.length})
            </TabsTrigger>
            <TabsTrigger value="activity">
              Activity Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="policies" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {clientPolicies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No policies found for this client
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientPolicies.map(policy => (
                      <div 
                        key={policy.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/policies/${policy.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-primary">{policy.policyNumber}</p>
                            <p className="text-sm text-muted-foreground">{policy.productName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(policy.premium)}</p>
                            <p className="text-sm text-muted-foreground">
                              {policy.startDate} - {policy.endDate}
                            </p>
                          </div>
                          <StatusBadge status={policy.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <ActivityTimeline activities={activities} maxHeight="500px" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
