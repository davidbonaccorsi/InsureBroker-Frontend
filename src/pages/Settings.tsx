import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function Settings() {
  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Configure system preferences" />

      <div className="p-6 space-y-6 max-w-3xl">
        {/* API Configuration */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">API Configuration</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configure your Spring Boot backend connection settings.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">API Base URL</Label>
              <Input
                id="apiUrl"
                placeholder="http://localhost:8080/api"
                defaultValue="http://localhost:8080/api"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Request Timeout (ms)</Label>
              <Input id="timeout" type="number" placeholder="30000" defaultValue="30000" />
            </div>
          </div>
        </div>

        <Separator />

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
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Commission Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Notify when commissions are due for payment
                </p>
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
              <Label htmlFor="pageSize">Items per page</Label>
              <Input id="pageSize" type="number" placeholder="10" defaultValue="10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency Format</Label>
              <Input id="currency" placeholder="USD" defaultValue="USD" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Input id="dateFormat" placeholder="YYYY-MM-DD" defaultValue="YYYY-MM-DD" />
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
