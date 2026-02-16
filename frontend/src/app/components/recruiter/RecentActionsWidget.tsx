import { useData, type ActionType } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Plus,
  Edit,
  Trash2,
  UserPlus,
  RefreshCw,
  Activity
} from 'lucide-react';

const actionIcons: Record<ActionType, any> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  assign: UserPlus,
  status_change: RefreshCw
};

const actionColors: Record<ActionType, string> = {
  create: 'text-green-600 dark:text-green-400',
  update: 'text-blue-600 dark:text-blue-400',
  delete: 'text-red-600 dark:text-red-400',
  assign: 'text-purple-600 dark:text-purple-400',
  status_change: 'text-orange-600 dark:text-orange-400'
};

export function RecentActionsWidget() {
  const { auditLogs } = useData();
  const { user } = useAuth();

  const relevantLogs = auditLogs.slice(0, 5);


  const formatTimeAgo = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  const getActionLabel = (action: ActionType) => {
    const labels: Record<ActionType, string> = {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      assign: 'Assigned',
      status_change: 'Status Changed'
    };
    return labels[action];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Actions
        </CardTitle>
        <CardDescription>Your recent activities</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {relevantLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent actions
            </p>
          ) : (
            relevantLogs.map(log => {
              const ActionIcon = actionIcons[log.actionType] ?? Activity;

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div
                    className={`p-2 rounded-lg bg-muted mt-0.5 ${actionColors[log.actionType]}`}
                  >
                    <ActionIcon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium truncate">
                          {log.entityName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getActionLabel(log.actionType)} by you
                        </p>
                      </div>

                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(log.timestamp)}
                      </span>
                    </div>

                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
