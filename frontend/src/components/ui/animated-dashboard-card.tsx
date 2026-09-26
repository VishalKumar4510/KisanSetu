import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AnimatedDashboardCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'emerald' | 'cream' | 'white' | 'deep';
  glow?: boolean;
  withDots?: boolean;
}

export const AnimatedDashboardCard = React.forwardRef<HTMLDivElement, AnimatedDashboardCardProps>(
  (
    {
      className,
      children,
      variant = 'white',
      glow = true,
      withDots = true,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      white: 'bg-white border-slate-200/90 text-[#17201A] shadow-sm hover:border-emerald-300',
      emerald: 'bg-gradient-to-br from-[#F0FDF4] via-white to-emerald-50/60 border-emerald-200/80 text-[#14532D] shadow-sm hover:border-emerald-400',
      cream: 'bg-gradient-to-br from-[#FEFCE8] via-white to-amber-50/50 border-amber-200/80 text-amber-950 shadow-sm hover:border-amber-400',
      deep: 'bg-gradient-to-br from-[#14532D] via-[#16A34A] to-[#15803D] border-emerald-600/40 text-white shadow-md',
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className={cn(
          'group relative overflow-hidden rounded-3xl border transition-all duration-300',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {/* Sophisticated Dot Pattern from 21st.dev reference */}
        {withDots && (
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 [background-size:16px_16px] transition-opacity duration-300 group-hover:opacity-40',
              variant === 'deep'
                ? 'bg-[radial-gradient(rgba(255,255,255,0.2)_1px,transparent_1px)] opacity-20'
                : 'bg-[radial-gradient(#16A34A_1.2px,transparent_1.2px)] opacity-20'
            )}
          />
        )}

        {/* Ambient Glow Gradients */}
        {glow && (
          <>
            <div
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-2xl transition-all duration-500 group-hover:scale-110',
                variant === 'deep'
                  ? 'bg-white/10'
                  : 'bg-emerald-400/15 group-hover:bg-emerald-400/25'
              )}
            />
            <div
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full blur-2xl transition-all duration-500',
                variant === 'deep'
                  ? 'bg-emerald-950/40'
                  : 'bg-amber-300/10'
              )}
            />
          </>
        )}

        {/* Card Content Container */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);

AnimatedDashboardCard.displayName = 'AnimatedDashboardCard';
