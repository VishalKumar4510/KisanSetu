import * as React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BottomNavItem {
  icon: LucideIcon;
  label: string;
  path?: string;
  action?: () => void;
  isMenu?: boolean;
}

export interface FarmerBottomNavBarProps {
  items: BottomNavItem[];
  activePath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

export function FarmerBottomNavBar({
  items,
  activePath,
  onNavigate,
  className,
}: FarmerBottomNavBarProps) {
  return (
    <nav
      aria-label="Farmer Mobile Bottom Navigation"
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 py-2 safe-bottom',
        className
      )}
    >
      {/* Floating Pill Container with Glassmorphism from 21st.dev reference */}
      <div className="mx-auto max-w-md bg-white/95 backdrop-blur-lg border border-slate-200/90 rounded-2xl shadow-lg px-2 py-1.5 flex items-center justify-around gap-1">
        {items.map((item, index) => {
          const isActive = Boolean(item.path && activePath === item.path);

          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                if (item.action) {
                  item.action();
                } else if (item.path) {
                  onNavigate(item.path);
                }
              }}
              className={cn(
                'relative flex items-center justify-center py-2 px-2.5 rounded-xl transition-colors duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
                isActive
                  ? 'text-[#14532D] font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {/* Framer Motion Active Pill Background */}
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-50 to-green-100/80 border border-emerald-200/90 shadow-2xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}

              <div className="relative z-10 flex items-center gap-1.5">
                <item.icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200 shrink-0',
                    isActive ? 'scale-110 text-[#16A34A] stroke-[2.4]' : 'stroke-[1.8]'
                  )}
                />

                {/* Animated in/out label from 21st.dev reference */}
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs font-bold whitespace-nowrap text-[#14532D] overflow-hidden leading-none"
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default FarmerBottomNavBar;
