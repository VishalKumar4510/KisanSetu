import React from 'react';
import { FileText, Download } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface PaymentHistoryProps {
  paymentHistory: any[];
  paymentFilter: string;
  setPaymentFilter: (st: string) => void;
  onViewReceipt: (procurementId: string) => void;
  onDownloadReceipt: (procurementId: string) => void;
  downloadingPdf: boolean;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  paymentHistory,
  paymentFilter,
  setPaymentFilter,
  onViewReceipt,
  onDownloadReceipt,
  downloadingPdf,
}) => {
  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'success', label: 'Success' },
    { id: 'processing', label: 'Processing' },
    { id: 'failed', label: 'Failed' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600 mr-1">Filter:</span>
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPaymentFilter(opt.id)}
              className={`min-h-9 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center ${
                paymentFilter === opt.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {paymentHistory.length} reconciled entries
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200 text-xs tracking-wider">
            <tr>
              <th className="py-3 px-4">Farmer</th>
              <th className="py-3 px-4">Token</th>
              <th className="py-3 px-4 text-right">Disbursed Amount</th>
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-4">UTR Reference</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Receipt Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paymentHistory.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-500">
                  No payment records matching filter
                </td>
              </tr>
            ) : (
              paymentHistory.map((p) => {
                const isCompleted = p.status === 'COMPLETED' || p.status === 'SUCCESS';

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{p.farmerName}</span>
                      <span className="font-mono text-xs text-slate-500">{p.farmerId}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.tokenNumber}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right tabular-nums">
                      {formatCurrency(p.netAmount)}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      <span className="max-w-[150px] truncate block" title={p.transactionId}>
                        {p.transactionId || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      <span className="max-w-[130px] truncate block" title={p.utr}>
                        {p.utr || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {p.completedAt
                        ? new Date(p.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : p.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isCompleted ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewReceipt(p.procurementId)}
                            className="min-h-8 px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                            title="View digital procurement receipt"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => onDownloadReceipt(p.procurementId)}
                            disabled={downloadingPdf}
                            className="min-h-8 px-2.5 py-1 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg flex items-center gap-1 transition-colors shadow-2xs disabled:opacity-50"
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
