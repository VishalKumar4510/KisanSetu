import React, { useState } from 'react';
import {
  CreditCard,
  Check,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  X,
  AlertCircle,
  Building,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal';
import { CurrentFarmerData, Procurement, CalculationData, PaymentReviewData } from '@shared/types';

interface PaymentStepProps {
  currentFarmerData: CurrentFarmerData | null;
  currentProc: Procurement | null;
  calculationData: CalculationData | null;
  paymentStep: number;
  paymentProcessing: boolean;
  paymentError: string | null;
  activeSubStep: 5 | 6;
  showReviewModal: boolean;
  reviewData: PaymentReviewData | null;
  setShowReviewModal: (show: boolean) => void;
  onOpenReviewModal: () => void;
  onInitiatePayment: () => void;
  onProceedToReceipt: () => void;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  currentFarmerData,
  currentProc,
  calculationData,
  paymentStep,
  paymentProcessing,
  paymentError,
  activeSubStep,
  showReviewModal,
  reviewData,
  setShowReviewModal,
  onOpenReviewModal,
  onInitiatePayment,
  onProceedToReceipt,
}) => {
  const [showRetryConfirmModal, setShowRetryConfirmModal] = useState(false);
  const [statutoryAgreed, setStatutoryAgreed] = useState(false);

  const finalPayable =
    calculationData?.finalPayableAmount ||
    currentProc?.calculatedNetAmount ||
    currentFarmerData?.payment?.amount ||
    0;

  const farmer = currentFarmerData?.farmer;
  const maskedAcc = farmer?.maskedBankAccount || reviewData?.maskedBankAccount || '•••• •••• •••• 4138';
  const bankName = farmer?.bankName || reviewData?.bankName || 'State Bank of India';
  const ifsc = farmer?.ifsc || reviewData?.ifsc || 'SBIN0001234';

  const handleConfirmAuthorize = () => {
    setShowReviewModal(false);
    onInitiatePayment();
  };

  const handlePreRetry = () => {
    setShowRetryConfirmModal(true);
  };

  const handleExecuteRetry = () => {
    setShowRetryConfirmModal(false);
    onInitiatePayment();
  };

  return (
    <>
      {/* ================================================================ */}
      {/* SUB-STEP 5: PAY REVIEW                                           */}
      {/* ================================================================ */}
      {activeSubStep === 5 && (
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl space-y-4 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Step 5 — Pre-Payment Authorization & Review
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              DBT MANDATE READY
            </span>
          </div>

          {/* Amount Hero Banner */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                Total Direct Benefit Transfer (DBT) Amount
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-950">
                {formatCurrency(finalPayable)}
              </span>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-500 block text-[11px]">Beneficiary Name</span>
              <span className="font-bold text-slate-900 text-sm">{farmer?.name || reviewData?.farmerName}</span>
              <span className="text-[10px] text-slate-500 font-mono block">Kisan ID: {farmer?.farmerId || reviewData?.farmerId}</span>
            </div>
          </div>

          {/* Operational Cards: Masked Bank Details & PFMS/NPCI Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* 1. Masked Bank Coordinates */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <Building className="w-3.5 h-3.5 text-slate-600" />
                <span>Beneficiary Banking Coordinates</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Bank:</span>
                  <span className="font-semibold text-slate-800">{bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">IFSC Code:</span>
                  <span className="font-bold text-slate-900">{ifsc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Masked A/C:</span>
                  <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {maskedAcc}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. PFMS & NPCI Gateway Status */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Statutory Gateway Verification</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">PFMS DBT Mandate:</span>
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> VALIDATED
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">NPCI Aadhaar Bridge:</span>
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> LINKED & SEEDED
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account Validation:</span>
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> PRE-VALIDATED
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onOpenReviewModal}
              className="w-full sm:w-auto min-h-10 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>Review & Authorize Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* SUB-STEP 6: PAYMENT PROCESSING SIMULATION                        */}
      {/* ================================================================ */}
      {activeSubStep === 6 && (
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl space-y-4 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${paymentProcessing ? 'animate-spin text-amber-600' : 'text-emerald-700'}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Step 6 — Payment Processing (Simulated Gateway)
              </span>
            </div>
            {paymentProcessing ? (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/70 flex items-center gap-1 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                TRANSMITTING IN-FLIGHT
              </span>
            ) : paymentStep === 5 ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                SETTLED
              </span>
            ) : null}
          </div>

          {/* Real-time Simulation Pipeline State */}
          <div className="p-4 bg-slate-900 text-white rounded-xl text-xs space-y-2.5 font-mono">
            <span className="text-[10px] uppercase text-emerald-400 font-extrabold tracking-widest block mb-2">
              DBT Pipeline Transmission Telemetry
            </span>
            <div className={`flex items-center gap-2.5 transition-colors ${paymentStep >= 1 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${paymentStep >= 1 ? 'bg-emerald-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-500'}`}>
                {paymentStep >= 1 ? '✓' : '1'}
              </span>
              <span>Step 1: DBT Payment Mandate Generated & Signed</span>
            </div>
            <div className={`flex items-center gap-2.5 transition-colors ${paymentStep >= 2 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${paymentStep >= 2 ? 'bg-emerald-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-500'}`}>
                {paymentStep >= 2 ? '✓' : '2'}
              </span>
              <span>Step 2: PFMS & NPCI Gateway Validation (IFSC & Masked A/C Verified)</span>
            </div>
            <div className={`flex items-center gap-2.5 transition-colors ${paymentStep >= 3 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${paymentStep >= 3 ? 'bg-emerald-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-500'}`}>
                {paymentStep >= 3 ? '✓' : '3'}
              </span>
              <span>Step 3: Disbursal Route Initiated in Simulated Banking Gateway</span>
            </div>
            <div className={`flex items-center gap-2.5 transition-colors ${paymentStep >= 4 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${paymentStep >= 4 ? 'bg-emerald-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-500'}`}>
                {paymentStep >= 4 ? '✓' : '4'}
              </span>
              <span>Step 4: Beneficiary Core Banking Interbank Credit</span>
            </div>
            <div className={`flex items-center gap-2.5 transition-colors ${paymentStep >= 5 ? 'text-emerald-400 font-black' : 'text-slate-500'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${paymentStep >= 5 ? 'bg-emerald-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-500'}`}>
                {paymentStep >= 5 ? '✓' : '5'}
              </span>
              <span>Step 5: Settlement Completed & Statutory UTR Reference Generated</span>
            </div>
          </div>

          {/* Failure State & Retry Banner */}
          {paymentError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-rose-800 block">Payment Gateway Simulation Exception</span>
                  <span className="text-xs text-rose-700 block mt-0.5">{paymentError}</span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    The payment request failed to settle with the core banking gateway. You may retry transmission without re-entering parameters.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePreRetry}
                className="shrink-0 min-h-9 px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Payment</span>
              </button>
            </div>
          )}

          {/* Transaction Metadata Preview */}
          <div className="grid grid-cols-2 gap-3 text-xs p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] font-sans">Transaction Reference:</span>
              <span className="font-bold text-slate-900 block truncate">
                {currentFarmerData?.payment?.transactionId || reviewData?.transactionId || 'KS-TXN-...'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-sans">Bank UTR Reference:</span>
              <span className="font-bold text-emerald-800 block truncate">
                {currentFarmerData?.payment?.utr || (paymentStep === 5 ? '982440385255' : 'Pending Core Banking...')}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end pt-1">
            {paymentStep === 5 ? (
              <button
                type="button"
                onClick={onProceedToReceipt}
                className="min-h-10 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Proceed to Receipt & Settlement</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenReviewModal}
                className="min-h-10 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs"
              >
                Review Authorization Parameters
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* REVIEW & AUTHORIZATION MODAL (Irreversible DBT Disbursal Action) */}
      {/* ================================================================ */}
      {showReviewModal && reviewData && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          size="md"
          ariaLabel="Authorize Direct Benefit Transfer"
        >
          <ModalHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <ModalTitle>Authorize DBT Disbursal</ModalTitle>
                <ModalDescription>Review beneficiary coordinates before transmitting Mandi funds</ModalDescription>
              </div>
            </div>
          </ModalHeader>

          <ModalBody>
            <div className="space-y-3.5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs space-y-2.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Beneficiary Farmer:</span>
                  <span className="font-bold text-slate-900">{reviewData.farmerName} ({reviewData.farmerId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Queue Token:</span>
                  <span className="font-bold text-slate-900">#{reviewData.tokenNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Net Quantity:</span>
                  <span className="font-bold text-slate-900">{reviewData.quantity ?? reviewData.netQuantity} Qt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Bank & IFSC:</span>
                  <span className="text-slate-800">{reviewData.bankName} ({reviewData.ifsc})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Masked Account:</span>
                  <span className="font-black text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {reviewData.maskedBankAccount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Gateway Validation:</span>
                  <span className="font-bold text-emerald-800">{reviewData.bankVerificationStatus}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-emerald-950 border-t border-slate-200 pt-2 bg-emerald-50/70 p-2 rounded-lg">
                  <span className="font-sans">TOTAL DISBURSAL (DBT):</span>
                  <span className="tabular-nums">₹{reviewData.finalPayableAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Statutory Certification Checkbox */}
              <label className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={statutoryAgreed}
                  onChange={(e) => setStatutoryAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span className="text-[11px] text-slate-600 leading-snug">
                  I certify that the weighbridge ticket, FAQ quality grading, and statutory 2% Mandi deductions have been verified in accordance with APMC guidelines.
                </span>
              </label>
            </div>
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmAuthorize}
              disabled={paymentProcessing || !statutoryAgreed}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Authorize DBT Transmission</span>
            </button>
          </ModalFooter>
        </Modal>
      )}

      {/* ================================================================ */}
      {/* CONFIRM RETRY MODAL                                              */}
      {/* ================================================================ */}
      <Modal
        isOpen={showRetryConfirmModal}
        onClose={() => setShowRetryConfirmModal(false)}
        size="sm"
        ariaLabel="Confirm Payment Retry"
      >
        <ModalHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <ModalTitle>Retry Payment Transmission</ModalTitle>
              <ModalDescription>Re-attempt payment dispatch through simulated banking gateway</ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to retry transmitting this payment of <strong>{formatCurrency(finalPayable)}</strong> for lot <strong>#{currentFarmerData?.token?.tokenNumber}</strong>?
          </p>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={() => setShowRetryConfirmModal(false)}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteRetry}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Confirm & Retry Now
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
};
