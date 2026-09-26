import React from 'react';
import { AlertCircle } from 'lucide-react';
import { AlertItem } from './OfficerHeader';

interface AlertsPanelProps {
  alerts: AlertItem[];
  onViewAll: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onViewAll }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Mandi Alerts
        </span>
        <button
          type="button"
          onClick={onViewAll}
          className="min-h-9 px-3 rounded-lg text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          View all alerts
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {alerts.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">No active alerts</p>
        ) : (
          alerts.slice(0, 3).map((a) => (
            <div
              key={a.id}
              className={`p-2.5 rounded-xl border text-xs ${
                a.read
                  ? 'bg-slate-50 border-slate-100 text-slate-600'
                  : 'bg-amber-50/50 border-amber-200/60 text-slate-800 font-medium'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{a.title}</span>
                <span className="text-xs text-slate-400">
                  {new Date(a.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{a.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
