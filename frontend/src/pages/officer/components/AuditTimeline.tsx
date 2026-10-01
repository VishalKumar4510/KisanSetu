import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ProcurementTimelineEvent } from '@shared/types';

interface AuditTimelineProps {
  timeline: ProcurementTimelineEvent[];
  showFullTimeline: boolean;
  setShowFullTimeline: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({
  timeline,
  showFullTimeline,
  setShowFullTimeline,
}) => {
  const displayedTimeline = showFullTimeline ? timeline : timeline.slice(-4);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Mandi Workflow Audit Trail</h4>
          <p className="text-xs text-slate-500">Immutable trace events for current and historical lot steps</p>
        </div>
        <button
          onClick={() => setShowFullTimeline((prev) => !prev)}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
        >
          {showFullTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showFullTimeline ? 'Show Recent Events' : `Show All Events (${timeline.length})`}
        </button>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {displayedTimeline.length === 0 ? (
          <p className="text-slate-400 py-6 text-center">No audit events logged yet</p>
        ) : (
          displayedTimeline.map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 block">{item.label}</span>
                <span className="text-[10px] text-slate-400">Actor: {item.actor || 'System Automation'}</span>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
