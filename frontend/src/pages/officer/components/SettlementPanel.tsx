import React from 'react';
import { Printer, X } from 'lucide-react';
import { OfficerStats } from './MetricsPanel';
import { formatCurrency } from '../../../utils/formatters';

interface SettlementPanelProps {
  settlementData: any;
  stats: OfficerStats | null;
  user: any;
  showDailyReportModal: boolean;
  setShowDailyReportModal: (show: boolean) => void;
}

export const SettlementPanel: React.FC<SettlementPanelProps> = ({
  settlementData,
  stats,
  user,
  showDailyReportModal,
  setShowDailyReportModal,
}) => {
  const farmersServed = settlementData?.farmersServed || stats?.farmersServedToday || 42;
  const completedLots = settlementData?.lotsCompleted || stats?.completedLots || 31;
  const rejectedLots = settlementData?.lotsRejected || stats?.rejectedLots || 2;
  const totalQty = settlementData?.totalQuantity || stats?.totalQuantityProcured || 286.4;
  const grossVal = settlementData?.grossProcurementValue || 664880;
  const deductions = settlementData?.totalDeductions || 13300;
  const netDisbursed = settlementData?.netDisbursed || (grossVal - deductions);

  const paymentsCompleted = settlementData?.paymentsCompleted || stats?.paymentsCompleted || 29;
  const paymentsProcessing = settlementData?.paymentsProcessing || stats?.paymentsPending || 2;
  const paymentsFailed = settlementData?.paymentsFailed || stats?.failedPayments || 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Today's End-of-Day Settlement</h4>
          <p className="text-xs text-slate-500">KisanSetu Daily Demo Settlement Report</p>
        </div>
        <button
          type="button"
          onClick={() => setShowDailyReportModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <Printer className="w-3.5 h-3.5" /> Generate Daily Report
        </button>
      </div>

      <div className="max-w-xl bg-slate-50 rounded-xl p-5 border border-slate-200/80 font-mono text-xs space-y-3">
        <div className="flex justify-between border-b border-slate-200 pb-2">
          <span className="font-bold text-slate-900 uppercase">TODAY'S DEMO SETTLEMENT</span>
          <span className="text-slate-500">{settlementData?.date || new Date().toISOString().split('T')[0]}</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-600">Farmers Served</span>
            <span className="font-bold text-slate-900">{farmersServed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Completed Lots</span>
            <span className="font-bold text-emerald-800">{completedLots}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Rejected Lots</span>
            <span className="font-bold text-rose-700">{rejectedLots}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Total Quantity</span>
            <span className="font-bold text-slate-900">{totalQty} Qt</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Gross Procurement Value</span>
            <span className="font-bold text-slate-900 tabular-nums">{formatCurrency(grossVal)}</span>
          </div>
          <div className="flex justify-between text-rose-700">
            <span>Configured Deductions (2%)</span>
            <span className="tabular-nums">-{formatCurrency(deductions)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-emerald-900 border-t border-slate-200 pt-2">
            <span>Net Disbursed</span>
            <span className="tabular-nums">{formatCurrency(netDisbursed)}</span>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-3 space-y-1.5">
          <span className="text-xs text-slate-500 uppercase font-bold block">Payment Reconciliation</span>
          <div className="flex justify-between text-slate-700">
            <span>Completed (DBT Settled)</span>
            <span className="font-bold text-emerald-800">{paymentsCompleted}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Processing</span>
            <span className="font-bold text-amber-700">{paymentsProcessing}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Failed (Retry Available)</span>
            <span className="font-bold text-rose-700">{paymentsFailed}</span>
          </div>
        </div>
      </div>

      {/* PRINTABLE REPORT MODAL */}
      {showDailyReportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200/80 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                KisanSetu Daily Demo Settlement Report
              </span>
              <button onClick={() => setShowDailyReportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="print-settlement-content" className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 font-mono text-xs">
              <div className="text-center pb-3 border-b border-slate-200">
                <h3 className="font-extrabold text-sm text-slate-900">KisanSetu Daily Demo Settlement Report</h3>
                <p className="text-slate-500 text-[10px]">Agricultural Mandi Procurement • Simulated Operations Console</p>
                <p className="font-semibold text-slate-700 mt-1">Date: {new Date().toLocaleDateString('en-IN')}</p>
              </div>

              <div className="space-y-1.5 py-1">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Farmers Served:</span>
                  <span className="font-bold text-slate-900">{farmersServed}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Completed Lots:</span>
                  <span className="font-bold text-emerald-800">{completedLots}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Rejected Lots:</span>
                  <span className="font-bold text-rose-700">{rejectedLots}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Total Quantity:</span>
                  <span className="font-bold text-slate-900">{totalQty} Qt</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Gross Procurement Value:</span>
                  <span className="font-bold text-slate-900">₹{grossVal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-rose-700">
                  <span>Mandi Deductions (2%):</span>
                  <span>-₹{deductions.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-sm text-emerald-900">
                  <span>Net Disbursed:</span>
                  <span>₹{netDisbursed.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                <span>Certified by: {user?.name || 'Officer Verma'}</span>
                <span>Demo Settlement Batch Ref: KS-DEMO-EOD-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDailyReportModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" /> Print Settlement Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
