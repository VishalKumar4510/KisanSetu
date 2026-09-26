import React, { useState } from 'react';
import {
  ChevronRight,
  AlertCircle,
  Scale,
  CheckCircle2,
  Lock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

export interface ScaleItem {
  id: string;
  name: string;
  type: string;
  capacityKg: number;
  status: 'ONLINE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE';
  lastCalibrationDate: string;
}

interface WeighmentStepProps {
  currentFarmerData: any;
  weighingForm: {
    grossWeight: string;
    tareWeight: string;
    scaleId: string;
  };
  setWeighingForm: React.Dispatch<
    React.SetStateAction<{
      grossWeight: string;
      tareWeight: string;
      scaleId: string;
    }>
  >;
  scales: ScaleItem[];
  isCompleted: boolean;
  refreshing: boolean;
  onConfirmWeighment: () => void;
  onProceedToQuality: () => void;
}

export const WeighmentStep: React.FC<WeighmentStepProps> = ({
  currentFarmerData,
  weighingForm,
  setWeighingForm,
  scales,
  isCompleted,
  refreshing,
  onConfirmWeighment,
  onProceedToQuality,
}) => {
  const { toast } = useToast();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const selectedScale = scales.find((s) => s.id === weighingForm.scaleId) || scales[0];
  const isScaleUnavailable = selectedScale
    ? selectedScale.status === 'OFFLINE' || selectedScale.status === 'MAINTENANCE'
    : false;

  const grossNum = Number(weighingForm.grossWeight || 0);
  const tareNum = Number(weighingForm.tareWeight || 0);
  const netNum = Number((grossNum - tareNum).toFixed(2));
  const isWeighed = Boolean(currentFarmerData?.weighing);
  const isGrossInvalid = grossNum > 0 && tareNum >= grossNum;

  const handlePreConfirm = () => {
    if (grossNum <= 0) {
      toast.warning('Invalid Weight', 'Please enter a valid Gross Weight greater than 0.');
      return;
    }
    if (tareNum >= grossNum) {
      toast.warning('Weight Validation', 'Gross weight must be strictly greater than tare weight.');
      return;
    }
    if (isScaleUnavailable) {
      toast.warning('Scale Unavailable', 'Selected scale is offline or undergoing maintenance. Please select an active online scale.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteConfirm = () => {
    setShowConfirmModal(false);
    onConfirmWeighment();
  };

  return (
    <div className="p-5 bg-white border border-slate-200/80 rounded-2xl space-y-4 shadow-xs">
      {/* Header with Step indicator */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Step 2 — Weighbridge Operations
          </span>
        </div>
        {isCompleted ? (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            RECORD LOCKED
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-500">
            Lot #{currentFarmerData?.token?.tokenNumber || '—'}
          </span>
        )}
      </div>

      {/* Operational Readout: Net Weight Terminal */}
      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block mb-1">
            Digital Weighbridge Telemetry
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-white">
              {isWeighed ? currentFarmerData.weighing.netWeight : Math.max(0, netNum).toFixed(2)}
            </span>
            <span className="text-emerald-400 font-bold text-sm">Quintals (Qt)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Net Weight = Gross ({isWeighed ? currentFarmerData.weighing.grossWeight : grossNum.toFixed(2)} Qt) − Tare ({isWeighed ? currentFarmerData.weighing.tareWeight : tareNum.toFixed(2)} Qt)
          </span>
        </div>

        {/* Selected Scale Telemetry Tag */}
        <div className="bg-slate-800/80 border border-slate-700 px-3.5 py-2 rounded-lg text-right text-xs">
          <div className="flex items-center gap-1.5 justify-end">
            <span
              className={`w-2 h-2 rounded-full ${
                selectedScale?.status === 'ONLINE'
                  ? 'bg-emerald-400 animate-pulse'
                  : selectedScale?.status === 'BUSY'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <span className="font-bold text-white font-mono">{selectedScale?.name || 'Weighbridge Bay 1'}</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Capacity: {((selectedScale?.capacityKg || 50000) / 100).toLocaleString('en-IN')} Qt • Status: <strong className="text-slate-200">{selectedScale?.status || 'ONLINE'}</strong>
          </span>
        </div>
      </div>

      {/* Inputs Grid: Gross, Tare, Net, Scale Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1">
            Gross Weight (Qt) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={weighingForm.grossWeight}
            onChange={(e) => setWeighingForm({ ...weighingForm, grossWeight: e.target.value })}
            disabled={isWeighed}
            placeholder="e.g. 26.50"
            className={`w-full p-2.5 bg-slate-50 border rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 disabled:opacity-75 ${
              isGrossInvalid ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
            }`}
          />
        </div>

        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1">
            Tare Weight (Qt) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={weighingForm.tareWeight}
            onChange={(e) => setWeighingForm({ ...weighingForm, tareWeight: e.target.value })}
            disabled={isWeighed}
            placeholder="e.g. 0.50"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 disabled:opacity-75"
          />
        </div>

        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1">Net Produce (Qt)</label>
          <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl font-mono font-black text-emerald-900 flex items-center justify-between">
            <span>{isWeighed ? currentFarmerData.weighing.netWeight : Math.max(0, netNum)} Qt</span>
            {isWeighed && <Lock className="w-3.5 h-3.5 text-emerald-600" />}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-700 font-semibold block mb-1">Scale Equipment</label>
          <select
            value={weighingForm.scaleId}
            onChange={(e) => setWeighingForm({ ...weighingForm, scaleId: e.target.value })}
            disabled={isWeighed}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 disabled:opacity-75"
          >
            {scales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Validation Alert */}
      {isGrossInvalid && !isWeighed && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <p className="font-semibold">
            Validation Error: Gross weight ({grossNum} Qt) must be strictly greater than Tare weight ({tareNum} Qt).
          </p>
        </div>
      )}

      {/* Scale Unavailable Warning */}
      {isScaleUnavailable && !isWeighed && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold">Selected Scale Unavailable</p>
            <p className="text-xs text-amber-800">
              The selected unit ({selectedScale?.name}) is currently {selectedScale?.status}. Please select an active online scale equipment above to proceed.
            </p>
          </div>
        </div>
      )}

      {/* Operational Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Scale: <strong className="text-slate-700">{selectedScale?.name}</strong> • Calibrated:{' '}
          <span className="font-mono text-slate-600">{selectedScale?.lastCalibrationDate || '2026-09-01'}</span>
        </span>

        {!isWeighed ? (
          <button
            type="button"
            onClick={handlePreConfirm}
            disabled={refreshing || isScaleUnavailable || isGrossInvalid || grossNum <= 0}
            className="min-h-10 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Confirm Weighment</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onProceedToQuality}
            className="min-h-10 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Proceed to Quality</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Confirmation Dialog for Irreversible Weighbridge Record Lock */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        size="md"
        ariaLabel="Confirm Weighbridge Scale Reading"
      >
        <ModalHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <ModalTitle>Confirm Weighbridge Ticket</ModalTitle>
              <ModalDescription>Verify scale readings before committing official weight</ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Lot Token:</span>
                <span className="font-bold text-slate-900">#{currentFarmerData?.token?.tokenNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Scale Unit:</span>
                <span className="font-bold text-slate-900">{selectedScale?.name} ({selectedScale?.id})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Gross Weight:</span>
                <span className="font-bold text-slate-900">{grossNum.toFixed(2)} Qt</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tare Weight:</span>
                <span className="font-bold text-slate-900">{tareNum.toFixed(2)} Qt</span>
              </div>
              <div className="flex justify-between font-black text-sm text-emerald-800 border-t border-slate-200 pt-2">
                <span>NET PRODUCE WEIGHT:</span>
                <span>{netNum.toFixed(2)} Qt</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Notice:</strong> Confirming this weighment ticket commits the net weight of <strong>{netNum.toFixed(2)} Qt</strong> for statutory Mandi procurement and MSP calculation.
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
            onClick={handleExecuteConfirm}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirm & Lock Weight</span>
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
};
