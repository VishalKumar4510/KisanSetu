import React, { useState } from 'react';
import {
  ChevronRight,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  FlaskConical,
  ShieldCheck,
  Lock,
  AlertOctagon,
} from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal';

interface QualityStepProps {
  currentFarmerData: any;
  qualityForm: {
    crop: string;
    moistureContent: string;
    foreignMatter: string;
    damagedGrains: string;
    grade: string;
    qualityResult: 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVIEW';
    remarks: string;
  };
  setQualityForm: React.Dispatch<React.SetStateAction<any>>;
  isCompleted: boolean;
  refreshing: boolean;
  onSubmitQuality: () => void;
  onProceedToCalculation: () => void;
}

export const QualityStep: React.FC<QualityStepProps> = ({
  currentFarmerData,
  qualityForm,
  setQualityForm,
  isCompleted,
  refreshing,
  onSubmitQuality,
  onProceedToCalculation,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const isQcCompleted = Boolean(currentFarmerData?.quality);
  const currentResult = currentFarmerData?.quality?.qualityResult || qualityForm.qualityResult;

  const moisture = Number(qualityForm.moistureContent || 0);
  const foreign = Number(qualityForm.foreignMatter || 0);
  const damaged = Number(qualityForm.damagedGrains || 0);

  // FAQ Specification thresholds
  const isMoistureHigh = moisture > 12.0;
  const isForeignHigh = foreign > 0.75;
  const isDamagedHigh = damaged > 2.0;

  const handlePreSubmit = () => {
    setShowConfirmModal(true);
  };

  const handleExecuteSubmit = () => {
    setShowConfirmModal(false);
    onSubmitQuality();
  };

  return (
    <div className="p-5 bg-white border border-slate-200/80 rounded-2xl space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Step 3 — Quality Assessment & Grading
          </span>
        </div>
        {isCompleted ? (
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
              currentResult === 'REJECTED'
                ? 'text-rose-700 bg-rose-50 border-rose-200'
                : currentResult === 'NEEDS_REVIEW'
                ? 'text-amber-700 bg-amber-50 border-amber-200'
                : 'text-emerald-700 bg-emerald-50 border-emerald-200/60'
            }`}
          >
            {currentResult === 'REJECTED' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            QC {currentResult}
          </span>
        ) : (
          <span className="text-xs text-slate-500 font-medium">FAQ Standard Testing</span>
        )}
      </div>

      {/* FAQ Standard Guidelines Banner */}
      <div className="px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Crop: <strong className="text-slate-900">{qualityForm.crop || 'WHEAT'}</strong>
        </span>
        <div className="flex items-center gap-3 text-slate-500 text-[11px] font-mono">
          <span>FAQ Moisture: ≤12%</span>
          <span>•</span>
          <span>FAQ Foreign: ≤0.75%</span>
          <span>•</span>
          <span>FAQ Damaged: ≤2%</span>
        </div>
      </div>

      {/* Quality Parameters Inputs: moisture, foreign material, damaged, grade, decision */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-700 font-semibold">Moisture (%)</label>
            {isMoistureHigh && !isQcCompleted && (
              <span className="text-[10px] text-amber-600 font-bold">High</span>
            )}
          </div>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={qualityForm.moistureContent}
            onChange={(e) => setQualityForm({ ...qualityForm, moistureContent: e.target.value })}
            disabled={isQcCompleted}
            className={`w-full p-2.5 bg-slate-50 border rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 disabled:opacity-75 ${
              isMoistureHigh ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
            }`}
          />
          <span className="text-[10px] text-slate-500 block mt-0.5">Tolerance ≤12%</span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-700 font-semibold">Foreign Mat. (%)</label>
            {isForeignHigh && !isQcCompleted && (
              <span className="text-[10px] text-amber-600 font-bold">High</span>
            )}
          </div>
          <input
            type="number"
            step="0.05"
            min="0"
            max="100"
            value={qualityForm.foreignMatter}
            onChange={(e) => setQualityForm({ ...qualityForm, foreignMatter: e.target.value })}
            disabled={isQcCompleted}
            className={`w-full p-2.5 bg-slate-50 border rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 disabled:opacity-75 ${
              isForeignHigh ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
            }`}
          />
          <span className="text-[10px] text-slate-500 block mt-0.5">Tolerance ≤0.75%</span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-700 font-semibold">Damaged (%)</label>
            {isDamagedHigh && !isQcCompleted && (
              <span className="text-[10px] text-amber-600 font-bold">High</span>
            )}
          </div>
          <input
            type="number"
            step="0.05"
            min="0"
            max="100"
            value={qualityForm.damagedGrains}
            onChange={(e) => setQualityForm({ ...qualityForm, damagedGrains: e.target.value })}
            disabled={isQcCompleted}
            className={`w-full p-2.5 bg-slate-50 border rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 disabled:opacity-75 ${
              isDamagedHigh ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
            }`}
          />
          <span className="text-[10px] text-slate-500 block mt-0.5">Tolerance ≤2.0%</span>
        </div>

        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1">Quality Grade</label>
          <select
            value={qualityForm.grade}
            onChange={(e) => setQualityForm({ ...qualityForm, grade: e.target.value })}
            disabled={isQcCompleted}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 disabled:opacity-75"
          >
            <option value="A">Grade A (Premium)</option>
            <option value="B">Grade B (FAQ Standard)</option>
            <option value="C">Grade C (Sub-Standard)</option>
          </select>
          <span className="text-[10px] text-slate-500 block mt-0.5">MSP Qualification</span>
        </div>

        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1">Decision</label>
          <select
            value={qualityForm.qualityResult}
            onChange={(e) => setQualityForm({ ...qualityForm, qualityResult: e.target.value as any })}
            disabled={isQcCompleted}
            className={`w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600/30 disabled:opacity-75 ${
              qualityForm.qualityResult === 'REJECTED'
                ? 'text-rose-700 border-rose-300 bg-rose-50/40'
                : qualityForm.qualityResult === 'NEEDS_REVIEW'
                ? 'text-amber-700 border-amber-300 bg-amber-50/40'
                : 'text-emerald-800 border-slate-200'
            }`}
          >
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <span className="text-[10px] text-slate-500 block mt-0.5">Authoritative Action</span>
        </div>
      </div>

      {/* Decision Notice & Reasons */}
      {currentResult === 'REJECTED' && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Lot Rejected: Procurement Halted.</p>
            <p className="text-xs text-rose-700 mt-0.5">
              Reason: {currentFarmerData?.procurement?.rejectionReason || qualityForm.remarks || 'Produce parameters exceed statutory Mandi moisture or foreign matter thresholds.'}
            </p>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              Payment initiation and statutory calculation are blocked for rejected lots.
            </p>
          </div>
        </div>
      )}

      {currentResult === 'NEEDS_REVIEW' && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Quality Review Required: Procurement Paused.</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Secondary inspection or supervisor re-check required. Payment is held until quality decision is resolved.
            </p>
          </div>
        </div>
      )}

      {/* Footer / Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500">
          Standard: FAQ specification tolerance verified
        </span>

        {!isQcCompleted ? (
          <button
            type="button"
            onClick={handlePreSubmit}
            disabled={refreshing}
            className={`min-h-10 px-5 py-2 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5 ${
              qualityForm.qualityResult === 'REJECTED'
                ? 'bg-rose-700 hover:bg-rose-800'
                : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Save Quality Assessment</span>
          </button>
        ) : currentResult === 'ACCEPTED' ? (
          <button
            type="button"
            onClick={onProceedToCalculation}
            className="min-h-10 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Proceed to Calculation</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-xs text-rose-600 font-semibold">
            {currentResult === 'REJECTED' ? 'Procurement Terminated' : 'Procurement Paused'}
          </span>
        )}
      </div>

      {/* Confirmation Dialog for Irreversible Quality Actions */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        size="md"
        ariaLabel={qualityForm.qualityResult === 'REJECTED' ? 'Confirm Lot Rejection' : 'Confirm Quality Assessment'}
      >
        <ModalHeader>
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                qualityForm.qualityResult === 'REJECTED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {qualityForm.qualityResult === 'REJECTED' ? <AlertOctagon className="w-4 h-4" /> : <FlaskConical className="w-4 h-4" />}
            </div>
            <div>
              <ModalTitle>
                {qualityForm.qualityResult === 'REJECTED' ? 'Confirm Lot Rejection' : 'Confirm Quality Assessment'}
              </ModalTitle>
              <ModalDescription>
                {qualityForm.qualityResult === 'REJECTED'
                  ? 'Review rejection parameters before terminating procurement'
                  : 'Verify quality parameters before calculating statutory procurement rates'}
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Commodity:</span>
                <span className="font-bold text-slate-900">{qualityForm.crop || 'WHEAT'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Moisture Content:</span>
                <span className="font-bold text-slate-900">{qualityForm.moistureContent}%</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Foreign Matter:</span>
                <span className="font-bold text-slate-900">{qualityForm.foreignMatter}%</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Damaged Grains:</span>
                <span className="font-bold text-slate-900">{qualityForm.damagedGrains}%</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Quality Grade:</span>
                <span className="font-bold text-slate-900">Grade {qualityForm.grade}</span>
              </div>
              <div className="flex justify-between font-bold text-sm border-t border-slate-200 pt-2">
                <span>DECISION:</span>
                <span
                  className={
                    qualityForm.qualityResult === 'REJECTED'
                      ? 'text-rose-700'
                      : qualityForm.qualityResult === 'NEEDS_REVIEW'
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }
                >
                  {qualityForm.qualityResult}
                </span>
              </div>
            </div>

            {qualityForm.qualityResult === 'REJECTED' ? (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Warning:</strong> Rejecting this lot terminates the active procurement workflow. A statutory rejection slip will be issued and the farmer will not receive Mandi MSP settlement for this lot.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Produce satisfies APMC quality benchmarks for Grade {qualityForm.grade}. Confirming will enable statutory MSP calculation.
                </p>
              </div>
            )}
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
            onClick={handleExecuteSubmit}
            className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 ${
              qualityForm.qualityResult === 'REJECTED'
                ? 'bg-rose-700 hover:bg-rose-800'
                : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {qualityForm.qualityResult === 'REJECTED' ? 'Confirm Lot Rejection' : 'Confirm & Save Quality'}
            </span>
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
};
