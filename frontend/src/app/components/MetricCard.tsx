import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  description?: string;
  iconBgClass?: string;
  iconColorClass?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  iconBgClass = 'bg-indigo-100 dark:bg-indigo-500/15',
  iconColorClass = 'text-indigo-600 dark:text-indigo-400',
  className = '',
}: MetricCardProps) {
  return (
    <div className={`metric-card animate-fade-in-up group ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight text-foreground" >
            {value}
          </p>

          {description && (
            <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
          )}

          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
            }`}>
              {trend.positive
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${iconBgClass}`}>
          <Icon className={`w-5 h-5 ${iconColorClass}`} />
        </div>
      </div>
    </div>
  );
}
