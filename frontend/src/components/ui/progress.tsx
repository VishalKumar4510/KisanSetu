import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'deep' | 'info' | 'warning' | 'error' | 'gradient';
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
}

export function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = false,
  label,
  animate = true,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variantStyles = {
    primary: 'bg-[#16A34A]',
    deep: 'bg-[#14532D]',
    info: 'bg-[#2563EB]',
    warning: 'bg-[#F59E0B]',
    error: 'bg-[#DC2626]',
    gradient: 'gradient-green',
  };

  return (
    <div className={cn('w-full space-y-1.5', className)} {...props}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs text-[#64748B] font-medium">
          <span>{label || 'Progress'}</span>
          <span className="font-semibold text-[#17201A]">{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress indicator'}
        className={cn(
          'w-full bg-gray-100/90 rounded-full overflow-hidden border border-gray-200/40',
          sizeStyles[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full',
            animate && 'transition-all duration-500 ease-out',
            variantStyles[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default Progress;
