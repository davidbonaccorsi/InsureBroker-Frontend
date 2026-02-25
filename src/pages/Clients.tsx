import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { DataTable } from '@/components/ui/DataTable';
import { ViewAllToggle } from '@/components/ViewAllToggle';
import { useData } from '@/contexts/DataContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Pencil, Trash2, Eye, Users, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Clients() {
  const navigate = useNavigate();
  const { filteredClients, deleteClient, showAllData, setShowAllData } = useData();
  const { canDeleteClient, isManagerOrAdmin } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  const displayedClients = filteredClients.filter(
    (client) =>
      client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.cnp.includes(searchTerm)
  );

  const handleCreate = () => {
    navigate('/new-client');
  };

  const handleEdit = (client: Client) => {
    navigate(`/clients/${client.id}?edit=true`);
  };

  const handleView = (client: Client) => {
    navigate(`/clients/${client.id}`);
  };

  const handleDelete = (client: Client) => {
    if (!canDeleteClient) {
      toast.error('You do not have permission to delete clients');
      return;
    }
    if (confirm(`Are you sure you want to delete ${client.firstName} ${client.lastName}?`)) {
      deleteClient(client.id);
      toast.success('Client deleted successfully');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (client: Client) => (
        <Link 
          to={`/clients/${client.id}`}
          className="font-medium text-primary hover:underline"
        >
          {client.firstName} {client.lastName}
        </Link>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'gdprConsent',
      header: 'GDPR',
      render: (client: Client) => (
        client.gdprConsent ? (
          <span className="inline-flex items-center gap-1 text-success">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs">Signed</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-destructive">
            <XCircle className="w-4 h-4" />
            <span className="text-xs">Pending</span>
          </span>
        )
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (client: Client) => (
        <span className="text-muted-foreground truncate max-w-[200px] block">
          {client.address}
        </span>
      ),
    },
    { key: 'createdAt', header: 'Created' },
    {
      key: 'actions',
      header: 'Actions',
      render: (client: Client) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleView(client)} title="View Details">
            <Eye className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(client)} title="Edit">
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Button>
          {canDeleteClient && (
            <Button variant="ghost" size="icon" onClick={() => handleDelete(client)} title="Delete">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header title="Clients" subtitle="Manage your client database" />

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
                    ? 'Showing clients from all brokers' 
                    : 'Showing only your clients'}
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
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-bold text-foreground">{filteredClients.length}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">GDPR Signed</p>
            <p className="text-2xl font-bold text-success">
              {filteredClients.filter(c => c.gdprConsent).length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">GDPR Pending</p>
            <p className="text-2xl font-bold text-warning">
              {filteredClients.filter(c => !c.gdprConsent).length}
            </p>
          </div>
        </div>

        {/* Data Table */}
        <DataTable 
          columns={columns} 
          data={displayedClients} 
          emptyMessage={
            filteredClients.length === 0 
              ? "No clients found for your account" 
              : "No clients match your search"
          } 
        />
      </div>
    </div>
  );
}
