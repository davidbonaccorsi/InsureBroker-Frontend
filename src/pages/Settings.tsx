import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useSettings } from '@/contexts/SettingsContext';
import { useState } from 'react';

export default function Settings() {
  const { currency, setCurrency } = useSettings();
  const [localCurrency, setLocalCurrency] = useState(currency);

  const handleSave = () => {
    setCurrency(localCurrency.toUpperCase());
    toast.success('Settings saved successfully');
  };

  return (
      <div className="min-h-screen">
        <Header title="Settings" subtitle="Configure system preferences" />

        <div className="p-6 space-y-6 max-w-3xl">
          {/* Notification Settings */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Policy Expiry Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for expiring policies
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Renewal Reminders</p>
                  <p className="text-sm text-muted-foreground">Get reminders for pending renewals</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          <Separator />

          {/* Display Settings */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Display Settings</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">System Currency (e.g. USD, EUR, GBP)</Label>
                <Input
                    id="currency"
                    value={localCurrency}
                    onChange={(e) => setLocalCurrency(e.target.value)}
                    maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format (Display Only)</Label>
                <Input id="dateFormat" placeholder="YYYY-MM-DD" defaultValue="YYYY-MM-DD" disabled />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              Save Settings
            </Button>
          </div>
        </div>
      </div>
  );
}