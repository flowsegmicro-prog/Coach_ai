import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  info?: string;
}

export function MetricCard({ label, children, className, info }: MetricCardProps) {
  return (
    <div className={cn('card p-5', className)}>
      <div className="mb-3 flex items-center gap-1.5">
        <span className="label">{label}</span>
        {info && <Info className="h-3 w-3 text-app-muted/60" aria-label={info} />}
      </div>
      {children}
    </div>
  );
}
