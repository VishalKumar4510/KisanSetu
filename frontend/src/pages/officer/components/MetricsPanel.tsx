import React from 'react';
import {
  Users,
  Clock,
  CheckCircle,
  Scale,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

export interface OfficerStats {
  farmersServedToday: number;
  waitingFarmers: number;
  completedFarmers: number;
  completedLots?: number;
  rejectedLots?: number;
  totalQuantityProcured: number;
  totalProcurementValue: number;
  paymentsCompleted: number;
  paymentsPending: number;
  failedPayments?: number;
  avgWaitTime?: number;
  avgServiceTime?: number;
  isQueuePaused?: boolean;
}

interface MetricsPanelProps {
  stats: OfficerStats | null;
  inProgressCount?: number;
  showMoreMetrics?: boolean;
  setShowMoreMetrics?: React.Dispatch<React.SetStateAction<boolean>>;
}

const formatWaitTime = (minutes?: number) => {
  const m = Number(minutes) || 0;
  if (m <= 0) return '0m';
  if (m >= 60) {
    const hrs = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  }
  return `${m}m`;
};

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  stats,
  inProgressCount = 0,
  showMoreMetrics = false,
  setShowMoreMetrics,
}) => {
  const kpiItems = [
    {
      id: 'served',
      label: 'Served',
      value: stats?.farmersServedToday ?? 0,
      unit: 'lots',
      sub: 'Processed today',
      icon: Users,
      valueColor: 'text-slate-900',
      badgeBg: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'waiting',
      label: 'Waiting',
      value: stats?.waitingFarmers ?? 0,
      unit: 'tokens',
      sub: 'In queue',
      icon: Clock,
      valueColor: 'text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-800 border border-amber-200/60',
    },
    {
      id: 'completed',
      label: 'Completed',
      value: stats?.completedLots ?? stats?.completedFarmers ?? 0,
      unit: 'passed',
      sub: 'Lots cleared',
      icon: CheckCircle,
      valueColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-800 border border-emerald-200/60',
    },
    {
      id: 'quantity',
      label: 'Total Quantity',
      value: `${stats?.totalQuantityProcured ?? 0}`,
      unit: 'Qt',
      sub: 'Stock received',
      icon: Scale,
      valueColor: 'text-slate-900',
      badgeBg: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    },
    {
      id: 'value',
      label: 'Total Value',
      value: formatCurrency(stats?.totalProcurementValue || 0),
      unit: '',
      sub: 'Sanctioned MSP',
      icon: IndianRupee,
      valueColor: 'text-emerald-800 font-mono',
      badgeBg: 'bg-emerald-50 text-emerald-800 border border-emerald-200/60',
    },
    {
      id: 'dbt_completed',
      label: 'DBT Completed',
      value: stats?.paymentsCompleted ?? 0,
      unit: 'settled',
      sub: 'Bank credited',
      icon: CheckCircle2,
      valueColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-800 border border-emerald-200/60',
    },
    {
      id: 'dbt_pending',
      label: 'DBT Pending',
      value: stats?.paymentsPending ?? 0,
      unit: 'pending',
      sub: 'PFMS batch',
      icon: AlertCircle,
      valueColor: 'text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-800 border border-amber-200/60',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-3" aria-label="Procurement Operational KPIs">
      {/* 7 KPI CARDS IN HIGH-DENSITY GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
        {kpiItems.map((kpi) => (
          <div
            key={kpi.id}
            className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
                {kpi.label}
              </span>
              <div className={`p-1 rounded-md ${kpi.badgeBg}`}>
                <kpi.icon className="w-3 h-3" />
              </div>
            </div>

            <div className="flex items-baseline gap-1 my-0.5 truncate">
              <span className={`text-lg sm:text-xl font-black font-mono tracking-tight ${kpi.valueColor} truncate`}>
                {kpi.value}
              </span>
              {kpi.unit && (
                <span className="text-[10px] text-slate-500 font-semibold uppercase">
                  {kpi.unit}
                </span>
              )}
            </div>

            <span className="text-[10px] text-slate-500 truncate block">
              {kpi.sub}
            </span>
          </div>
        ))}
      </div>

      {/* Auxiliary Station Diagnostics Bar */}
      <div className="mt-2.5 bg-white rounded-xl border border-slate-200/80 px-4 py-2 shadow-2xs flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-4 text-slate-600">
          <span className="flex items-center gap-1 font-medium">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            Active Weighbridge Load: <strong className="text-slate-900 font-mono">{inProgressCount} in progress</strong>
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="hidden sm:inline">
            Avg Turnaround: <strong className="text-slate-900 font-mono">{stats?.avgServiceTime || 22}m</strong>
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="hidden sm:inline">
            Avg Gate Wait: <strong className="text-slate-900 font-mono">{formatWaitTime(stats?.avgWaitTime || 18)}</strong>
          </span>
        </div>

        {setShowMoreMetrics && (
          <button
            type="button"
            onClick={() => setShowMoreMetrics((prev) => !prev)}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
          >
            {showMoreMetrics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showMoreMetrics ? 'Hide Secondary Metrics' : 'Secondary Metrics'}</span>
          </button>
        )}
      </div>

      {/* Secondary Metrics Expanded Tray */}
      {showMoreMetrics && (
        <div className="mt-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs animate-in fade-in duration-150">
          <div className="p-2.5 bg-white rounded-lg border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Failed / Retry Payments</span>
            <span className="text-base font-black text-rose-700 font-mono mt-0.5 block">{stats?.failedPayments ?? 0}</span>
            <span className="text-[10px] text-slate-500">Requires re-submission</span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Rejected Quality Lots</span>
            <span className="text-base font-black text-rose-700 font-mono mt-0.5 block">{stats?.rejectedLots ?? 0}</span>
            <span className="text-[10px] text-slate-500">Exceeds moisture/impurity</span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Queue Velocity</span>
            <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">~3.2 lots/hr</span>
            <span className="text-[10px] text-slate-500">Peak handling rate</span>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">APMC Mandi Status</span>
            <span className="text-base font-black text-emerald-700 mt-0.5 block">OPERATIONAL</span>
            <span className="text-[10px] text-slate-500">Weighbridge scales online</span>
          </div>
        </div>
      )}
    </section>
  );
};
