import React, { useState } from 'react';
import {
  ChevronRight,
  Check,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal';
import { CalculationData } from '@shared/types';

interface ProcurementStepProps {
  calculationData: CalculationData | null;
  isCompleted: boolean;
  refreshing: boolean;
  onCalculate: () => void;
  onProceedToPayment: () => void;
}

export const ProcurementStep: React.FC<ProcurementStepProps> = ({
  calculationData,
  isCompleted,
  refreshing,
  onCalculate,
  onProceedToPayment,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handlePreProceed = () => {
    setShowConfirmModal(true);
  };

  const handleExecuteProceed = () => {
    setShowConfirmModal(false);
    onProceedToPayment();
  };

  return (
    <div className="p-5 bg-white border border-slate-200/80 rounded-2xl space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Step 4 — Statutory Procurement Calculation
          </span>
        </div>
        {isCompleted ? (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            CALCULATION LOCKED
          </span>
        ) : (
          <span className="text-xs text-slate-500 font-medium">Official Mandi Settlement Formula</span>
        )}
      </div>

      {calculationData ? (
        <div className="space-y-4">
          {/* Statutory Calculation Voucher */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 font-sans">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Statutory Assessment Item
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Computed Value
              </span>
            </div>

            {/* 1. Quantity */}
            <div className="flex justify-between text-slate-700 items-baseline">
              <div>
                <span className="font-semibold block font-sans">Net Procured Quantity</span>
                <span className="text-[10px] text-slate-500">Certified weighbridge ticket net</span>
              </div>
              <span className="text-sm font-black text-slate-900">{calculationData.netQuantity} Qt</span>
            </div>

            {/* 2. Base MSP Rate */}
            <div className="flex justify-between text-slate-700 items-baseline">
              <div>
                <span className="font-semibold block font-sans">Base MSP Rate</span>
                <span className="text-[10px] text-slate-500">Government notified MSP per quintal</span>
              </div>
              <span className="font-bold text-slate-900">₹{calculationData.baseRate}/Qt</span>
            </div>

            {/* 3. Quality Adjustment */}
            <div className="flex justify-between text-slate-700 items-baseline">
              <div>
                <span className="font-semibold block font-sans">Quality Grade Adjustment</span>
                <span className="text-[10px] text-slate-500">Grade differential / FAQ tolerance</span>
              </div>
              <span className="font-bold text-slate-900">
                {calculationData.qualityAdjustment >= 0 ? '+' : ''}
                ₹{calculationData.qualityAdjustment || 0}/Qt
              </span>
            </div>

            {/* Effective Rate */}
            <div className="flex justify-between text-slate-800 items-baseline bg-slate-100/70 p-2 rounded-lg">
              <span className="font-bold font-sans">Effective MSP Rate:</span>
              <span className="font-black text-emerald-800">
                ₹{calculationData.finalRate || (calculationData.baseRate + (calculationData.qualityAdjustment || 0))}/Qt
              </span>
            </div>

            {/* 4. Gross Procurement Value */}
            <div className="flex justify-between text-slate-700 items-baseline pt-1">
              <div>
                <span className="font-semibold block font-sans">Gross Procurement Value</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {calculationData.netQuantity} Qt × ₹{calculationData.finalRate || (calculationData.baseRate + (calculationData.qualityAdjustment || 0))}
                </span>
              </div>
              <span className="font-black text-sm text-slate-900 tabular-nums">
                {formatCurrency(calculationData.grossAmount || 0)}
              </span>
            </div>

            {/* 5. Statutory Deductions & Mandi Cess */}
            <div className="flex justify-between text-rose-700 items-baseline">
              <div>
                <span className="font-semibold block font-sans">Statutory Mandi Cess (2%)</span>
                <span className="text-[10px] text-rose-500">State Agricultural Marketing Board cess</span>
              </div>
              <span className="font-bold tabular-nums">
                -{formatCurrency(calculationData.deductions || 0)}
              </span>
            </div>

            {/* 6. Net Payable Amount */}
            <div className="flex justify-between items-baseline font-black text-base text-emerald-950 border-t-2 border-slate-300 pt-3 bg-emerald-50/50 p-2.5 rounded-xl">
              <div>
                <span className="block font-sans text-xs uppercase text-emerald-800">
                  FINAL NET PAYABLE (DBT)
                </span>
                <span className="text-[10px] text-emerald-700 font-normal">
                  To be disbursed directly into farmer bank account
                </span>
              </div>
              <span className="text-lg font-black text-emerald-900 tabular-nums font-mono">
                {formatCurrency(calculationData.finalPayableAmount || 0)}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Statutory calculation verified & locked against backend rate engine
            </span>
            <button
              type="button"
              onClick={handlePreProceed}
              className="min-h-10 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Proceed to Payment Review</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between py-6">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-800">
              Ready to execute authoritative statutory Mandi calculation
            </p>
            <p className="text-[11px] text-slate-500">
              Uses certified weighbridge net produce weight and lab quality grade.
            </p>
          </div>
          <button
            type="button"
            onClick={onCalculate}
            disabled={refreshing}
            className="min-h-10 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Execute Calculation</span>
          </button>
        </div>
      )}

      {/* Confirmation Dialog before advancing to Payment Review */}
      {calculationData && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          size="md"
          ariaLabel="Confirm Procurement Calculation"
        >
          <ModalHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <ModalTitle>Confirm Calculation Voucher</ModalTitle>
                <ModalDescription>Verify statutory MSP amounts before reviewing DBT authorization</ModalDescription>
              </div>
            </div>
          </ModalHeader>

          <ModalBody>
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Net Weight:</span>
                  <span className="font-bold text-slate-900">{calculationData.netQuantity} Qt</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Effective Rate:</span>
                  <span className="font-bold text-slate-900">₹{calculationData.finalRate}/Qt</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Gross Valuation:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(calculationData.grossAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Statutory Cess (2%):</span>
                  <span>-{formatCurrency(calculationData.deductions || 0)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-emerald-900 border-t border-slate-200 pt-2">
                  <span>NET PAYABLE (DBT):</span>
                  <span>{formatCurrency(calculationData.finalPayableAmount || 0)}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Proceeding will open the Direct Benefit Transfer (DBT) payment authorization workbench to review beneficiary bank coordinates.
                </p>
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteProceed}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm & Proceed to Review</span>
            </button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};
