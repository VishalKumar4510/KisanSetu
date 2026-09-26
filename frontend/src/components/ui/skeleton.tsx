import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function Skeleton({
  className,
  rounded = 'xl',
  ...props
}: SkeletonProps) {
  const roundedStyles = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-gray-200/80 shrink-0',
        roundedStyles,
        className
      )}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 2,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2 w-full', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-3.5',
            i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonStatsCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-3',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3.5 w-20" />
    </div>
  );
}

export function SkeletonCard({
  className,
  hasImage = false,
}: {
  className?: string;
  hasImage?: boolean;
}) {
  return (
    <div
      className={cn(
        'p-5 rounded-2xl bg-white border border-gray-200/80 shadow-xs space-y-4',
        className
      )}
    >
      {hasImage && <Skeleton className="h-36 w-full rounded-xl" />}
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols,
  columns = 4,
  className,
}: {
  rows?: number;
  cols?: number;
  columns?: number;
  className?: string;
}) {
  const columnCount = cols ?? columns;
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200/80 bg-white overflow-hidden p-4 space-y-3',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-4 pb-3 border-b border-gray-100">
        {Array.from({ length: columnCount }).map((_, c) => (
          <Skeleton key={c} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
          {Array.from({ length: columnCount }).map((_, c) => (
            <Skeleton key={c} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
