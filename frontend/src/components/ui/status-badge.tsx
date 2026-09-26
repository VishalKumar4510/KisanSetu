import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  language?: 'en' | 'hi';
}

const statusDictionary: Record<
  string,
  {
    variant: 'default' | 'primary' | 'success' | 'info' | 'warning' | 'error' | 'cream' | 'muted';
    customClasses?: string;
    dotColor?: string;
    labelEn: string;
    labelHi: string;
  }
> = {
  BOOKED: {
    variant: 'info',
    dotColor: 'bg-[#2563EB]',
    labelEn: 'Booked',
    labelHi: 'स्लॉट बुक',
  },
  ARRIVED: {
    variant: 'warning',
    dotColor: 'bg-[#F59E0B]',
    labelEn: 'Arrived',
    labelHi: 'पहुंचे',
  },
  GATE_ENTRY: {
    variant: 'warning',
    customClasses: 'bg-orange-50 text-orange-800 border-orange-200/70',
    dotColor: 'bg-orange-500',
    labelEn: 'Gate Entry',
    labelHi: 'गेट प्रवेश',
  },
  WEIGHING: {
    variant: 'default',
    customClasses: 'bg-purple-50 text-purple-800 border-purple-200/70',
    dotColor: 'bg-purple-600',
    labelEn: 'Weighing',
    labelHi: 'तौल जारी',
  },
  QUALITY_CHECK: {
    variant: 'default',
    customClasses: 'bg-indigo-50 text-indigo-800 border-indigo-200/70',
    dotColor: 'bg-indigo-600',
    labelEn: 'Quality Check',
    labelHi: 'गुणवत्ता जांच',
  },
  PROCUREMENT: {
    variant: 'primary',
    dotColor: 'bg-[#16A34A]',
    labelEn: 'Procurement Done',
    labelHi: 'खरीद पूर्ण',
  },
  PAYMENT_PENDING: {
    variant: 'warning',
    dotColor: 'bg-[#F59E0B]',
    labelEn: 'Payment Pending',
    labelHi: 'भुगतान लंबित',
  },
  PAYMENT_PROCESSING: {
    variant: 'info',
    customClasses: 'bg-cyan-50 text-cyan-800 border-cyan-200/70',
    dotColor: 'bg-cyan-500',
    labelEn: 'Payment Processing',
    labelHi: 'भुगतान प्रक्रिया में',
  },
  COMPLETED: {
    variant: 'success',
    dotColor: 'bg-[#16A34A]',
    labelEn: 'Completed',
    labelHi: 'पूर्ण',
  },
  ACTIVE: {
    variant: 'success',
    dotColor: 'bg-[#16A34A]',
    labelEn: 'Active',
    labelHi: 'सक्रिय',
  },
  USED: {
    variant: 'info',
    dotColor: 'bg-[#2563EB]',
    labelEn: 'Used',
    labelHi: 'उपयोग हुआ',
  },
  EXPIRED: {
    variant: 'muted',
    dotColor: 'bg-gray-400',
    labelEn: 'Expired',
    labelHi: 'समाप्त',
  },
  CANCELLED: {
    variant: 'error',
    dotColor: 'bg-[#DC2626]',
    labelEn: 'Cancelled',
    labelHi: 'रद्द',
  },
  FAILED: {
    variant: 'error',
    dotColor: 'bg-[#DC2626]',
    labelEn: 'Failed',
    labelHi: 'विफल',
  },
  REJECTED: {
    variant: 'error',
    dotColor: 'bg-[#DC2626]',
    labelEn: 'Rejected',
    labelHi: 'अस्वीकृत',
  },
  NEEDS_REVIEW: {
    variant: 'warning',
    dotColor: 'bg-[#F59E0B]',
    labelEn: 'Needs Review',
    labelHi: 'समीक्षा आवश्यक',
  },
  // Congestion
  GREEN: {
    variant: 'success',
    dotColor: 'bg-[#16A34A]',
    labelEn: 'Low Traffic',
    labelHi: 'कम भीड़',
  },
  YELLOW: {
    variant: 'warning',
    dotColor: 'bg-[#F59E0B]',
    labelEn: 'Moderate Traffic',
    labelHi: 'मध्यम भीड़',
  },
  RED: {
    variant: 'error',
    dotColor: 'bg-[#DC2626]',
    labelEn: 'High Traffic',
    labelHi: 'अधिक भीड़',
  },
};

export function StatusBadge({
  status,
  label,
  size = 'md',
  showDot = true,
  language = 'en',
  className,
  ...props
}: StatusBadgeProps) {
  const normalizedKey = (status || '').toUpperCase().trim();
  const config = statusDictionary[normalizedKey] || {
    variant: 'default',
    dotColor: 'bg-gray-400',
    labelEn: status ? status.replace(/_/g, ' ') : 'Unknown',
    labelHi: status ? status.replace(/_/g, ' ') : 'अज्ञात',
  };

  const displayText =
    label || (language === 'hi' ? config.labelHi : config.labelEn);

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={showDot}
      dotColor={config.dotColor}
      className={cn('transition-colors duration-200', config.customClasses, className)}
      {...props}
    >
      {displayText}
    </Badge>
  );
}

export default StatusBadge;
