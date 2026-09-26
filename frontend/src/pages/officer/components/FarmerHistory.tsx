import React from 'react';
import { FileText, Download } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface FarmerHistoryProps {
  farmerHistoryData: any;
  loadingHistory: boolean;
  onViewReceipt: (procurementId: string) => void;
  onDownloadReceipt: (procurementId: string) => void;
  onNavigateToDirectory: () => void;
}

export const FarmerHistory: React.FC<FarmerHistoryProps> = ({
  farmerHistoryData,
  loadingHistory,
  onViewReceipt,
  onDownloadReceipt,
  onNavigateToDirectory,
}) => {
  if (loadingHistory) {
    return <p className="text-xs text-slate-400 py-8 text-center">Loading farmer profile & lot history...</p>;
  }

  if (!farmerHistoryData) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-xs">No farmer selected. Click on any farmer card in the Live Queue to inspect their past lot history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900">
            {farmerHistoryData.name} ({farmerHistoryData.farmerId})
          </h4>
          <p className="text-xs text-slate-500">
            {farmerHistoryData.village}, {farmerHistoryData.district} • Crop: {farmerHistoryData.crop}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span>Past Lots: <b>{farmerHistoryData.previousProcurementCount}</b></span>
          <span>Total Quantity: <b>{farmerHistoryData.totalQuantityProcured} Qt</b></span>
          <span>
            Disbursed:{' '}
            <b className="text-emerald-700 font-mono">
              {formatCurrency(farmerHistoryData.totalAmountPaid || 0)}
            </b>
          </span>
          <button
            type="button"
            onClick={onNavigateToDirectory}
            className="min-h-9 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
          >
            Open Farmer Directory
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200 text-xs tracking-wider">
            <tr>
              <th className="py-2.5 px-4">Date</th>
              <th className="py-2.5 px-4">Token</th>
              <th className="py-2.5 px-4">Crop</th>
              <th className="py-2.5 px-4">Quantity</th>
              <th className="py-2.5 px-4">Grade</th>
              <th className="py-2.5 px-4 text-right">Disbursed Amount</th>
              <th className="py-2.5 px-4">Payment Status</th>
              <th className="py-2.5 px-4">UTR Reference</th>
              <th className="py-2.5 px-4 text-right">Receipt Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {farmerHistoryData.records?.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-6 text-slate-500">
                  No previous lots recorded
                </td>
              </tr>
            ) : (
              farmerHistoryData.records?.map((rec: any) => {
                const isCompleted =
                  rec.paymentStatus === 'COMPLETED' || rec.paymentStatus === 'SUCCESS';

                return (
                  <tr key={rec.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-mono">{rec.date}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{rec.tokenNumber}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-700">{rec.crop}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{rec.quantity} Qt</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-700">Grade {rec.qualityGrade}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 text-right tabular-nums">
                      {formatCurrency(rec.amount)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}
                      >
                        {rec.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-600">
                      <span className="max-w-[130px] truncate block" title={rec.utr}>
                        {rec.utr || '—'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {isCompleted ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewReceipt(rec.id)}
                            className="min-h-8 px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                            title="View digital procurement receipt"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => onDownloadReceipt(rec.id)}
                            className="min-h-8 px-2.5 py-1 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                            title="Download PDF procurement receipt"
                          >
                            <Download className="w-3.5 h-3.5 text-white" />
                            PDF
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No receipt</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
