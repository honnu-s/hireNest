import { useData, type ActionType } from '../../contexts/DataContext';
import { Plus, Edit, Trash2, UserPlus, RefreshCw, Activity } from 'lucide-react';

const icons = { create: Plus, update: Edit, delete: Trash2, assign: UserPlus, status_change: RefreshCw };
const iconCls: Record<ActionType, string> = {
  create: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/10 dark:text-emerald-400',
  update: 'bg-blue-100 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400',
  delete: 'bg-red-100 text-red-600 dark:bg-red-900/10 dark:text-red-400',
  assign: 'bg-violet-100 text-violet-600 dark:bg-violet-900/10 dark:text-violet-400',
  status_change: 'bg-amber-100 text-amber-600 dark:bg-amber-900/10 dark:text-amber-400',
};
const labels: Record<ActionType, string> = {
  create: 'Created', update: 'Updated', delete: 'Deleted', assign: 'Assigned', status_change: 'Status changed',
};
const timeAgo = (ts: string | Date) => {
  const d = new Date(ts), diff = Date.now() - d.getTime(), m = Math.floor(diff/60000);
  if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m/60); if (h < 24) return `${h}h ago`;
  const day = Math.floor(h/24); if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
};

export function RecentActionsWidget() {
  const { auditLogs } = useData();
  const logs = auditLogs.slice(0, 5);

  return (
    <div className="ats-card">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
        
        <div>
          <h3 className="text-sm font-semibold" style={{fontFamily:'Syne,sans-serif'}}>Recent Actions</h3>
          <p className="text-xs text-muted-foreground">Your latest activities</p>
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {logs.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Activity className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2"/>
            <p className="text-sm text-muted-foreground">No recent actions</p>
          </div>
        ) : logs.map(log => {
          const Icon = icons[log.actionType];
          return (
            <div key={log.id} className="flex items-start gap-4 px-6 py-3.5 hover:bg-muted/20 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconCls[log.actionType]}`}>
                <Icon className="w-3.5 h-3.5"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{log.entityName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{labels[log.actionType]} by {log.performedByName}</p>
                {log.details && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 ">{log.details}</p>}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{timeAgo(log.timestamp)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
