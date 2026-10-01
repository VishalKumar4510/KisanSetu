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
  CALLED = 'CALLED',
  ARRIVED = 'ARRIVED',
  GATE_ENTRY = 'GATE_ENTRY',
  WEIGHING = 'WEIGHING',
  QUALITY_CHECK = 'QUALITY_CHECK',
  PROCUREMENT = 'PROCUREMENT',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  CREATED = 'CREATED',
  VALIDATING = 'VALIDATING',
  INITIATED = 'INITIATED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
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
  farmerId?: string;
  aadhaar?: string;
  language?: 'en' | 'hi' | string;
  createdAt?: string;
}

export interface Farmer extends User {
  farmerId: string;
  village: string;
  district: string;
  state: string;
  landArea: number;
  crops: ProduceType[];
  role: UserRole.FARMER;
  bankAccount?: string;
  maskedBankAccount?: string;
  ifsc?: string;
  bankName?: string;
  bankVerificationStatus?: string;
  activeToken?: any;
  activeProcurement?: any;
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
  isQueuePaused?: boolean;
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
  centreName?: string;
  slotDate?: string;
  date?: string;
  slotTime?: string;
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

export interface ProcurementTimelineEvent {
  stage: string;
  label: string;
  timestamp: string;
  details?: string;
  actor?: string;
}

export interface Procurement {
  id: string;
  farmerId: string;
  centreId: string;
  tokenId: string;
  produceId: string;
  crop?: string;
  quantity?: number;
  estimatedQuantity?: number;
  status: ProcurementStatus;
  bookedAt?: string;
  calledAt?: string;
  arrivedAt?: string;
  gateEntryAt?: string;
  weighingAt?: string;
  qualityCheckAt?: string;
  procurementAt?: string;
  paymentPendingAt?: string;
  paymentProcessingAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  scaleId?: string;
  calculatedBaseRate?: number;
  calculatedAdjustment?: number;
  calculatedGrossAmount?: number;
  calculatedDeductions?: number;
  calculatedNetAmount?: number;
  netQuantity?: number;
  finalPayableAmount?: number;
  receiptNumber?: string;
  timeline?: ProcurementTimelineEvent[];
}

export interface Weighing {
  id: string;
  procurementId: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  scaleId?: string;
  timestamp: string;
}

export interface QualityCheck {
  id: string;
  procurementId: string;
  crop?: string;
  moistureContent: number;
  foreignMatter: number;
  damagedGrains?: number;
  grade: 'A' | 'B' | 'C' | string;
  qualityResult?: 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVIEW';
  accepted: boolean;
  remarks: string;
  timestamp: string;
}

export interface Payment {
  id: string;
  procurementId: string;
  farmerId: string;
  bookingId?: string;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  amount?: number;
  status: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  utr?: string;
  dbtReferenceId?: string;
  initiatedAt?: string;
  completedAt?: string;
  processedAt?: string;
  accountNumber?: string;
  failureReason?: string;
  providerName?: string;
  providerReference?: string;
  idempotencyKey?: string;
  webhookEventId?: string;
  providerStatus?: string;
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

// ==================== OFFICER CONSOLE TYPES ====================

export type ScaleStatus = 'ONLINE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE';

export interface ScaleEquipment {
  id: string;
  centreId: string;
  name: string;
  type: 'WEIGHBRIDGE' | 'PLATFORM_SCALE';
  capacityKg: number;
  status: ScaleStatus;
  lastCalibrationDate: string;
}

export type OfficerAlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface OfficerAlert {
  id: string;
  centreId: string;
  severity: OfficerAlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  relatedFarmerId?: string;
  relatedProcurementId?: string;
  relatedPaymentId?: string;
}

export interface FarmerProcurementRecord {
  id: string;
  date: string;
  tokenNumber: string;
  crop: string;
  quantity: number;
  qualityGrade: string;
  amount: number;
  paymentStatus: string;
  utr?: string;
  receiptId?: string;
}

export interface FarmerHistoryData {
  farmerId: string;
  name: string;
  phone: string;
  village: string;
  district: string;
  state: string;
  crop: string;
  currentStatus: string;
  previousProcurementCount: number;
  totalQuantityProcured: number;
  totalAmountPaid: number;
  records: FarmerProcurementRecord[];
}

export interface SettlementData {
  centreId: string;
  centreName: string;
  date: string;
  farmersServed: number;
  lotsCompleted: number;
  lotsRejected: number;
  totalQuantity: number;
  grossProcurementValue: number;
  totalDeductions: number;
  netDisbursed: number;
  paymentsCompleted: number;
  paymentsProcessing: number;
  paymentsPending: number;
  paymentsFailed: number;
  hourlyFlow: { hour: string; count: number }[];
  dailyVolume: { day: string; quantity: number }[];
}

export interface CurrentFarmerData {
  active: boolean;
  message?: string;
  procurement?: Procurement;
  token?: Token;
  farmer?: Farmer;
  produce?: Produce | null;
  weighing?: Weighing | null;
  qualityCheck?: QualityCheck | null;
  quality?: QualityCheck | null;
  payment?: Payment | null;
}

export interface QualityFormData {
  crop: string;
  moistureContent: string;
  foreignMatter: string;
  damagedGrains: string;
  grade: string;
  qualityResult: 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVIEW';
  remarks: string;
}

export interface CalculationData {
  procurementId?: string;
  netQuantity: number;
  baseRate: number;
  qualityAdjustment: number;
  finalRate: number;
  grossAmount: number;
  statutoryDeductions?: number;
  deductions?: number;
  finalPayableAmount: number;
  status?: ProcurementStatus | string;
}

export interface PaymentReviewData {
  procurementId: string;
  farmerId: string;
  farmerName: string;
  crop: string;
  netQuantity: number;
  quantity?: number;
  tokenNumber?: string;
  transactionId?: string;
  grossAmount: number;
  deductions: number;
  finalPayableAmount: number;
  netAmount: number;
  maskedBankAccount: string;
  bankName: string;
  ifsc: string;
  bankVerificationStatus: string;
  paymentMethod: string;
  procurement?: Procurement;
  farmer?: Partial<Farmer> & { maskedBankAccount?: string; farmerId?: string; name?: string; bankName?: string; ifsc?: string };
  weighing?: Weighing | null;
  qualityCheck?: QualityCheck | null;
  payment?: Payment | null;
}

export interface ReceiptData {
  receiptNumber: string;
  issuedAt: string;
  receiptDate?: string;
  officerName?: string;
  procurement: Procurement;
  farmer: Farmer;
  centre: Centre;
  token: Token;
  weighing?: Weighing | null;
  qualityCheck?: QualityCheck | null;
  payment?: Payment | null;
}

export interface SettlementSummary {
  centreId: string;
  disbursedTotal: number;
  pendingTotal: number;
  transactionCount: number;
  transactions: Payment[];
  centreName?: string;
  date?: string;
  farmersServed?: number;
  lotsCompleted?: number;
  lotsRejected?: number;
  totalQuantity?: number;
  grossProcurementValue?: number;
  totalDeductions?: number;
  netDisbursed?: number;
  paymentsCompleted?: number;
  paymentsProcessing?: number;
  paymentsPending?: number;
  paymentsFailed?: number;
  hourlyFlow?: { hour: string; count: number }[];
  dailyVolume?: { day: string; quantity: number }[];
}

export interface OfficerStats {
  centreId?: string;
  farmersServedToday: number;
  waitingFarmers: number;
  completedFarmers: number;
  completedLots?: number;
  rejectedLots?: number;
  totalQuantityProcured: number;
  totalProcurementValue: number;
  paymentsCompleted: number;
  paymentsPending: number;
  failedPayments?: number;
  avgWaitTime?: number;
  avgServiceTime?: number;
  isQueuePaused?: boolean;
  procurementsToday?: number;
  pendingQueue?: number;
  avgWaitMinutes?: number;
  totalProcuredKg?: number;
  activeScalesCount?: number;
  unreadAlertsCount?: number;
}

export * from './api';



