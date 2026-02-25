import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { InsuranceProduct, ProductCustomField, Insurer } from '@/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Pencil, Trash2, Settings, X } from 'lucide-react';
import { toast } from 'sonner';

const categories = ['LIFE', 'HEALTH', 'AUTO', 'HOME', 'TRAVEL', 'BUSINESS'] as const;

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
] as const;

export default function Products() {
  const [products, setProducts] = useState<InsuranceProduct[]>([]);

  // ADDED: State to hold the real insurers from the database
  const [insurers, setInsurers] = useState<Insurer[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFieldsDialogOpen, setIsFieldsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InsuranceProduct | null>(null);
  const [managingFieldsProduct, setManagingFieldsProduct] = useState<InsuranceProduct | null>(null);
  const [customFields, setCustomFields] = useState<ProductCustomField[]>([]);
  const [newField, setNewField] = useState<Partial<ProductCustomField>>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: [],
    factorMultiplier: 1,
  });
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'LIFE' as InsuranceProduct['category'],
    insurerId: '',
    basePremium: '0', // Pune '0' default in loc de gol
    baseRate: '0',    // Pune '0' default in loc de gol
    active: true,
  });

  const filteredProducts = products.filter(
      (product) =>
          (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // FETCH BOTH PRODUCTS AND INSURERS ON LOAD
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, insurersRes] = await Promise.all([
          api.get('/products'),
          api.get('/insurers')
        ]);
        setProducts(productsRes.data);
        setInsurers(insurersRes.data);
      } catch (error) {
        console.error("Failed to load products or insurers", error);
        toast.error("Failed to load data from backend");
      }
    };
    loadData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      category: 'LIFE',
      insurerId: '',
      basePremium: '',
      baseRate: '',
      active: true,
    });
    setIsDialogOpen(true);
  };

  const handleManageFields = (product: InsuranceProduct) => {
    setManagingFieldsProduct(product);
    setCustomFields(product.customFields || []);
    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: [],
      factorMultiplier: 1,
    });
    setIsFieldsDialogOpen(true);
  };

  const handleAddField = () => {
    if (!newField.name || !newField.label) {
      toast.error('Field name and label are required');
      return;
    }

    const field: ProductCustomField = {
      id: `field_${Date.now()}`,
      name: newField.name!,
      label: newField.label!,
      type: newField.type as ProductCustomField['type'],
      required: newField.required || false,
      placeholder: newField.placeholder,
      options: newField.type === 'select' ? newField.options : undefined,
      factorMultiplier: newField.factorMultiplier,
    };

    setCustomFields([...customFields, field]);
    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: [],
      factorMultiplier: 1,
    });
    toast.success('Field added');
  };

  const handleRemoveField = (fieldId: string) => {
    setCustomFields(customFields.filter(f => f.id !== fieldId));
  };

  const handleSaveFields = async () => {
    if (!managingFieldsProduct) return;

    try {
      const payload = {
        ...managingFieldsProduct,
        customFields: customFields
      };

      const response = await api.put(`/products/${managingFieldsProduct.id}`, payload);

      setProducts(products.map(p => p.id === managingFieldsProduct.id ? response.data : p));
      toast.success('Custom fields saved to database!');
      setIsFieldsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save custom fields');
    }
  };

  const handleEdit = (product: InsuranceProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      code: product.code || '',
      description: product.description || '',
      category: product.category,
      insurerId: product.insurerId ? product.insurerId.toString() : '',

      // Dacă există valoarea în DB, o convertim în text. Dacă nu, punem '0'
      basePremium: product.basePremium !== undefined && product.basePremium !== null ? String(product.basePremium) : '0',
      baseRate: product.baseRate !== undefined && product.baseRate !== null ? String(product.baseRate) : '0',

      active: product.active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (product: InsuranceProduct) => {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await api.delete(`/products/${product.id}`);
        setProducts(products.filter((p) => p.id !== product.id));
        toast.success('Product deleted successfully');
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const handleSubmit = async () => {
    const parsedInsurerId = parseInt(formData.insurerId);
    if (isNaN(parsedInsurerId)) {
      toast.error("Please select a valid Insurer");
      return;
    }

    // Le parsam strict independent! Daca inputul e gol, devin 0.
    const finalBasePremium = parseFloat(formData.basePremium) || 0;
    const finalBaseRate = parseFloat(formData.baseRate) || 0;

    const payload = {
      name: formData.name,
      code: formData.code,
      description: formData.description,
      category: formData.category,
      insurerId: parsedInsurerId,

      // Ambele valori trebuie sa plece catre Java
      basePremium: finalBasePremium,
      baseRate: finalBaseRate,

      active: formData.active,
    };

    try {
      if (editingProduct) {
        const response = await api.put(`/products/${editingProduct.id}`, {
          ...payload,
          customFields: editingProduct.customFields || []
        });
        setProducts(products.map((p) => p.id === editingProduct.id ? response.data : p));
        toast.success('Product updated successfully');
      } else {
        const response = await api.post('/products', {
          ...payload,
          customFields: []
        });
        setProducts([...products, response.data]);
        toast.success('Product created successfully');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save product');
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (product: InsuranceProduct) => (
          <span className="font-medium text-primary">{product.code}</span>
      ),
    },
    { key: 'name', header: 'Name' },
    {
      key: 'category',
      header: 'Category',
      render: (product: InsuranceProduct) => (
          <span className="px-2 py-1 bg-muted rounded text-xs font-medium">{product.category}</span>
      ),
    },
    { key: 'insurerName', header: 'Insurer' },
    {
      key: 'basePremium',
      header: 'Base Premium',
      render: (product: InsuranceProduct) => formatCurrency(product.basePremium),
    },
    {
      key: 'baseRate',
      header: 'Base Rate / Day',
      render: (product: InsuranceProduct) => (
          <span className="font-medium text-muted-foreground">
            {product.baseRate ? `${product.baseRate}%` : '0%'}
          </span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (product: InsuranceProduct) => (
          <StatusBadge status={product.active ? 'ACTIVE' : 'SUSPENDED'} />
      ),
    },
    {
      key: 'customFields',
      header: 'Custom Fields',
      render: (product: InsuranceProduct) => (
          <span className="text-sm text-muted-foreground">
          {product.customFields?.length || 0} fields
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (product: InsuranceProduct) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => handleManageFields(product)} title="Manage Custom Fields">
              <Settings className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} title="Edit Product">
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(product)} title="Delete Product">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
      ),
    },
  ];

  return (
      <div className="min-h-screen">
        <Header title="Products" subtitle="Manage insurance products" />

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
              />
            </div>
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>

          <DataTable columns={columns} data={filteredProducts} emptyMessage="No products found" />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Product Code</Label>
                  <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                      value={formData.category}
                      onValueChange={(value) =>
                          setFormData({ ...formData, category: value as InsuranceProduct['category'] })
                      }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Insurer</Label>
                  <Select
                      value={formData.insurerId}
                      onValueChange={(value) => setFormData({ ...formData, insurerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select insurer" />
                    </SelectTrigger>
                    <SelectContent>
                      {insurers
                          .filter((i) => i.active)
                          .map((insurer) => (
                              <SelectItem key={insurer.id} value={insurer.id.toString()}>
                                {insurer.name}
                              </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePremium">Base Premium ($)</Label>
                  <Input
                      id="basePremium"
                      type="number"
                      value={formData.basePremium}
                      onChange={(e) => setFormData({ ...formData, basePremium: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseRate">Base Rate (% of Sum Insured)</Label>
                  <Input
                      id="baseRate"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 0.5 for 0.5%"
                      value={formData.baseRate}
                      onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Used for backend premium calculation</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
                {editingProduct ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Custom Fields Management Dialog */}
        <Dialog open={isFieldsDialogOpen} onOpenChange={setIsFieldsDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Custom Fields - {managingFieldsProduct?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <p className="text-sm text-muted-foreground">
                Define custom fields that will be collected during offer/policy creation. These fields will be sent to the backend for premium calculation.
              </p>

              {/* Existing Fields */}
              {customFields.length > 0 && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Current Fields ({customFields.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {customFields.map((field) => (
                          <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{field.label}</span>
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">{field.type}</span>
                                {field.required && <span className="text-xs text-destructive">Required</span>}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Field: {field.name}
                                {field.factorMultiplier && field.factorMultiplier !== 1 && (
                                    <span className="ml-2">• Factor: ×{field.factorMultiplier}</span>
                                )}
                                {field.options && field.options.length > 0 && (
                                    <span className="ml-2">• Options: {field.options.join(', ')}</span>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveField(field.id)}>
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                      ))}
                    </CardContent>
                  </Card>
              )}

              {/* Add New Field */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Add New Field</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Field Name (code)</Label>
                      <Input
                          placeholder="e.g., building_year"
                          value={newField.name}
                          onChange={(e) => setNewField({ ...newField, name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Display Label</Label>
                      <Input
                          placeholder="e.g., Year of Building"
                          value={newField.label}
                          onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Field Type</Label>
                      <Select
                          value={newField.type}
                          onValueChange={(value) => setNewField({ ...newField, type: value as ProductCustomField['type'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Factor Multiplier</Label>
                      <Input
                          type="number"
                          step="0.01"
                          placeholder="1.0"
                          value={newField.factorMultiplier}
                          onChange={(e) => setNewField({ ...newField, factorMultiplier: parseFloat(e.target.value) || 0.01 })}
                      />
                      <p className="text-xs text-muted-foreground">Premium multiplier</p>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                          checked={newField.required}
                          onCheckedChange={(checked) => setNewField({ ...newField, required: checked })}
                      />
                      <Label>Required</Label>
                    </div>
                  </div>

                  {newField.type === 'select' && (
                      <div className="space-y-2">
                        <Label>Options (comma separated)</Label>
                        <Input
                            placeholder="e.g., Concrete, Wood, Brick, Steel"
                            value={newField.options?.join(', ')}
                            onChange={(e) => setNewField({
                              ...newField,
                              options: e.target.value.split(',').map(o => o.trim()).filter(o => o)
                            })}
                        />
                      </div>
                  )}

                  <div className="space-y-2">
                    <Label>Placeholder Text</Label>
                    <Input
                        placeholder="e.g., Enter the year..."
                        value={newField.placeholder}
                        onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                    />
                  </div>

                  <Button onClick={handleAddField} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFieldsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveFields} className="bg-primary hover:bg-primary/90">
                Save Fields
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}