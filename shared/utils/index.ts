import { ProcurementStatus, CongestionLevel, PaymentStatus } from '../types';

export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function formatCurrency(value: number | string): string {
  return `₹${(Number(value) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getStatusColor(status: ProcurementStatus): string {
  const colors: Record<ProcurementStatus, string> = {
    [ProcurementStatus.BOOKED]: '#2563eb',
    [ProcurementStatus.CALLED]: '#0284c7',
    [ProcurementStatus.ARRIVED]: '#f59e0b',
    [ProcurementStatus.GATE_ENTRY]: '#ea580c',
    [ProcurementStatus.WEIGHING]: '#7c3aed',
    [ProcurementStatus.QUALITY_CHECK]: '#4f46e5',
    [ProcurementStatus.PROCUREMENT]: '#16a34a',
    [ProcurementStatus.PAYMENT_PENDING]: '#d97706',
    [ProcurementStatus.PAYMENT_PROCESSING]: '#0891b2',
    [ProcurementStatus.COMPLETED]: '#059669',
    [ProcurementStatus.REJECTED]: '#dc2626',
  };
  return colors[status] || '#6b7280';
}

export function getCongestionColor(level: CongestionLevel): string {
  const colors: Record<CongestionLevel, string> = {
    [CongestionLevel.GREEN]: '#16a34a',
    [CongestionLevel.YELLOW]: '#f59e0b',
    [CongestionLevel.RED]: '#dc2626',
  };
  return colors[level];
}

export function getCongestionBg(level: CongestionLevel): string {
  const bgs: Record<CongestionLevel, string> = {
    [CongestionLevel.GREEN]: 'bg-green-100 text-green-800',
    [CongestionLevel.YELLOW]: 'bg-yellow-100 text-yellow-800',
    [CongestionLevel.RED]: 'bg-red-100 text-red-800',
  };
  return bgs[level];
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [PaymentStatus.VALIDATING]: 'bg-blue-100 text-blue-800 border-blue-200',
    [PaymentStatus.INITIATED]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    [PaymentStatus.PROCESSING]: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    [PaymentStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
    [PaymentStatus.SUCCESS]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    [PaymentStatus.FAILED]: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getStatusBadgeClass(status: ProcurementStatus): string {
  const classes: Record<ProcurementStatus, string> = {
    [ProcurementStatus.BOOKED]: 'bg-blue-100 text-blue-800 border-blue-200',
    [ProcurementStatus.CALLED]: 'bg-sky-100 text-sky-800 border-sky-200',
    [ProcurementStatus.ARRIVED]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [ProcurementStatus.GATE_ENTRY]: 'bg-orange-100 text-orange-800 border-orange-200',
    [ProcurementStatus.WEIGHING]: 'bg-purple-100 text-purple-800 border-purple-200',
    [ProcurementStatus.QUALITY_CHECK]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    [ProcurementStatus.PROCUREMENT]: 'bg-green-100 text-green-800 border-green-200',
    [ProcurementStatus.PAYMENT_PENDING]: 'bg-amber-100 text-amber-800 border-amber-200',
    [ProcurementStatus.PAYMENT_PROCESSING]: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    [ProcurementStatus.COMPLETED]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    [ProcurementStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
  };
  return classes[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getStatusLabel(status: ProcurementStatus): string {
  const labels: Record<ProcurementStatus, string> = {
    [ProcurementStatus.BOOKED]: 'Booked',
    [ProcurementStatus.CALLED]: 'Called',
    [ProcurementStatus.ARRIVED]: 'Arrived',
    [ProcurementStatus.GATE_ENTRY]: 'Gate Entry',
    [ProcurementStatus.WEIGHING]: 'Weighing',
    [ProcurementStatus.QUALITY_CHECK]: 'Quality Check',
    [ProcurementStatus.PROCUREMENT]: 'Procurement',
    [ProcurementStatus.PAYMENT_PENDING]: 'Payment Pending',
    [ProcurementStatus.PAYMENT_PROCESSING]: 'Payment Processing',
    [ProcurementStatus.COMPLETED]: 'Completed',
    [ProcurementStatus.REJECTED]: 'Rejected',
  };
  return labels[status] || status;
}

export function getStatusLabelHi(status: ProcurementStatus): string {
  const labels: Record<ProcurementStatus, string> = {
    [ProcurementStatus.BOOKED]: 'बुक किया गया',
    [ProcurementStatus.CALLED]: 'बुलाया गया',
    [ProcurementStatus.ARRIVED]: 'पहुँचा',
    [ProcurementStatus.GATE_ENTRY]: 'गेट प्रवेश',
    [ProcurementStatus.WEIGHING]: 'तौल',
    [ProcurementStatus.QUALITY_CHECK]: 'गुणवत्ता जाँच',
    [ProcurementStatus.PROCUREMENT]: 'खरीद',
    [ProcurementStatus.PAYMENT_PENDING]: 'भुगतान लंबित',
    [ProcurementStatus.PAYMENT_PROCESSING]: 'भुगतान प्रक्रिया',
    [ProcurementStatus.COMPLETED]: 'पूर्ण',
    [ProcurementStatus.REJECTED]: 'अस्वीकृत',
  };
  return labels[status] || status;
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
