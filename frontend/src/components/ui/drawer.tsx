import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'right' | 'left' | 'bottom' | 'top';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function Drawer({
  isOpen,
  onClose,
  position = 'right',
  size = 'md',
  closeOnOutsideClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  children,
  className,
  ariaLabel,
}: DrawerProps) {
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  const horizontalSizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-[95vw]',
  }[size];

  const verticalSizeStyles = {
    sm: 'max-h-[30vh]',
    md: 'max-h-[50vh]',
    lg: 'max-h-[75vh]',
    xl: 'max-h-[90vh]',
    full: 'max-h-[96vh]',
  }[size];

  const positionStyles = {
    right: 'inset-y-0 right-0 w-full ' + horizontalSizeStyles + ' animate-slideInRight',
    left: 'inset-y-0 left-0 w-full ' + horizontalSizeStyles,
    bottom: 'inset-x-0 bottom-0 w-full ' + verticalSizeStyles + ' rounded-t-3xl animate-slideUp',
    top: 'inset-x-0 top-0 w-full ' + verticalSizeStyles + ' rounded-b-3xl',
  }[position];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (closeOnOutsideClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          'fixed flex flex-col bg-white p-6 shadow-2xl border-gray-200 text-[#17201A] transition-all duration-300',
          positionStyles,
          className
        )}
      >
        {position === 'bottom' && (
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto -mt-2 mb-3" />
        )}

        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="absolute top-4 right-4 p-1.5 rounded-xl text-[#64748B] hover:text-[#17201A] hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/40"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function DrawerHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('pb-4 mb-4 border-b border-gray-100 space-y-1 pr-8', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DrawerTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-[18px] sm:text-[20px] font-bold text-[#17201A] tracking-tight leading-snug',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function DrawerDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-[#64748B] leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function DrawerBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex-1 overflow-y-auto pr-1 py-1 space-y-4', className)} {...props}>
      {children}
    </div>
  );
}

export function DrawerFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'pt-4 mt-4 border-t border-gray-100 flex items-center justify-end gap-2.5 flex-wrap',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Drawer;
