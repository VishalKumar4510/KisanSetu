import * as React from 'react';
import { ChevronDown, ChevronUp, Clock, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface TimelineItem {
  id?: string | number;
  title: string;
  description?: React.ReactNode;
  timestamp?: string | Date;
  actor?: string;
  icon?: React.ReactNode;
  status?: 'completed' | 'active' | 'pending' | 'error' | 'warning' | 'info';
  badge?: React.ReactNode;
  children?: React.ReactNode;
}

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  items: TimelineItem[];
  orientation?: 'vertical' | 'horizontal';
  dense?: boolean;
  maxInitialItems?: number;
  collapsible?: boolean;
  emptyMessage?: string;
  headerTitle?: string;
  headerSubtitle?: string;
}

export function Timeline({
  items,
  orientation = 'vertical',
  dense = false,
  maxInitialItems = 5,
  collapsible = false,
  emptyMessage = 'No timeline events recorded',
  headerTitle,
  headerSubtitle,
  className,
  ...props
}: TimelineProps) {
  const [showAll, setShowAll] = React.useState(false);

  const displayedItems =
    collapsible && !showAll ? items.slice(-maxInitialItems) : items;

  const statusStyles = {
    completed: {
      dot: 'bg-[#16A34A] border-[#16A34A] text-white shadow-2xs ring-2 ring-emerald-100',
      icon: <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />,
    },
    active: {
      dot: 'bg-[#16A34A] border-[#16A34A] text-white ring-4 ring-[#16A34A]/25 shadow-xs animate-pulse',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    pending: {
      dot: 'bg-white border-slate-300 text-slate-400',
      icon: <span className="w-2 h-2 rounded-full bg-slate-300" />,
    },
    warning: {
      dot: 'bg-[#FFFBEB] border-[#F59E0B] text-[#F59E0B]',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
    error: {
      dot: 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626]',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
    info: {
      dot: 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]',
      icon: <Info className="w-3.5 h-3.5" />,
    },
  };

  const formatTime = (ts?: string | Date) => {
    if (!ts) return '';
    try {
      const d = typeof ts === 'string' ? new Date(ts) : ts;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return String(ts);
    }
  };

  return (
    <div className={cn('space-y-4', className)} {...props}>
      {(headerTitle || (collapsible && items.length > maxInitialItems)) && (
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            {headerTitle && (
              <h4 className="text-sm font-bold text-[#17201A]">{headerTitle}</h4>
            )}
            {headerSubtitle && (
              <p className="text-xs text-[#64748B]">{headerSubtitle}</p>
            )}
          </div>
          {collapsible && items.length > maxInitialItems && (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="text-xs font-semibold text-[#64748B] hover:text-[#17201A] flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Show Recent ({maxInitialItems})</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Show All ({items.length})</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-6 text-xs text-[#64748B]">
          {emptyMessage}
        </div>
      ) : (
        <div className="relative pl-7 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-[#16A34A] before:via-emerald-300 before:to-slate-200">
          {displayedItems.map((item, idx) => {
            const statusConfig = statusStyles[item.status || 'completed'];

            return (
              <div key={item.id ?? idx} className="relative group">
                {/* Node icon / indicator dot */}
                <div
                  className={cn(
                    'absolute -left-7 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110 shadow-2xs z-10',
                    statusConfig.dot
                  )}
                >
                  {item.icon || statusConfig.icon}
                </div>

                {/* Event Card Content */}
                <div
                  className={cn(
                    'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-200 hover:border-emerald-300 hover:shadow-xs',
                    dense ? 'p-2.5' : 'p-4'
                  )}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-[#17201A]">
                          {item.title}
                        </span>
                        {item.badge}
                      </div>
                      {item.description && (
                        <div className="text-xs text-[#64748B] mt-1 leading-relaxed">
                          {item.description}
                        </div>
                      )}
                      {item.actor && (
                        <span className="inline-block text-[11px] text-[#64748B] mt-1">
                          Actor: <strong className="font-medium text-[#17201A]">{item.actor}</strong>
                        </span>
                      )}
                      {item.children && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          {item.children}
                        </div>
                      )}
                    </div>

                    {item.timestamp && (
                      <span className="text-[11px] text-[#64748B] font-mono shrink-0 whitespace-nowrap bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatTime(item.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Timeline;
