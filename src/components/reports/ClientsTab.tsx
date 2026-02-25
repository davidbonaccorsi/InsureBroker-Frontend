import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/ui/DataTable';
import { useData } from '@/contexts/DataContext';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientsTab() {
  const navigate = useNavigate();
  const { filteredClients, deleteClient } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const clients = filteredClients.filter((client) => {
    const search = searchTerm.toLowerCase();
    return (
      client.firstName.toLowerCase().includes(search) ||
      client.lastName.toLowerCase().includes(search) ||
      client.email.toLowerCase().includes(search) ||
      client.phone.includes(search)
    );
  });

  const handleDelete = (client: Client) => {
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
        <div className="font-medium text-foreground">
          {client.firstName} {client.lastName}
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
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
          <Button variant="ghost" size="icon" onClick={() => navigate(`/clients/${client.id}`)}>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(`/clients/${client.id}`)}>
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(client)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
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
        <Button onClick={() => navigate('/new-client')} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <DataTable columns={columns} data={clients} emptyMessage="No clients found" />
    </div>
  );
}
