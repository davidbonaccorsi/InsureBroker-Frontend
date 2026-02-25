import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  iconColor?: string;
}

export function StatCard({ title, value, icon: Icon, change, changeLabel, iconColor }: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value mt-2">{value}</p>
          {change !== undefined && (
            <div
              className={cn(
                'stat-change',
                isPositive && 'stat-change-positive',
                isNegative && 'stat-change-negative'
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : isNegative ? (
                <TrendingDown className="w-3 h-3" />
              ) : null}
              <span>
                {isPositive && '+'}
                {change}% {changeLabel}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            iconColor || 'bg-primary/10'
          )}
        >
          <Icon className={cn('w-6 h-6', iconColor ? 'text-current' : 'text-primary')} />
        </div>
      </div>
    </div>
  );
}
