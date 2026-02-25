import { cn } from '@/lib/utils';

type StatusType = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING' | 'SUSPENDED' | 'PAID' | 'COMPLETED' | 'DECLINED';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-success/10 text-success border-success/20',
  PAID: 'bg-success/10 text-success border-success/20',
  COMPLETED: 'bg-success/10 text-success border-success/20',
  EXPIRED: 'bg-muted text-muted-foreground border-muted-foreground/20',
  CANCELLED: 'bg-destructive/10 text-destructive border-destructive/20',
  DECLINED: 'bg-destructive/10 text-destructive border-destructive/20',
  PENDING: 'bg-warning/10 text-warning border-warning/20',
  SUSPENDED: 'bg-warning/10 text-warning border-warning/20',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.PENDING;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        style,
        className
      )}
    >
      {status}
    </span>
  );
}
