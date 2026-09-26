import React from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface ReceiptModalProps {
  show: boolean;
  onClose: () => void;
  receiptData: any;
  downloadingPdf: boolean;
  downloadSuccess: boolean;
  downloadError: string | null;
  onDownloadPdf: () => void;
  onPrint: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  show,
  onClose,
  receiptData,
  downloadingPdf,
  downloadSuccess,
  downloadError,
  onDownloadPdf,
  onPrint,
}) => {
  if (!show || !receiptData) return null;

  const dateStr = receiptData.receiptDate
    ? new Date(receiptData.receiptDate).toLocaleString('en-IN')
    : new Date().toLocaleString('en-IN');

  const proc = receiptData.procurement || {};
  const farmer = receiptData.farmer || {};
  const payment = receiptData.payment || {};

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200/80 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-700 rounded-lg flex items-center justify-center text-white">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Digital Procurement Receipt</h3>
              <p className="text-xs text-slate-500">Demo / Simulated Environment • KisanSetu</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Layout */}
        <div id="print-receipt-content" className="p-6 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-4 font-mono text-xs">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-3">
            <div>
              <span className="font-bold text-base text-slate-900 font-sans block">KisanSetu</span>
              <span className="text-slate-500 text-xs block font-sans">Agricultural Mandi Operations Console</span>
              <span className="text-emerald-700 text-xs font-bold block font-sans">Demo / Simulated Environment</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-900 block">{receiptData.receiptNumber || 'REC-2026-0001'}</span>
              <span className="text-slate-400 text-xs block">{dateStr}</span>
            </div>
          </div>

          {/* Mandi & Farmer Info */}
          <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3 text-xs">
            <div>
              <span className="text-slate-500 block text-xs font-sans">Centre & Location:</span>
              <span className="font-bold text-slate-800">{proc.centreName || 'Krishi Upaj Mandi'}</span>
              <span className="text-slate-500 block">{proc.centreLocation || 'Bay #01'} (Scale: {proc.scaleId || 'Weighbridge #01'})</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-sans">Farmer Beneficiary:</span>
              <span className="font-bold text-slate-800">{farmer.name} ({farmer.farmerId})</span>
              <span className="text-slate-500 block">{farmer.village}, {farmer.district}</span>
              <span className="text-slate-500 block">Bank A/C: {farmer.maskedBankAccount || '•••• •••• •••• 4119'}</span>
            </div>
          </div>

          {/* Weighment & Quality Details */}
          <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-3 text-xs">
            <div>
              <span className="text-slate-500 block text-xs font-sans">Weighment:</span>
              <span>Gross: <b>{proc.grossWeight} Qt</b></span>
              <span className="block">Tare: <b>{proc.tareWeight} Qt</b></span>
              <span className="block text-emerald-800 font-bold">Net: {proc.netQuantity} Qt</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-sans">Quality Standards:</span>
              <span>Crop: <b>{proc.crop}</b></span>
              <span className="block">Grade: <b>{proc.qualityGrade} (FAQ)</b></span>
              <span className="block">Moisture: <b>{proc.moistureContent}%</b></span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-sans">Pricing & MSP:</span>
              <span>Configured Base: <b>{formatCurrency(proc.baseRate || 0)}/Qt</b></span>
              <span className="block">Adj: <b>+{formatCurrency(proc.qualityAdjustment || 0)}/Qt</b></span>
              <span className="block font-bold">Effective: {formatCurrency(proc.finalRate || 0)}/Qt</span>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-1.5 border-b border-slate-200 pb-3">
            <div className="flex justify-between text-slate-600">
              <span>Gross Commodity Value:</span>
              <span className="tabular-nums font-bold text-slate-900">{formatCurrency(proc.grossAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-rose-700">
              <span>Configured Mandi Cess (2%):</span>
              <span className="tabular-nums">-{formatCurrency(proc.deductions || 0)}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-emerald-900 pt-1">
              <span>TOTAL DISBURSED (DBT):</span>
              <span className="tabular-nums">{formatCurrency(proc.finalPayableAmount || 0)}</span>
            </div>
          </div>

          {/* Simulated Payment Transaction Audit */}
          <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-200 pb-3">
            <div>
              <span className="text-slate-500 block text-xs font-sans">Transaction Reference:</span>
              <span className="font-mono text-xs text-slate-700 block">{payment.transactionId || 'KS-TXN-...'}</span>
              <span className="font-mono text-xs text-slate-700 block">UTR: {payment.utr || '982440385255'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-sans">Payment Mode & Status:</span>
              <span className="text-slate-700 block">{payment.paymentMethod || 'DBT (Demo Payment Workflow)'}</span>
              <span className="text-emerald-800 font-bold uppercase">{payment.status || 'COMPLETED'}</span>
            </div>
          </div>

          {/* Officer Verification */}
          <div className="flex justify-between items-center px-1 text-xs text-slate-500">
            <span>Officer Verification: <b className="text-slate-800">{receiptData.officerName || 'Officer Verma'}</b></span>
            <span className="font-mono text-xs text-slate-500">Ref: KS-AUDIT-VERIFIED</span>
          </div>

          {/* Demo / Simulated Environment Disclaimer */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900">
            <span className="font-bold block mb-0.5">Demo / Simulated Environment</span>
            <p className="text-slate-600 leading-snug">
              Payment information shown here is part of a simulated demonstration workflow. No real bank transaction was initiated.
            </p>
          </div>
        </div>

        {/* Error or Success notification */}
        {downloadSuccess && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>✓ Downloaded successfully</span>
          </div>
        )}

        {downloadError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
            <span>{downloadError}</span>
            <button type="button" onClick={onDownloadPdf} className="text-xs font-bold text-rose-700 underline">
              Retry
            </button>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" /> Print
          </button>
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={downloadingPdf}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {downloadingPdf ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
