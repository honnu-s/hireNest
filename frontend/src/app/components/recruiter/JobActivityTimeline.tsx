import { useData, type ActionType } from '../../contexts/DataContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus, 
  RefreshCw 
} from 'lucide-react';

const actionIcons = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  assign: UserPlus,
  status_change: RefreshCw
};

const actionColors = {
  create: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  update: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  delete: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  assign: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  status_change: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
};

interface JobActivityTimelineProps {
  jobId: string;
}

export function JobActivityTimeline({ jobId }: JobActivityTimelineProps) {
  const { auditLogs } = useData();

  const relevantLogs = auditLogs.filter(
  log => log.entityType === 'job' || log.entityType === 'application'
);

  
const formatDate = (timestamp: string | Date) => {
  const date = timestamp instanceof Date
    ? timestamp
    : new Date(timestamp);

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};


  const getActionLabel = (action: ActionType) => {
    const labels = {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      assign: 'Assigned',
      status_change: 'Status Changed'
    };
    return labels[action];
  };

  if (relevantLogs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No activity recorded for this job yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {relevantLogs.map((log, index) => {
        const ActionIcon = actionIcons[log.actionType];
        const isLast = index === relevantLogs.length - 1;

        return (
          <div key={log.id} className="flex gap-3 relative">
            {!isLast && (
              <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
            )}

            {/* Icon */}
            <div className={`relative z-10 p-2 rounded-lg border ${actionColors[log.actionType]}`}>
              <ActionIcon className="w-4 h-4" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="font-medium text-sm">
                    {getActionLabel(log.actionType)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by {log.performedByName}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(log.timestamp)}
                </span>
              </div>

              {log.details && (
                <p className="text-sm text-muted-foreground">
                  {log.details}
                </p>
              )}

              {log.entityType === 'application' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Related to: {log.entityName}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
