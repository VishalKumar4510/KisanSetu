import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'success'
    | 'deep'
    | 'info'
    | 'warning'
    | 'error'
    | 'cream'
    | 'outline'
    | 'muted';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  dotColor?: string;
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  dotColor,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-gray-100 text-[#17201A] border-gray-200/60',
    primary: 'bg-[#F0FDF4] text-[#15803D] border-green-200/80',
    success: 'bg-[#F0FDF4] text-[#15803D] border-green-200/80',
    deep: 'bg-[#14532D] text-white border-transparent',
    info: 'bg-[#EFF6FF] text-[#2563EB] border-blue-200/70',
    warning: 'bg-[#FFFBEB] text-[#B45309] border-amber-200/70',
    error: 'bg-[#FEF2F2] text-[#DC2626] border-red-200/70',
    cream: 'bg-[#FEFCE8] text-amber-950 border-amber-200/80',
    outline: 'bg-transparent text-[#64748B] border-gray-300',
    muted: 'bg-gray-100/90 text-[#64748B] border-gray-200/50',
  };

  const dotColorStyles: Record<string, string> = {
    default: 'bg-gray-500',
    primary: 'bg-[#16A34A]',
    success: 'bg-[#16A34A]',
    deep: 'bg-emerald-300',
    info: 'bg-[#2563EB]',
    warning: 'bg-[#F59E0B]',
    error: 'bg-[#DC2626]',
    cream: 'bg-amber-600',
    outline: 'bg-gray-400',
    muted: 'bg-[#64748B]',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold border tracking-wide transition-colors duration-150',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0 animate-pulse',
            dotColor || dotColorStyles[variant] || 'bg-current'
          )}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
