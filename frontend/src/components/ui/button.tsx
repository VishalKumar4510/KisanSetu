import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost' | 'outline' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] select-none';

    const variantStyles = {
      primary:
        'bg-[#16A34A] hover:bg-[#15803D] active:bg-[#166534] text-white shadow-xs hover:shadow-sm focus-visible:ring-[#16A34A]/40',
      secondary:
        'bg-white hover:bg-gray-50 active:bg-gray-100 text-[#17201A] border border-gray-200 shadow-xs hover:shadow-sm focus-visible:ring-[#16A34A]/30',
      danger:
        'bg-[#DC2626] hover:bg-red-700 active:bg-red-800 text-white shadow-xs hover:shadow-sm focus-visible:ring-[#DC2626]/40',
      warning:
        'bg-[#F59E0B] hover:bg-amber-600 active:bg-amber-700 text-white shadow-xs hover:shadow-sm focus-visible:ring-[#F59E0B]/40',
      ghost:
        'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-[#64748B] hover:text-[#17201A] focus-visible:ring-[#16A34A]/30',
      outline:
        'bg-transparent hover:bg-[#F0FDF4] active:bg-green-100 text-[#16A34A] border border-[#16A34A]/80 shadow-xs hover:shadow-sm focus-visible:ring-[#16A34A]/30',
      soft:
        'bg-[#F0FDF4] hover:bg-green-100 active:bg-green-200 text-[#14532D] border border-green-200/60 focus-visible:ring-[#16A34A]/30',
    };

    const sizeStyles = {
      sm: 'text-xs py-1.5 px-3.5 gap-1.5',
      md: 'text-sm py-2.5 px-5 gap-2',
      lg: 'text-base py-3 px-6 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
