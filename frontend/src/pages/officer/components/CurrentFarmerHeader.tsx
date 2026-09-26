import React from 'react';
import { Phone } from 'lucide-react';

interface CurrentFarmerHeaderProps {
  currentFarmerData: any;
  currentStatus: string;
  centres: any[];
  selectedCentre: string;
  crop: string;
  calculationData: any;
  isQueuePaused: boolean;
  onCallFarmer: () => void;
}

export const CurrentFarmerHeader: React.FC<CurrentFarmerHeaderProps> = ({
  currentFarmerData,
  currentStatus,
  centres,
  selectedCentre,
  crop,
  calculationData,
  isQueuePaused,
  onCallFarmer,
}) => {
  if (!currentFarmerData) {
    return (
      <div className="pb-5 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900">
              Current Farmer Workbench
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              Idle
            </span>
          </div>
        </div>
        <div className="mt-4 p-8 bg-slate-50/90 border-2 border-dashed border-slate-200 rounded-2xl text-center">
          <p className="text-base font-bold text-slate-900 mb-1.5">
            No farmer is currently being served
          </p>
          <p className="text-xs text-slate-600 mb-4 max-w-md mx-auto">
            Call the next farmer from the queue to initiate weighing, quality inspection, and procurement settlement.
          </p>
          <button
            onClick={onCallFarmer}
            disabled={isQueuePaused}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs inline-flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Phone className="w-4 h-4" /> Call Next Farmer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4 border-b border-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold text-slate-900">
            Current Farmer Workbench
          </h2>
          <span className="text-xs font-medium text-slate-500">
            Active Session
          </span>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            currentStatus === 'COMPLETED'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              : currentStatus === 'PAYMENT_PROCESSING'
              ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
              : currentStatus === 'PAYMENT_PENDING' || calculationData
              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
          }`}
        >
          {calculationData && currentStatus !== 'COMPLETED' && currentStatus !== 'PAYMENT_PROCESSING'
            ? 'Payment Ready'
            : currentStatus}
        </span>
      </div>

      {/* Current Farmer Grid */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-xs">
        <div>
          <span className="text-xs text-slate-500 font-semibold block">Farmer Name</span>
          <span className="font-bold text-slate-900 block truncate mt-0.5">
            {currentFarmerData.farmer?.name || 'Farmer'}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-semibold block">Farmer ID</span>
          <span className="font-mono text-slate-700 block truncate mt-0.5">
            {currentFarmerData.farmer?.farmerId || '—'}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-semibold block">Token Number</span>
          <span className="font-mono font-bold text-slate-900 block mt-0.5">
            {currentFarmerData.token?.tokenNumber ? `#${currentFarmerData.token.tokenNumber}` : '—'}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-semibold block">Crop</span>
          <span className="font-semibold text-slate-900 block mt-0.5">
            {currentFarmerData.produce?.type || crop || 'WHEAT'}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-semibold block">Centre</span>
          <span className="text-slate-700 block truncate mt-0.5">
            {centres.find((c) => c.id === selectedCentre)?.name || 'Grain Mandi Bay #01'}
          </span>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-semibold block">Current Status</span>
          <span className="font-semibold text-slate-900 block mt-0.5">
            {currentStatus === 'COMPLETED' ? 'Completed & Disbursed' : currentStatus}
          </span>
        </div>
      </div>
    </div>
  );
};
