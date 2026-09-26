import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  unit?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  secondaryText?: string;
  description?: string;
  className?: string;
  valueClassName?: string;
  iconClassName?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  unit,
  change,
  changeType = 'positive',
  secondaryText,
  description,
  className,
  valueClassName,
  iconClassName,
}: StatsCardProps) {
  const subText = secondaryText || description;

  return (
    <Card className={cn('overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs hover:shadow-md hover:border-gray-300 transition-all duration-200', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-5">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          {title}
        </CardTitle>
        {icon && (
          <div className={cn('p-2.5 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center shadow-xs', iconClassName)}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <div className="flex items-baseline gap-1.5">
          <span className={cn('text-[28px] sm:text-[32px] font-extrabold leading-none tracking-tight text-[#17201A]', valueClassName)}>
            {value}
          </span>
          {unit && (
            <span className="text-xs font-semibold text-[#64748B]">
              {unit}
            </span>
          )}
        </div>
        {(change || subText) && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs">
            {change && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-semibold px-2 py-0.5 rounded-full text-[11px]',
                  changeType === 'positive' && 'text-[#15803D] bg-[#F0FDF4] border border-green-200/60',
                  changeType === 'negative' && 'text-[#DC2626] bg-[#FEF2F2] border border-red-200/60',
                  changeType === 'neutral' && 'text-[#64748B] bg-gray-100 border border-gray-200/60'
                )}
              >
                {changeType === 'positive' && <TrendingUp className="w-3 h-3 stroke-[2.5]" />}
                {changeType === 'negative' && <TrendingDown className="w-3 h-3 stroke-[2.5]" />}
                {changeType === 'neutral' && <Minus className="w-3 h-3 stroke-[2.5]" />}
                {change}
              </span>
            )}
            {subText && (
              <span className="text-[#64748B] font-medium truncate text-xs">
                {subText}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StatsCard;
