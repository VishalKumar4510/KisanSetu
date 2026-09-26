import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'light' | 'primary' | 'soft' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'xl' | 'full';
  isLoading?: boolean;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = 'ghost',
      size = 'md',
      rounded = 'xl',
      isLoading = false,
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-95 shrink-0';

    const roundedStyles = {
      xl: 'rounded-xl',
      full: 'rounded-full',
    };

    const variantStyles = {
      ghost:
        'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-[#64748B] hover:text-[#17201A] focus-visible:ring-[#16A34A]/30',
      light:
        'bg-white hover:bg-gray-50 active:bg-gray-100 text-[#17201A] border border-gray-200 shadow-xs hover:shadow-sm focus-visible:ring-[#16A34A]/30',
      primary:
        'bg-[#16A34A] hover:bg-[#15803D] active:bg-[#166534] text-white shadow-xs hover:shadow-sm focus-visible:ring-[#16A34A]/40',
      soft:
        'bg-[#F0FDF4] hover:bg-green-100 active:bg-green-200 text-[#14532D] border border-green-200/60 focus-visible:ring-[#16A34A]/30',
      outline:
        'bg-transparent hover:bg-gray-50 active:bg-gray-100 text-[#64748B] hover:text-[#17201A] border border-gray-300 shadow-xs focus-visible:ring-[#16A34A]/30',
      danger:
        'bg-[#DC2626] hover:bg-red-700 active:bg-red-800 text-white shadow-xs hover:shadow-sm focus-visible:ring-[#DC2626]/40',
    };

    const sizeStyles = {
      sm: 'w-8 h-8 text-sm p-1.5',
      md: 'w-10 h-10 text-base p-2.5',
      lg: 'w-12 h-12 text-lg p-3',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(
          baseStyles,
          roundedStyles[rounded],
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          children
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
export default IconButton;
