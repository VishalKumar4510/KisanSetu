import React from 'react';
import { Scale, ChevronRight } from 'lucide-react';
import { ScaleItem } from './WeighmentStep';

interface EquipmentPanelProps {
  scales: ScaleItem[];
  onToggleScaleStatus: (id: string, currentStatus: string) => void;
}

export const EquipmentPanel: React.FC<EquipmentPanelProps> = ({
  scales,
  onToggleScaleStatus,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-5 shadow-xs">
      <div className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-slate-600" /> Demo Equipment Telemetry
          </span>
          <span className="text-xs text-slate-500 font-mono px-2 py-0.5 bg-slate-100 rounded-md">
            {scales.length} Units
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Click unit to simulate telemetry status</p>
      </div>

      <div className="mt-3 space-y-2">
        {scales.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onToggleScaleStatus(s.id, s.status)}
            className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 hover:shadow-2xs transition-all flex items-center justify-between cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-600"
            title="Click to toggle telemetry status between ONLINE, BUSY, OFFLINE, MAINTENANCE"
            aria-label={`Change status for ${s.name}. Current status: ${s.status}.`}
          >
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                {s.name}
              </p>
              <span className="text-xs text-slate-500 font-mono">
                Cap: {s.capacityKg} kg • Calib: {s.lastCalibrationDate}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  s.status === 'ONLINE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : s.status === 'BUSY'
                    ? 'bg-amber-50 text-amber-700'
                    : s.status === 'OFFLINE'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {s.status}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
