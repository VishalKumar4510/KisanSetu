import * as React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Tooltip,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, LineChart, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MetricSparkPoint {
  val: number;
  label?: string;
}

export interface ProgressMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subText?: string;
  icon?: React.ReactNode;
  data?: MetricSparkPoint[];
  color?: string;
  allowToggleView?: boolean;
  defaultChartType?: 'area' | 'bar';
  className?: string;
}

export function ProgressMetricCard({
  title,
  value,
  unit,
  change,
  changeType = 'positive',
  subText,
  icon,
  data = [],
  color = '#16A34A',
  allowToggleView = true,
  defaultChartType = 'area',
  className,
}: ProgressMetricCardProps) {
  const [chartType, setChartType] = React.useState<'area' | 'bar'>(defaultChartType);

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all duration-200 hover:border-emerald-300 hover:shadow-xs flex flex-col justify-between',
        className
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && (
            <div className="p-1.5 rounded-lg bg-emerald-50 text-[#16A34A] shrink-0 border border-emerald-100/60">
              {icon}
            </div>
          )}
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </span>
        </div>

        {/* Toggle between Area Curve and Bars (from 21st.dev reference) */}
        {allowToggleView && (
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/60 shrink-0">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={cn(
                'p-1 rounded-md transition-colors',
                chartType === 'area'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              )}
              title="Show Curve"
              aria-label="Show Curve"
            >
              <LineChart className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={cn(
                'p-1 rounded-md transition-colors',
                chartType === 'bar'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              )}
              title="Show Bars"
              aria-label="Show Bars"
            >
              <BarChart2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Main Metric Value & Trend Badge */}
      <div className="flex items-baseline justify-between gap-2 my-1">
        <div className="flex items-baseline gap-1 truncate">
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-[#17201A] truncate">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-semibold text-slate-400">
              {unit}
            </span>
          )}
        </div>

        {change && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0',
              changeType === 'positive' && 'bg-emerald-50 text-[#15803D] border border-emerald-200/60',
              changeType === 'negative' && 'bg-rose-50 text-rose-700 border border-rose-200/60',
              changeType === 'neutral' && 'bg-slate-100 text-slate-600 border border-slate-200/60'
            )}
          >
            {changeType === 'positive' && <TrendingUp className="w-3 h-3 stroke-[2.5]" />}
            {changeType === 'negative' && <TrendingDown className="w-3 h-3 stroke-[2.5]" />}
            {changeType === 'neutral' && <Minus className="w-3 h-3 stroke-[2.5]" />}
            {change}
          </span>
        )}
      </div>

      {/* Micro Recharts Sparkline */}
      <div className="h-10 w-full mt-2 pt-1">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' && data.length > 1 ? (
              <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${title.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Tooltip content={() => null} />
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad-${title.replace(/[^a-zA-Z0-9]/g, '')})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <Tooltip content={() => null} />
                <Bar
                  dataKey="val"
                  fill={color}
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-full border-b border-dashed border-slate-200" />
          </div>
        )}
      </div>

      {/* Optional Subtext / Context */}
      {subText && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate">{subText}</span>
        </div>
      )}
    </div>
  );
}

export default ProgressMetricCard;
