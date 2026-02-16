import { useData, type ActionType } from '../../contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useEffect, useState } from 'react';
import { Pagination } from '../Pagination';

import { 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus, 
  RefreshCw,
  Clock
} from 'lucide-react';

const actionIcons = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  assign: UserPlus,
  status_change: RefreshCw
};

const actionColors = {
  create: 'text-green-600 dark:text-green-400',
  update: 'text-blue-600 dark:text-blue-400',
  delete: 'text-red-600 dark:text-red-400',
  assign: 'text-purple-600 dark:text-purple-400',
  status_change: 'text-orange-600 dark:text-orange-400'
};

export function RecentActivityCard() {
  
  const {
    auditLogs,
    fetchAuditLogs,
    auditCurrentPage,
    auditTotalPages,
  } = useData();

  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAuditLogs(page, 5); 
  }, [page]);
  const recentLogs = auditLogs;

 const formatTimeAgo = (timestamp: string | Date) => {
  const date = timestamp instanceof Date
    ? timestamp
    : new Date(timestamp);

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest system actions across all entities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            recentLogs.map((log) => {
              const ActionIcon = actionIcons[log.actionType];
              
              return (
                <div key={log.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                  <div className={`p-2 rounded-lg bg-muted mt-0.5 ${actionColors[log.actionType]}`}>
                    <ActionIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{log.entityName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {getActionLabel(log.actionType)} by {log.performedByName}
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
      <Pagination
  currentPage={auditCurrentPage}
  totalPages={auditTotalPages}
  onPageChange={(newPage) => setPage(newPage)}
/>

    </Card>
  );
}
