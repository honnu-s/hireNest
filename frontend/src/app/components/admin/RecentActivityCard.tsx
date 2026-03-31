import { useData, type ActionType } from '../../contexts/DataContext';
import { useEffect, useState } from 'react';
import { Pagination } from '../Pagination';
import { Plus, Edit, Trash2, UserPlus, RefreshCw, Clock } from 'lucide-react';

const icons = { create: Plus, update: Edit, delete: Trash2, assign: UserPlus, status_change: RefreshCw };
const iconCls: Record<ActionType, string> = {
  create:        ' text-xl text-emerald-900  dark:text-emerald-600',
  update:        ' text-blue-900 dark:text-blue-600',
  delete:        ' text-red-900 dark:text-red-600',
  assign:        ' text-violet-900  dark:text-violet-600',
  status_change: ' text-amber-900  dark:text-amber-600',
};
const labels: Record<ActionType, string> = {
  create: 'Created', update: 'Updated', delete: 'Deleted', assign: 'Assigned', status_change: 'Status changed',
};

const timeAgo = (ts: string | Date) => {
  const d = ts instanceof Date ? ts : new Date(ts);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function RecentActivityCard() {
  const { auditLogs, fetchAuditLogs, auditCurrentPage, auditTotalPages } = useData();
  const [page, setPage] = useState(1);

  useEffect(() => { fetchAuditLogs(page, 6); }, [page]);

  return (
    <div className="ats-card">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          
          <div>
            <h3 className="text-sm font-semibold text-foreground" >
              Recent Activity
            </h3>
            <p className="text-xs text-muted-foreground">Latest actions across all entities</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {auditLogs.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          auditLogs.map((log) => {
            const Icon = icons[log.actionType];
            return (
              <div key={log.id} className="flex items-start gap-4 px-6 py-3.5 hover:bg-muted/30 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${iconCls[log.actionType]}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{log.entityName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {labels[log.actionType]} by{' '}
                    <span className="font-medium text-foreground/70">{log.performedByName}</span>
                  </p>
                  {log.details && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 ">{log.details}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 pt-0.5">
                  {timeAgo(log.timestamp)}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-border">
        <Pagination currentPage={auditCurrentPage} totalPages={auditTotalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
