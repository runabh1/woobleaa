import { Status } from '@/types';
import { cn } from '@/lib/utils/cn';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const statusConfig: Record<Status, { label: string; className: string; dot: string }> = {
  Active: {
    label: 'Active',
    className: 'badge-active',
    dot: 'bg-green-400',
  },
  'Expiring Soon': {
    label: 'Expiring Soon',
    className: 'badge-warning',
    dot: 'bg-amber-400',
  },
  Expired: {
    label: 'Expired',
    className: 'badge-danger',
    dot: 'bg-red-400',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function StatusBadge({ status, size = 'md', animated = false }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium',
        config.className,
        sizeClasses[size]
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full flex-shrink-0 bg-current',
          animated && status === 'Expiring Soon' && 'animate-pulse',
          animated && status === 'Expired' && 'critical-pulse'
        )}
      />
      {config.label}
    </span>
  );
}

interface CategoryBadgeProps {
  category: string;
}

const categoryColors: Record<string, { text: string; border: string }> = {
  'Vendor Contract':         { text: 'text-sky-400',     border: 'border-sky-500/30' },
  'Compliance Certificate':  { text: 'text-indigo-400',  border: 'border-indigo-500/30' },
  'Safety Training':         { text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Insurance Policy':        { text: 'text-cyan-400',    border: 'border-cyan-500/30' },
  'Inspection Report':       { text: 'text-amber-400',   border: 'border-amber-500/30' },
  'Government License':      { text: 'text-rose-400',    border: 'border-rose-500/30' },
  Other:                     { text: 'text-slate-400',   border: 'border-slate-500/30' },
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const colors = categoryColors[category] ?? categoryColors.Other;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md text-xs font-medium px-2 py-0.5 border bg-white/[0.04] whitespace-nowrap',
        colors.text,
        colors.border
      )}
    >
      {category}
    </span>
  );
}

interface HighRiskBadgeProps {
  className?: string;
}

export function HighRiskBadge({ className }: HighRiskBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md text-[11px] font-bold px-2 py-0.5 border',
        'bg-red-500/15 text-red-400 border border-red-500/30',
        className
      )}
    >
      ⚠ Risk
    </span>
  );
}
