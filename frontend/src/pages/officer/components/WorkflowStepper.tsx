import React from 'react';
import { useToast } from '@/components/ui/toast';

interface WorkflowStepperProps {
  activeStep: number;
  userSelectedStep: number | null;
  setUserSelectedStep: (step: number) => void;
  isStepCompleted: (step: number) => boolean;
  canOpenStep: (step: number) => boolean;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  activeStep,
  userSelectedStep,
  setUserSelectedStep,
  isStepCompleted,
  canOpenStep,
}) => {
  const { toast } = useToast();
  const steps = [
    { num: 1, label: 'Called', short: 'Called' },
    { num: 2, label: 'Weighment', short: 'Weigh' },
    { num: 3, label: 'Quality', short: 'Quality' },
    { num: 4, label: 'Calculation', short: 'Calc' },
    { num: 5, label: 'Pay Review', short: 'Review' },
    { num: 6, label: 'Processing', short: 'Process' },
    { num: 7, label: 'Receipt', short: 'Receipt' },
  ];

  return (
    <div className="mt-4 pt-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
        Workflow Stepper (Click completed to review)
      </span>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
        {steps.map((s) => {
          const completed = isStepCompleted(s.num);
          const isCurrent = activeStep === s.num;
          const locked = !canOpenStep(s.num);

          return (
            <button
              key={s.num}
              onClick={() => {
                if (locked) {
                  toast.info('Step Locked', `Step ${s.num} (${s.label}) is locked until previous steps are completed.`);
                  return;
                }
                setUserSelectedStep(s.num);
              }}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                isCurrent
                  ? 'bg-slate-900 text-white shadow-2xs ring-2 ring-emerald-500/50'
                  : completed
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                  : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100 cursor-not-allowed'
              }`}
              title={
                completed
                  ? `Review Step ${s.num}: ${s.label}`
                  : locked
                  ? `Step ${s.num} (Locked)`
                  : `Active Step ${s.num}`
              }
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  completed
                    ? 'bg-emerald-200 text-emerald-900'
                    : isCurrent
                    ? 'bg-white text-slate-900'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {completed ? '✓' : s.num}
              </span>
              <span className="text-[10px] font-semibold truncate w-full">{s.short}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
