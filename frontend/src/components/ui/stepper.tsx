import * as React from 'react';
import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepItem {
  id: string | number;
  title: string;
  shortTitle?: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: StepItem[];
  activeStep: number; // 0-indexed or matching step id
  onStepClick?: (stepIndex: number, step: StepItem) => void;
  orientation?: 'horizontal' | 'vertical';
  isStepCompleted?: (stepIndex: number, step: StepItem) => boolean;
  canOpenStep?: (stepIndex: number, step: StepItem) => boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Stepper({
  steps,
  activeStep,
  onStepClick,
  orientation = 'horizontal',
  isStepCompleted,
  canOpenStep,
  size = 'md',
  className,
  ...props
}: StepperProps) {
  const isHorizontal = orientation === 'horizontal';

  const defaultIsCompleted = (index: number) => index < activeStep;
  const checkCompleted = isStepCompleted || defaultIsCompleted;

  const defaultCanOpen = (index: number) => index <= activeStep;
  const checkCanOpen = canOpenStep || defaultCanOpen;

  const sizeStyles = {
    sm: {
      circle: 'w-6 h-6 text-xs',
      title: 'text-xs',
      desc: 'text-[10px]',
      gap: 'gap-1',
    },
    md: {
      circle: 'w-8 h-8 text-sm',
      title: 'text-sm font-semibold',
      desc: 'text-xs',
      gap: 'gap-1.5',
    },
    lg: {
      circle: 'w-10 h-10 text-base',
      title: 'text-base font-semibold',
      desc: 'text-sm',
      gap: 'gap-2',
    },
  }[size];

  return (
    <div
      className={cn(
        isHorizontal
          ? 'flex items-center w-full overflow-x-auto pb-2 scrollbar-none'
          : 'flex flex-col space-y-4',
        className
      )}
      {...props}
    >
      {steps.map((step, index) => {
        const completed = checkCompleted(index, step);
        const isCurrent = activeStep === index;
        const accessible = checkCanOpen(index, step);
        const isLast = index === steps.length - 1;

        const isInteractive = !!onStepClick && accessible;

        return (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                'flex items-center',
                isHorizontal ? 'flex-1 min-w-[120px]' : 'w-full'
              )}
            >
              <button
                type="button"
                disabled={!isInteractive}
                onClick={() => isInteractive && onStepClick(index, step)}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex items-center text-left transition-all duration-200 group rounded-xl p-1',
                  sizeStyles.gap,
                  isInteractive
                    ? 'cursor-pointer hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/40'
                    : 'cursor-default'
                )}
              >
                {/* Step Circle */}
                <div
                  className={cn(
                    'rounded-full flex items-center justify-center font-bold shrink-0 transition-all duration-200 border-2',
                    sizeStyles.circle,
                    completed
                      ? 'bg-[#F0FDF4] border-[#16A34A] text-[#15803D]'
                      : isCurrent
                      ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-xs ring-4 ring-[#16A34A]/20'
                      : accessible
                      ? 'bg-white border-gray-300 text-[#64748B]'
                      : 'bg-gray-100 border-gray-200 text-gray-400'
                  )}
                >
                  {completed ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : !accessible ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : step.icon ? (
                    step.icon
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Step Text */}
                <div className="min-w-0 pr-2">
                  <p
                    className={cn(
                      'truncate',
                      sizeStyles.title,
                      isCurrent
                        ? 'text-[#16A34A] font-bold'
                        : completed
                        ? 'text-[#17201A] font-medium'
                        : 'text-[#64748B]'
                    )}
                  >
                    {step.shortTitle && isHorizontal ? (
                      <>
                        <span className="sm:hidden">{step.shortTitle}</span>
                        <span className="hidden sm:inline">{step.title}</span>
                      </>
                    ) : (
                      step.title
                    )}
                  </p>
                  {step.description && (
                    <p className={cn('text-[#64748B] truncate', sizeStyles.desc)}>
                      {step.description}
                    </p>
                  )}
                </div>
              </button>

              {/* Connecting Line (Horizontal) */}
              {isHorizontal && !isLast && (
                <div className="flex-1 mx-2 h-0.5 min-w-[20px] bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      completed ? 'bg-[#16A34A]' : 'bg-transparent'
                    )}
                  />
                </div>
              )}
            </div>

            {/* Connecting Line (Vertical) */}
            {!isHorizontal && !isLast && (
              <div className="ml-4 pl-0.5 h-6 w-0.5 bg-gray-200 my-0.5">
                <div
                  className={cn(
                    'w-full h-full transition-all duration-300',
                    completed ? 'bg-[#16A34A]' : 'bg-transparent'
                  )}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default Stepper;
