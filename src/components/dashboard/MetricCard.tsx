import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel = 'vs mes anterior',
  icon,
  className 
}: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const isNeutral = change === 0 || change === undefined;

  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-5 card-hover",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
            isPositive && "text-sport-success bg-sport-success/10",
            isNegative && "text-destructive bg-destructive/10",
            isNeutral && "text-muted-foreground bg-muted"
          )}>
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            {isNeutral && <Minus className="w-3 h-3" />}
            <span>{isPositive ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      
      {change !== undefined && (
        <p className="text-xs text-muted-foreground mt-2">{changeLabel}</p>
      )}
    </div>
  );
}
