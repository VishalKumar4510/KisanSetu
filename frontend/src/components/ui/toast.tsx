import * as React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (title: string, description?: string, options?: Partial<ToastMessage>) => string;
    error: (title: string, description?: string, options?: Partial<ToastMessage>) => string;
    warning: (title: string, description?: string, options?: Partial<ToastMessage>) => string;
    info: (title: string, description?: string, options?: Partial<ToastMessage>) => string;
  };
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (toastData: Omit<ToastMessage, 'id'>) => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { ...toastData, id };

      setToasts((prev) => [...prev, newToast]);

      const duration = toastData.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toastMethods = React.useMemo(
    () => ({
      success: (title: string, description?: string, options?: Partial<ToastMessage>) =>
        addToast({ type: 'success', title, description, ...options }),
      error: (title: string, description?: string, options?: Partial<ToastMessage>) =>
        addToast({ type: 'error', title, description, ...options }),
      warning: (title: string, description?: string, options?: Partial<ToastMessage>) =>
        addToast({ type: 'warning', title, description, ...options }),
      info: (title: string, description?: string, options?: Partial<ToastMessage>) =>
        addToast({ type: 'info', title, description, ...options }),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast: toastMethods }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
      ))}
    </div>
  );
}

export function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastMessage;
  onRemove: () => void;
}) {
  const typeConfigs = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />,
      border: 'border-green-200/80',
      bg: 'bg-white',
      badge: 'bg-[#F0FDF4]',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />,
      border: 'border-red-200/80',
      bg: 'bg-white',
      badge: 'bg-[#FEF2F2]',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0" />,
      border: 'border-amber-200/80',
      bg: 'bg-white',
      badge: 'bg-[#FFFBEB]',
    },
    info: {
      icon: <Info className="w-5 h-5 text-[#2563EB] shrink-0" />,
      border: 'border-blue-200/80',
      bg: 'bg-white',
      badge: 'bg-[#EFF6FF]',
    },
  }[toast.type];

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto rounded-2xl border p-4 shadow-lg flex items-start gap-3 transition-all duration-300 animate-slideUp text-[#17201A]',
        typeConfigs.bg,
        typeConfigs.border
      )}
    >
      <div className={cn('p-1.5 rounded-xl shrink-0', typeConfigs.badge)}>
        {typeConfigs.icon}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-sm font-bold text-[#17201A] leading-tight">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={toast.action.onClick}
            className="mt-2 text-xs font-semibold text-[#16A34A] hover:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label="Dismiss toast"
        className="p-1 text-[#64748B] hover:text-[#17201A] rounded-lg hover:bg-gray-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default ToastItem;
