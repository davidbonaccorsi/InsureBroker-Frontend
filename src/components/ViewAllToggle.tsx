import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ViewAllToggleProps {
  showAll: boolean;
  onToggle: (show: boolean) => void;
  label?: string;
}

export function ViewAllToggle({ showAll, onToggle, label = "View all brokers' data" }: ViewAllToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="view-all" className="text-sm font-normal cursor-pointer">
        {label}
      </Label>
      <Switch
        id="view-all"
        checked={showAll}
        onCheckedChange={onToggle}
      />
    </div>
  );
}
