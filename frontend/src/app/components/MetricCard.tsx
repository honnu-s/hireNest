import { Card, CardContent } from './ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  description?: string;

  /** NEW */
  iconBgClass?: string;
  iconColorClass?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  iconBgClass = 'bg-primary/10',
  iconColorClass = 'text-primary',
}: MetricCardProps) {
  return (
    <Card className="rounded-none">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>

            <p className="text-3xl font-semibold mt-2">{value}</p>

            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}

            {trend && (
              <p
                className={`text-sm mt-2 ${
                  trend.positive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.positive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>

          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBgClass}`}
          >
            <Icon className={`w-6 h-6 ${iconColorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
