import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Broker } from '@/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, Eye, Key, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function Brokers() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [viewingBroker, setViewingBroker] = useState<Broker | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    commissionRate: '',
    hireDate: '',
    active: true,
    role: 'BROKER' as 'BROKER' | 'BROKER_MANAGER' | 'ADMINISTRATOR',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [existingEmails, setExistingEmails] = useState<string[]>([]);

  // FETCH BROKERS FROM REAL API
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const response = await api.get('/brokers');
        setBrokers(response.data);
        setExistingEmails(response.data.map((b: Broker) => b.email));
      } catch (error) {
        console.error("Failed to fetch brokers", error);
        toast.error("Failed to load brokers from the database");
      }
    };
    fetchBrokers();
  }, []);

  const filteredBrokers = brokers.filter(
      (broker) =>
          broker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          broker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          broker.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          broker.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    } else if (!editingBroker && existingEmails.includes(formData.email)) {
      errors.email = 'This email is already in use';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.licenseNumber.trim()) errors.licenseNumber = 'License number is required';
    if (!formData.commissionRate) errors.commissionRate = 'Commission rate is required';
    if (!formData.hireDate) errors.hireDate = 'Hire date is required';

    if (!editingBroker) {
      if (!formData.password) {
        errors.password = 'Password is required for new brokers';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    } else if (formData.password) {
      if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    setEditingBroker(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      licenseNumber: '',
      commissionRate: '',
      hireDate: '',
      active: true,
      role: 'BROKER',
      password: '',
      confirmPassword: '',
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleEdit = (broker: Broker) => {
    setEditingBroker(broker);
    setFormData({
      firstName: broker.firstName,
      lastName: broker.lastName,
      email: broker.email,
      phone: broker.phone,
      licenseNumber: broker.licenseNumber,
      commissionRate: broker.commissionRate.toString(),
      hireDate: broker.hireDate,
      active: broker.active,
      role: broker.role,
      password: '',
      confirmPassword: '',
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleView = (broker: Broker) => {
    setViewingBroker(broker);
    setIsViewDialogOpen(true);
  };

  // REAL API DELETE (Deactivate)
  const handleDelete = async (broker: Broker) => {
    if (confirm(`Are you sure you want to deactivate ${broker.firstName} ${broker.lastName}? This will also deactivate their login account.`)) {
      try {
        await api.delete(`/brokers/${broker.id}`);
        setBrokers(brokers.map((b) => b.id === broker.id ? { ...b, active: false } : b));
        toast.success('Broker deleted and account deactivated');
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to deactivate broker');
      }
    }
  };

  // REAL API SAVE & UPDATE
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      if (editingBroker) {
        const response = await api.put(`/brokers/${editingBroker.id}`, formData);
        setBrokers(brokers.map((b) => b.id === editingBroker.id ? response.data : b));
        toast.success('Broker updated successfully');
      } else {
        const response = await api.post('/brokers', formData);
        setBrokers([...brokers, response.data]);
        setExistingEmails([...existingEmails, response.data.email]);
        toast.success(`Broker created successfully! They can now login with email: ${formData.email}`);
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'An error occurred while saving the broker');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (broker: Broker) => (
          <div className="font-medium text-foreground">
            {broker.firstName} {broker.lastName}
          </div>
      ),
    },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (broker: Broker) => {
        const roleConfig = {
          ADMINISTRATOR: { label: 'Administrator', bg: 'bg-destructive/10 text-destructive' },
          BROKER_MANAGER: { label: 'Manager', bg: 'bg-primary/10 text-primary' },
          BROKER: { label: 'Broker', bg: 'bg-muted text-muted-foreground' },
        };
        const config = roleConfig[broker.role];
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg}`}>
            {(broker.role === 'BROKER_MANAGER' || broker.role === 'ADMINISTRATOR') && <UserCheck className="w-3 h-3" />}
              {config.label}
          </span>
        );
      },
    },
    {
      key: 'licenseNumber',
      header: 'License',
      render: (broker: Broker) => (
          <span className="font-mono text-sm text-primary">{broker.licenseNumber}</span>
      ),
    },
    {
      key: 'commissionRate',
      header: 'Commission Rate',
      render: (broker: Broker) => <span>{broker.commissionRate}%</span>,
    },
    { key: 'hireDate', header: 'Hire Date' },
    {
      key: 'active',
      header: 'Status',
      render: (broker: Broker) => (
          <StatusBadge status={broker.active ? 'ACTIVE' : 'SUSPENDED'} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (broker: Broker) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleView(broker)} title="View">
              <Eye className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleEdit(broker)} title="Edit">
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(broker)} title="Delete">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
      ),
    },
  ];

  return (
      <div className="min-h-screen">
        <Header title="Brokers" subtitle="Manage insurance brokers and their login accounts" />

        <div className="p-6 space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
            <Key className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Account Creation</p>
              <p className="text-sm text-muted-foreground">
                When you create a broker here, a login account is automatically created.
                The broker can then login with their email and password.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                  type="search"
                  placeholder="Search brokers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
              />
            </div>
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Broker
            </Button>
          </div>

          <DataTable columns={columns} data={filteredBrokers} emptyMessage="No brokers found" />
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBroker ? 'Edit Broker' : 'Add New Broker'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Personal Information
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={formErrors.firstName ? 'border-destructive' : ''}
                  />
                  {formErrors.firstName && <p className="text-xs text-destructive">{formErrors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className={formErrors.lastName ? 'border-destructive' : ''}
                  />
                  {formErrors.lastName && <p className="text-xs text-destructive">{formErrors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={formErrors.phone ? 'border-destructive' : ''}
                  />
                  {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number *</Label>
                  <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className={formErrors.licenseNumber ? 'border-destructive' : ''}
                  />
                  {formErrors.licenseNumber && <p className="text-xs text-destructive">{formErrors.licenseNumber}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commissionRate">Commission Rate (%) *</Label>
                  <Input
                      id="commissionRate"
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                      className={formErrors.commissionRate ? 'border-destructive' : ''}
                  />
                  {formErrors.commissionRate && <p className="text-xs text-destructive">{formErrors.commissionRate}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Hire Date *</Label>
                  <Input
                      id="hireDate"
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                      className={formErrors.hireDate ? 'border-destructive' : ''}
                  />
                  {formErrors.hireDate && <p className="text-xs text-destructive">{formErrors.hireDate}</p>}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Login Account
                </h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Login) *</Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={formErrors.email ? 'border-destructive' : ''}
                    disabled={!!editingBroker}
                />
                {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
                {editingBroker && <p className="text-xs text-muted-foreground">Email cannot be changed after creation</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password {editingBroker ? '(leave blank to keep current)' : '*'}
                  </Label>
                  <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingBroker ? '••••••••' : 'Min 6 characters'}
                      className={formErrors.password ? 'border-destructive' : ''}
                  />
                  {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm password"
                      className={formErrors.confirmPassword ? 'border-destructive' : ''}
                  />
                  {formErrors.confirmPassword && <p className="text-xs text-destructive">{formErrors.confirmPassword}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Account Role *</Label>
                <Select
                    value={formData.role}
                    onValueChange={(value: 'BROKER' | 'BROKER_MANAGER' | 'ADMINISTRATOR') =>
                        setFormData({ ...formData, role: value })
                    }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BROKER">Broker</SelectItem>
                    <SelectItem value="BROKER_MANAGER">Broker Manager</SelectItem>
                    <SelectItem value="ADMINISTRATOR">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Account Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
                {editingBroker ? 'Update Broker' : 'Create Broker'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Broker Details</DialogTitle>
            </DialogHeader>
            {viewingBroker && (
                <div className="grid gap-4 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold">
                        {viewingBroker.firstName} {viewingBroker.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {viewingBroker.licenseNumber}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={viewingBroker.active ? 'ACTIVE' : 'SUSPENDED'} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email (Login)</p>
                      <p className="font-medium">{viewingBroker.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{viewingBroker.phone}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Commission Rate</p>
                      <p className="font-medium text-lg text-primary">{viewingBroker.commissionRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hire Date</p>
                      <p className="font-medium">{viewingBroker.hireDate}</p>
                    </div>
                  </div>
                </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}