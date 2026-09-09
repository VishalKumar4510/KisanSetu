// ==================== ENUMS ====================

export enum UserRole {
  FARMER = 'FARMER',
  OFFICER = 'OFFICER',
  ADMIN = 'ADMIN',
}

export enum CongestionLevel {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

export enum ProcurementStatus {
  BOOKED = 'BOOKED',
  ARRIVED = 'ARRIVED',
  GATE_ENTRY = 'GATE_ENTRY',
  WEIGHING = 'WEIGHING',
  QUALITY_CHECK = 'QUALITY_CHECK',
  PROCUREMENT = 'PROCUREMENT',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ProduceType {
  WHEAT = 'WHEAT',
  PADDY = 'PADDY',
  ONION = 'ONION',
  MAIZE = 'MAIZE',
  PULSES = 'PULSES',
}

export enum NotificationType {
  SLOT_CONFIRMED = 'SLOT_CONFIRMED',
  SLOT_REMINDER = 'SLOT_REMINDER',
  QUEUE_APPROACHING = 'QUEUE_APPROACHING',
  QUEUE_DELAY = 'QUEUE_DELAY',
  GATE_ENTRY = 'GATE_ENTRY',
  WEIGHING_COMPLETED = 'WEIGHING_COMPLETED',
  QUALITY_COMPLETED = 'QUALITY_COMPLETED',
  PROCUREMENT_COMPLETED = 'PROCUREMENT_COMPLETED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
}

// ==================== INTERFACES ====================

export interface User {
  id: string;
  name: string;
  phone: string;
  password?: string;
  role: UserRole;
  aadhaar?: string;
  language: 'en' | 'hi';
  createdAt: string;
}

export interface Farmer extends User {
  farmerId: string;
  village: string;
  district: string;
  state: string;
  landArea: number;
  crops: ProduceType[];
  role: UserRole.FARMER;
}

export interface Centre {
  id: string;
  name: string;
  location: string;
  district: string;
  state: string;
  capacity: number;
  activeBays: number;
  totalBays: number;
  operatingHours: { start: string; end: string };
  status: 'ACTIVE' | 'INACTIVE';
  congestionLevel: CongestionLevel;
  contactPhone: string;
}

export interface Slot {
  id: string;
  centreId: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  maxCapacity: number;
  currentBookings: number;
  status: 'AVAILABLE' | 'FULL' | 'CLOSED';
}

export interface Token {
  id: string;
  farmerId: string;
  slotId: string;
  centreId: string;
  tokenNumber: string;
  qrData: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  queuePosition: number;
  estimatedTime: string;
  createdAt: string;
}

export interface Produce {
  id: string;
  farmerId: string;
  type: ProduceType;
  quantity: number;
  unit: string;
  grade?: string;
  mspRate: number;
}

export interface Procurement {
  id: string;
  farmerId: string;
  centreId: string;
  tokenId: string;
  produceId: string;
  status: ProcurementStatus;
  bookedAt?: string;
  arrivedAt?: string;
  gateEntryAt?: string;
  weighingAt?: string;
  qualityCheckAt?: string;
  procurementAt?: string;
  paymentPendingAt?: string;
  paymentProcessingAt?: string;
  completedAt?: string;
}

export interface Weighing {
  id: string;
  procurementId: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  timestamp: string;
}

export interface QualityCheck {
  id: string;
  procurementId: string;
  moistureContent: number;
  foreignMatter: number;
  grade: 'A' | 'B' | 'C';
  accepted: boolean;
  remarks: string;
  timestamp: string;
}

export interface Payment {
  id: string;
  procurementId: string;
  farmerId: string;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  status: PaymentStatus;
  dbtReferenceId?: string;
  processedAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
}

// ==================== STATS & ANALYTICS ====================

export interface CentreStats {
  centreId: string;
  centreName: string;
  queueLength: number;
  avgWaitTime: number;
  utilization: number;
  activeFarmers: number;
  completedToday: number;
  congestionLevel: CongestionLevel;
}

export interface KPIData {
  farmersRegistered: number;
  todaysBookings: number;
  activeQueue: number;
  avgWaitTime: number;
  completedProcurement: number;
  paymentsProcessed: number;
}

export interface AnalyticsDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface DemoState {
  isRunning: boolean;
  currentStep: ProcurementStatus | 'IDLE';
  farmerId?: string;
  procurementId?: string;
  speed: number;
  log: string[];
}

// ==================== MSP RATES ====================

export const MSP_RATES: Record<ProduceType, number> = {
  [ProduceType.WHEAT]: 2275,
  [ProduceType.PADDY]: 2203,
  [ProduceType.MAIZE]: 2090,
  [ProduceType.PULSES]: 6600,
  [ProduceType.ONION]: 1500,
};

// ==================== STATUS FLOW ====================

export const PROCUREMENT_FLOW: ProcurementStatus[] = [
  ProcurementStatus.BOOKED,
  ProcurementStatus.ARRIVED,
  ProcurementStatus.GATE_ENTRY,
  ProcurementStatus.WEIGHING,
  ProcurementStatus.QUALITY_CHECK,
  ProcurementStatus.PROCUREMENT,
  ProcurementStatus.PAYMENT_PENDING,
  ProcurementStatus.PAYMENT_PROCESSING,
  ProcurementStatus.COMPLETED,
];
