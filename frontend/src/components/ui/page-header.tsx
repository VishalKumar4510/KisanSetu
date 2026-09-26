import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  onBack?: () => void;
  backUrl?: string;
  showBack?: boolean;
  backButton?: {
    label?: string;
    onClick?: () => void;
  };
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  onBack,
  backUrl,
  showBack = false,
  backButton,
  className,
  ...props
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backButton?.onClick) {
      backButton.onClick();
    } else if (onBack) {
      onBack();
    } else if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  const hasBackAction = showBack || !!onBack || !!backUrl || !!backButton;

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 pb-2',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3 min-w-0">
        {hasBackAction && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="p-2 -ml-2 rounded-xl text-[#64748B] hover:text-[#17201A] hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/40 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[28px] sm:text-[32px] font-bold leading-tight text-[#17201A] tracking-tight truncate">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {description && (
            <p className="text-sm text-[#64748B] leading-relaxed mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
