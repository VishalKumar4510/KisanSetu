import React from 'react';
import { OfficerStats } from './MetricsPanel';
import { SettlementData, SettlementSummary } from '@shared/types';

interface AnalyticsPanelProps {
  stats: OfficerStats | null;
  settlementData: SettlementData | SettlementSummary | null;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  stats,
  settlementData,
}) => {
  const currentTotalQty = stats?.totalQuantityProcured || settlementData?.totalQuantity || 286.4;

  const hourlyBars = [
    { hour: '8am', count: 4, height: '28%' },
    { hour: '9am', count: 8, height: '54%' },
    { hour: '10am', count: 14, height: '94%' },
    { hour: '11am', count: 11, height: '74%' },
    { hour: '12pm', count: 6, height: '40%' },
    { hour: '2pm', count: 9, height: '60%' },
    { hour: '3pm', count: 5, height: '35%' },
  ];

  const weeklyBars = [
    { day: 'Mon', qty: 240, height: '65%' },
    { day: 'Tue', qty: 310, height: '85%' },
    { day: 'Wed', qty: 285, height: '78%' },
    { day: 'Thu', qty: 340, height: '95%' },
    { day: 'Fri', qty: currentTotalQty, height: '82%' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 1. Hourly Flow */}
      <div className="p-5 bg-slate-50/60 rounded-xl border border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center justify-between">
          <span>Hourly Mandi Queue Flow</span>
          <span className="text-[10px] text-slate-400 font-normal">Arrivals Today</span>
        </h4>
        <div className="h-44 flex items-end justify-between gap-3 px-2">
          {hourlyBars.map((bar) => (
            <div key={bar.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[10px] font-bold text-slate-700">{bar.count}</span>
              <div
                style={{ height: bar.height }}
                className="w-full bg-emerald-600 rounded-t-md hover:bg-emerald-500 transition-all"
              />
              <span className="text-[10px] text-slate-400 font-medium">{bar.hour}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Weekly Volume */}
      <div className="p-5 bg-slate-50/60 rounded-xl border border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4 flex items-center justify-between">
          <span>Procurement Volume Breakdown (Qt)</span>
          <span className="text-[10px] text-slate-500 font-semibold">
            Today: {currentTotalQty} Qt
          </span>
        </h4>
        <div className="h-44 flex items-end justify-between gap-3 px-2">
          {weeklyBars.map((bar) => (
            <div key={bar.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[10px] font-bold text-slate-800">{bar.qty}</span>
              <div
                style={{ height: bar.height }}
                className="w-full bg-slate-800 rounded-t-md hover:bg-slate-700 transition-all"
              />
              <span className="text-[10px] text-slate-400 font-medium">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
