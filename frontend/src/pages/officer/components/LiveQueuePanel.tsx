import React from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Pause,
  Search,
  Clock,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  History,
  X,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

export interface QueueRow {
  tokenId: string;
  tokenNumber: string;
  position: number;
  farmerId: string;
  farmerInternalId: string;
  farmerName: string;
  farmerPhone: string;
  village: string;
  district: string;
  crop: string;
  quantity: string;
  arrivalTime: string;
  status: string;
  estimatedWaitTime: string;
  procurementId: string | null;
  tokenStatus: string;
}

interface LiveQueuePanelProps {
  filteredQueue: QueueRow[];
  currentFarmerTokenId?: string;
  isQueuePaused: boolean;
  refreshing: boolean;
  queueSearch: string;
  setQueueSearch: (val: string) => void;
  queueFilter: string;
  setQueueFilter: (val: string) => void;
  queueSort: 'position' | 'arrival' | 'name';
  setQueueSort: (val: 'position' | 'arrival' | 'name') => void;
  onCallFarmer: (tokenId?: string) => void;
  onResumeQueue: () => void;
  onSelectFarmerHistory: (farmerInternalId: string) => void;
  onNavigateToFullQueue?: () => void;
}

export const LiveQueuePanel: React.FC<LiveQueuePanelProps> = ({
  filteredQueue,
  currentFarmerTokenId,
  isQueuePaused,
  refreshing,
  queueSearch,
  setQueueSearch,
  queueFilter,
  setQueueFilter,
  queueSort,
  setQueueSort,
  onCallFarmer,
  onResumeQueue,
  onSelectFarmerHistory,
  onNavigateToFullQueue,
}) => {
  return (
    <section className="w-full space-y-3" aria-label="Queue Management">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Console Header Bar */}
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping" />
              Queue Management Console
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
              {filteredQueue.length} Active Lots
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/officer/queue"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
              title="Open full dedicated Queue page"
            >
              <span>Full Queue Screen</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => onCallFarmer()}
              disabled={refreshing || isQueuePaused}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Phone className="w-3.5 h-3.5" /> Call Next Farmer
            </button>
          </div>
        </div>

        {/* Queue Paused Notification Banner */}
        {isQueuePaused && (
          <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <Pause className="w-3.5 h-3.5 text-amber-700" /> Mandi Queue is Paused by Operator
            </span>
            <button
              type="button"
              onClick={onResumeQueue}
              className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold shadow-2xs"
            >
              Resume Queue
            </button>
          </div>
        )}

        {/* Filters, Search & Sort Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Instant Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by token number, farmer name, or Kisan ID..."
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 focus:bg-white transition-all"
            />
            {queueSearch && (
              <button
                type="button"
                onClick={() => setQueueSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            {[
              { key: 'ALL', label: 'All Lots' },
              { key: 'WAITING', label: 'Waiting' },
              { key: 'CALLED', label: 'Called' },
              { key: 'WEIGHING', label: 'Weighing' },
              { key: 'QUALITY_CHECK', label: 'QC' },
              { key: 'PAYMENT_PENDING', label: 'Payment' },
              { key: 'COMPLETED', label: 'Completed' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setQueueFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors flex items-center justify-center ${
                  queueFilter === f.key
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Compact Sort Buttons */}
          <div className="flex items-center gap-1 shrink-0 self-end md:self-auto">
            <span className="text-[11px] font-semibold text-slate-500">Sort:</span>
            {[
              { key: 'position' as const, label: 'Position' },
              { key: 'arrival' as const, label: 'Arrival' },
              { key: 'name' as const, label: 'Name' },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setQueueSort(s.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  queueSort === s.key
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* High-Density Operational Queue Table */}
        <div className="overflow-x-auto">
          {filteredQueue.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">No queue items match the selected filter</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 select-none">
                  <th className="py-2.5 px-4 w-28">Token</th>
                  <th className="py-2.5 px-4">Farmer Details</th>
                  <th className="py-2.5 px-4 w-36">Crop / Quantity</th>
                  <th className="py-2.5 px-4 w-32">Status</th>
                  <th className="py-2.5 px-4 w-36">Wait Time</th>
                  <th className="py-2.5 px-4 w-44 text-right">Operational Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.map((item) => {
                  const isCurrent = currentFarmerTokenId === item.tokenId;
                  const isCompleted = item.status === 'COMPLETED' || item.tokenStatus === 'USED';
                  const isRejected = item.status === 'REJECTED';
                  const isWaiting = item.status === 'WAITING' || item.status === 'BOOKED';

                  return (
                    <tr
                      key={item.tokenId}
                      tabIndex={0}
                      onClick={() => onSelectFarmerHistory(item.farmerInternalId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onSelectFarmerHistory(item.farmerInternalId);
                      }}
                      className={`transition-colors cursor-pointer focus:outline-none focus:bg-emerald-50/50 ${
                        isCurrent
                          ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600 font-medium'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* 1. Token & Position */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/70">
                            {item.tokenNumber}
                          </span>
                          <span className="font-mono font-bold text-slate-500 text-xs">
                            #{item.position}
                          </span>
                        </div>
                      </td>

                      {/* 2. Farmer Name & ID */}
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {item.farmerName}
                            </span>
                            {item.village && (
                              <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
                                ({item.village})
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-slate-500 block truncate">
                            {item.farmerId} • {item.farmerPhone || 'Verified'}
                          </span>
                        </div>
                      </td>

                      {/* 3. Crop & Declared Quantity */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 text-xs block">
                          {item.crop}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {item.quantity}
                        </span>
                      </td>

                      {/* 4. Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={item.status} size="sm" />
                      </td>

                      {/* 5. Arrival & Wait Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-xs">
                          <span className="text-slate-800 font-mono font-medium block">
                            {item.arrivalTime}
                          </span>
                          <span className="text-[10px] text-amber-700 font-semibold block">
                            {item.estimatedWaitTime}
                          </span>
                        </div>
                      </td>

                      {/* 6. Operational Action Button */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectFarmerHistory(item.farmerInternalId);
                            }}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                            title="View Farmer History"
                          >
                            History
                          </button>

                          {!isCompleted && !isRejected ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCallFarmer(item.tokenId);
                              }}
                              disabled={isCurrent || isQueuePaused || !isWaiting}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 ${
                                isCurrent
                                  ? 'bg-emerald-100 text-emerald-800 cursor-default'
                                  : !isWaiting
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              }`}
                            >
                              <Phone className="w-3 h-3" />
                              <span>{isCurrent ? 'At Bay' : !isWaiting ? 'In Workflow' : 'Call'}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium px-2 py-1">
                              Finished
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
};
