import { ActivityLog } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  UserPlus, 
  FileText, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Edit, 
  RefreshCw,
  Shield,
  Download,
  Upload,
  DollarSign,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityTimelineProps {
  activities: ActivityLog[];
  maxHeight?: string;
}

const activityIcons: Record<string, React.ElementType> = {
  CLIENT_CREATED: UserPlus,
  CLIENT_UPDATED: Edit,
  POLICY_CREATED: FileText,
  POLICY_UPDATED: Edit,
  POLICY_RENEWED: RefreshCw,
  POLICY_CANCELLED: XCircle,
  PAYMENT_UPLOADED: Upload,
  PAYMENT_VALIDATED: CheckCircle,
  PAYMENT_REJECTED: XCircle,
  GDPR_SIGNED: Shield,
  DOCUMENT_UPLOADED: Upload,
  DOCUMENT_DOWNLOADED: Download,
  COMMISSION_PAID: DollarSign,
  STATUS_CHANGED: Activity,
  OFFER_CREATED: FileText,
  OFFER_ACCEPTED: CheckCircle,
  OFFER_EXPIRED: XCircle,
};

const activityColors: Record<string, string> = {
  CLIENT_CREATED: 'bg-primary text-primary-foreground',
  CLIENT_UPDATED: 'bg-blue-500 text-white',
  POLICY_CREATED: 'bg-primary text-primary-foreground',
  POLICY_UPDATED: 'bg-blue-500 text-white',
  POLICY_RENEWED: 'bg-success text-white',
  POLICY_CANCELLED: 'bg-destructive text-white',
  PAYMENT_UPLOADED: 'bg-warning text-black',
  PAYMENT_VALIDATED: 'bg-success text-white',
  PAYMENT_REJECTED: 'bg-destructive text-white',
  GDPR_SIGNED: 'bg-primary text-primary-foreground',
  DOCUMENT_UPLOADED: 'bg-blue-500 text-white',
  DOCUMENT_DOWNLOADED: 'bg-muted-foreground text-white',
  COMMISSION_PAID: 'bg-success text-white',
  STATUS_CHANGED: 'bg-muted-foreground text-white',
  OFFER_CREATED: 'bg-primary text-primary-foreground',
  OFFER_ACCEPTED: 'bg-success text-white',
  OFFER_EXPIRED: 'bg-warning text-black',
};

export function ActivityTimeline({ activities, maxHeight = '400px' }: ActivityTimelineProps) {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  };

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No activity recorded yet
      </div>
    );
  }

  return (
      // Adaugam 'overflow-y-auto' pentru a forta scrollbar-ul nativ.
      // Pastram stilul cu maxHeight ca sa ia valoarea primita din props (ex: 250px sau 500px).
      <div style={{ maxHeight }} className="pr-2 overflow-y-auto">
        <div className="relative pb-4">
          {/* Timeline line - am facut linia un pic mai de inalta sa arate bine la scroll */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-6">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.activityType] || Activity;
              const colorClass = activityColors[activity.activityType] || 'bg-muted text-muted-foreground';
              const { time, date } = formatDateTime(activity.createdAt);

              return (
                  <div key={activity.id} className="relative flex gap-4 pl-0">
                    {/* Icon */}
                    <div className={cn(
                        "relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border",
                        colorClass
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            by {activity.performedByName}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-medium text-foreground">{time}</p>
                          <p className="text-xs text-muted-foreground">{date}</p>
                        </div>
                      </div>
                    </div>
                  </div>
              );
            })}
          </div>
        </div>
      </div>
  );
}
