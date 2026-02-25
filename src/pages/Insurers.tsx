import {useEffect, useState} from 'react';
import { Header } from '@/components/layout/Header';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Insurer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '../lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Insurers() {
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInsurer, setEditingInsurer] = useState<Insurer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    active: true,
  });

  const filteredInsurers = insurers.filter(
    (insurer) =>
      insurer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insurer.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    api.get('/insurers').then(res => setInsurers(res.data)).catch(console.error);
  }, []);

  const handleCreate = () => {
    setEditingInsurer(null);
    setFormData({
      name: '',
      code: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      active: true,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (insurer: Insurer) => {
    setEditingInsurer(insurer);
    setFormData({
      name: insurer.name,
      code: insurer.code,
      contactEmail: insurer.contactEmail,
      contactPhone: insurer.contactPhone,
      address: insurer.address,
      active: insurer.active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (insurer: Insurer) => {
    if (confirm(`Are you sure you want to delete ${insurer.name}?`)) {
      try {
        await api.delete(`/insurers/${insurer.id}`);
        setInsurers(insurers.filter((i) => i.id !== insurer.id));
        toast.success('Insurer deleted successfully');
      } catch (error) {
        toast.error('Failed to delete insurer');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingInsurer) {
        // Apel REAL către Backend (Update)
        const response = await api.put(`/insurers/${editingInsurer.id}`, formData);
        setInsurers(
            insurers.map((i) =>
                i.id === editingInsurer.id ? response.data : i
            )
        );
        toast.success('Insurer updated successfully');
      } else {
        // Apel REAL către Backend (Create)
        const response = await api.post('/insurers', formData);
        setInsurers([...insurers, response.data]);
        toast.success('Insurer created successfully');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save insurer');
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (insurer: Insurer) => (
        <span className="font-medium text-primary">{insurer.code}</span>
      ),
    },
    { key: 'name', header: 'Name' },
    { key: 'contactEmail', header: 'Email' },
    { key: 'contactPhone', header: 'Phone' },
    {
      key: 'active',
      header: 'Status',
      render: (insurer: Insurer) => (
        <StatusBadge status={insurer.active ? 'ACTIVE' : 'SUSPENDED'} />
      ),
    },
    { key: 'createdAt', header: 'Created' },
    {
      key: 'actions',
      header: 'Actions',
      render: (insurer: Insurer) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(insurer)}>
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(insurer)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header title="Insurers" subtitle="Manage insurance companies" />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search insurers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Insurer
          </Button>
        </div>

        <DataTable columns={columns} data={filteredInsurers} emptyMessage="No insurers found" />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingInsurer ? 'Edit Insurer' : 'Add New Insurer'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
              {editingInsurer ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
