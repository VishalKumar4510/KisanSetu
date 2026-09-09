import { User, Farmer, Centre, Slot, Token, Produce, Procurement, Payment, Notification, CentreStats, KPIData, AnalyticsDataPoint, DemoState } from './index';

// ==================== API WRAPPERS ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ==================== AUTH ====================

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  phone: string;
  password: string;
  role: string;
  aadhaar?: string;
  language?: 'en' | 'hi';
  village?: string;
  district?: string;
  state?: string;
  landArea?: number;
  crops?: string[];
}

// ==================== SLOT BOOKING ====================

export interface BookSlotRequest {
  farmerId: string;
  centreId: string;
  slotId: string;
  produceId: string;
}

export interface BookSlotResponse {
  token: Token;
  procurement: Procurement;
}

// ==================== SLOT RECOMMENDATION ====================

export interface SlotRecommendation {
  slot: Slot;
  centre: Centre;
  score: number;
  reason: string;
  reasonHi: string;
}

// ==================== AI ====================

export interface AIQueryRequest {
  query: string;
  farmerId?: string;
}

export interface AIQueryResponse {
  answer: string;
  answerHi: string;
  data?: any;
}

// ==================== PROCUREMENT UPDATE ====================

export interface UpdateProcurementRequest {
  status: string;
  weighingData?: {
    grossWeight: number;
    tareWeight: number;
    netWeight: number;
  };
  qualityData?: {
    moistureContent: number;
    foreignMatter: number;
    grade: 'A' | 'B' | 'C';
    accepted: boolean;
    remarks: string;
  };
}

// ==================== ANALYTICS ====================

export interface ChartDataRequest {
  type: 'registrations' | 'bookings' | 'waitTime' | 'queueLength' | 'utilization' | 'procurement' | 'payments';
  period: 'today' | '7d' | '30d';
  centreId?: string;
}
