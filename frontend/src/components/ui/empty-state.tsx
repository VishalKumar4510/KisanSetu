import * as React from 'react';
import { PackageOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'soft' | 'danger';
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
  bordered?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  bordered = false,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center mx-auto',
        compact ? 'py-6 px-4' : 'py-12 px-6',
        bordered && 'rounded-2xl border border-gray-200/80 bg-white shadow-xs',
        className
      )}
      {...props}
    >
      {/* Icon Circle */}
      <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mb-3.5 shadow-xs">
        {icon || <PackageOpen className="w-7 h-7 stroke-[1.8]" />}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-[#17201A] tracking-tight">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2.5 mt-5 flex-wrap justify-center">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              size="sm"
              onClick={action.onClick}
              leftIcon={action.icon}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
  bordered?: boolean;
}

export function ErrorState({
  icon,
  title = 'Unable to Load Data',
  message,
  description,
  onRetry,
  retryLabel = 'Try Again',
  compact = false,
  bordered = false,
  className,
  ...props
}: ErrorStateProps) {
  const displayMsg =
    description ||
    message ||
    'An unexpected error occurred while communicating with the Mandi network. Please try again.';
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center mx-auto',
        compact ? 'py-6 px-4' : 'py-12 px-6',
        bordered && 'rounded-2xl border border-red-200/80 bg-red-50/20 shadow-xs',
        className
      )}
      {...props}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-3.5 shadow-xs border border-red-100">
        {icon || <AlertCircle className="w-7 h-7 stroke-[1.8]" />}
      </div>

      <h3 className="text-base font-bold text-[#17201A] tracking-tight">
        {title}
      </h3>

      {displayMsg && (
        <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-sm leading-relaxed">
          {displayMsg}
        </p>
      )}

      {onRetry && (
        <div className="mt-5">
          <Button
            variant="danger"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmptyState;
