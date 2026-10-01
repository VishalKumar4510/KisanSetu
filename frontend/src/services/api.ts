import axios from 'axios';
import {
  RegisterRequest,
  Farmer,
  Produce,
  ProduceType,
  Procurement,
  Payment,
  Notification,
  Centre,
  Slot,
  Token,
  User,
  OfficerStats,
  CurrentFarmerData,
  CalculationData,
  PaymentReviewData,
  ReceiptData,
  FarmerHistoryData,
  OfficerAlert,
  SettlementSummary,
  ScaleEquipment,
  SubmitWeighmentRequest,
  SubmitQualityRequest,
  ApiResponse,
} from '@shared/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kisansetu_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kisansetu_token');
      localStorage.removeItem('kisansetu_user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (phone: string, password: string) => api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', { phone, password }),
  register: (data: RegisterRequest) => api.post<ApiResponse<{ token?: string; user?: User }>>('/auth/register', data),
  getMe: () => api.get<ApiResponse<User>>('/auth/me'),
};

// Farmers
export const farmerAPI = {
  getProfile: () => api.get<{ success: boolean; data: Farmer }>('/farmers/me'),
  updateProfile: (data: Partial<Farmer>) => api.put<{ success: boolean; data: Farmer }>('/farmers/me', data),
  getProduce: () => api.get<{ success: boolean; data: Produce[] }>('/farmers/produce'),
  registerProduce: (data: { type: ProduceType | string; quantity: number; unit?: string; mspRate?: number }) => api.post<{ success: boolean; data: Produce }>('/farmers/produce', data),
  getAll: () => api.get<{ success: boolean; data: Farmer[] }>('/farmers'),
  getById: (id: string) => api.get<{ success: boolean; data: Farmer }>(`/farmers/${id}`),
};

// Centres
export const centreAPI = {
  getAll: () => api.get<ApiResponse<Centre[]>>('/centres'),
  getById: (id: string) => api.get<{ success: boolean; data: Centre }>(`/centres/${id}`),
  getStats: (id: string) => api.get(`/centres/${id}/stats`),
};

// Slots
export const slotAPI = {
  getAvailable: (centreId?: string, date?: string) => api.get<{ success: boolean; data: Slot[] }>('/slots/available', { params: { centreId, date } }),
  getRecommended: (farmerId?: string) => api.get('/slots/recommended', { params: { farmerId } }),
  book: (data: { centreId: string; slotId: string; produceId?: string }) => api.post<{ success: boolean; data: { token: Token; procurement: Procurement } }>('/slots/book', data),
  cancel: (tokenId: string) => api.post<{ success: boolean }>('/slots/cancel', { tokenId }),
};

// Queue
export const queueAPI = {
  getCentreQueue: (centreId: string) => api.get(`/queue/centre/${centreId}`),
  getPosition: (farmerId?: string) => api.get('/queue/position', { params: { farmerId } }),
  callNext: (centreId: string) => api.post('/queue/next', { centreId }),
};

// Procurement
export const procurementAPI = {
  getCurrent: (farmerId?: string) => api.get<{ success: boolean; data: Procurement | null }>('/procurement/current', { params: { farmerId } }),
  getHistory: (farmerId?: string) => api.get<{ success: boolean; data: Procurement[] }>('/procurement/history', { params: { farmerId } }),
  getById: (id: string) => api.get<{ success: boolean; data: Procurement }>(`/procurement/${id}`),
  updateStatus: (id: string, data: { status: string; [key: string]: unknown }) => api.put<{ success: boolean; data: Procurement }>(`/procurement/${id}/status`, data),
  getAll: (params?: { farmerId?: string; centreId?: string; status?: string }) => api.get<{ success: boolean; data: Procurement[] }>('/procurement', { params }),
};

// Payments
export const paymentAPI = {
  getCurrent: (farmerId?: string) => api.get<{ success: boolean; data: Payment | null }>('/payments/current', { params: { farmerId } }),
  getHistory: (farmerId?: string) => api.get<{ success: boolean; data: Payment[] }>('/payments/history', { params: { farmerId } }),
  getAll: (params?: { farmerId?: string; centreId?: string; status?: string }) => api.get<{ success: boolean; data: Payment[] }>('/payments', { params }),
  process: (id: string) => api.put<{ success: boolean; data: Payment }>(`/payments/${id}/process`),
};

// Notifications
export const notificationAPI = {
  getAll: () => api.get<ApiResponse<{ notifications: Notification[]; unreadCount: number }>>('/notifications'),
  markRead: (id: string) => api.put<{ success: boolean }>(`/notifications/${id}/read`),
  markAllRead: () => api.put<{ success: boolean }>('/notifications/read-all'),
  create: (data: Partial<Notification>) => api.post<{ success: boolean; data: Notification }>('/notifications', data),
};

// Analytics
export const analyticsAPI = {
  getKPIs: () => api.get('/analytics/kpis'),
  getChartData: (type: string, period: string = '7d', centreId?: string) =>
    api.get(`/analytics/charts/${type}`, { params: { period, centreId } }),
  getCentreComparison: () => api.get('/analytics/centre-comparison'),
};

// Demo
export const demoAPI = {
  start: (speed?: number) => api.post('/demo/start', { speed }),
  stop: () => api.post('/demo/stop'),
  getState: () => api.get('/demo/state'),
  step: () => api.post('/demo/step'),
};

// AI
export const aiAPI = {
  query: (query: string, farmerId?: string) => api.post('/ai/query', { query, farmerId }),
};

// Officer Workflow API
export const officerAPI = {
  getStats: (centreId?: string) => api.get<ApiResponse<OfficerStats>>('/officer/stats', { params: { centreId } }),
  getCurrentFarmer: (centreId?: string) => api.get<ApiResponse<CurrentFarmerData>>('/officer/current-farmer', { params: { centreId } }),
  callFarmer: (centreId: string, tokenId?: string) => api.post<ApiResponse<{ token: Token; procurement?: Procurement; farmer: Farmer }>>('/officer/call', { centreId, tokenId }),
  submitWeighment: (data: SubmitWeighmentRequest) =>
    api.post<ApiResponse<{ procurementId: string; weighing: unknown; status: string }>>('/officer/weighment', data),
  submitQuality: (data: SubmitQualityRequest) =>
    api.post<ApiResponse<{ procurementId: string; qualityCheck: unknown; status: string }>>('/officer/quality', data),
  calculateProcurement: (procurementId: string) => api.post<ApiResponse<CalculationData>>('/officer/calculate', { procurementId }),
  getPaymentReview: (procurementId: string) => api.post<ApiResponse<PaymentReviewData>>('/officer/payment/review', { procurementId }),
  initiatePayment: (procurementId: string) => api.post<ApiResponse<{ success: boolean; payment: Payment }>>('/officer/payment/initiate', { procurementId }),
  processPayment: (paymentId: string, simulateFailure?: boolean) =>
    api.post<ApiResponse<{ success: boolean; payment: Payment }>>('/officer/payment/process', { paymentId, simulateFailure }),
  getPayments: (centreId?: string, status?: string) => api.get<ApiResponse<Payment[]>>('/officer/payments', { params: { centreId, status } }),
  getReceipt: (procurementId: string) => api.get<ApiResponse<ReceiptData>>(`/officer/procurement/${procurementId}/receipt`),
  getQueue: (centreId?: string) => api.get<ApiResponse<unknown[] | { items: unknown[]; isQueuePaused?: boolean }>>('/officer/queue', { params: { centreId } }),
  pauseQueue: (centreId: string, reason?: string) => api.post<ApiResponse<{ success: boolean; message: string }>>('/officer/queue/pause', { centreId, reason }),
  resumeQueue: (centreId: string) => api.post<ApiResponse<{ success: boolean; message: string }>>('/officer/queue/resume', { centreId }),
  getFarmerHistory: (farmerId: string) => api.get<ApiResponse<FarmerHistoryData>>(`/officer/farmers/${farmerId}/history`),
  getAlerts: (centreId?: string) => api.get<ApiResponse<OfficerAlert[] | { alerts: OfficerAlert[]; unreadCount: number }>>('/officer/alerts', { params: { centreId } }),
  markAlertRead: (alertId: string) => api.patch<ApiResponse<{ success: boolean }>>(`/officer/alerts/${alertId}/read`),
  getSettlement: (centreId?: string) => api.get<ApiResponse<SettlementSummary>>('/officer/settlement', { params: { centreId } }),
  getScales: (centreId?: string) => api.get<ApiResponse<ScaleEquipment[]>>('/officer/scales', { params: { centreId } }),
  updateScale: (id: string, status: string) => api.patch<ApiResponse<ScaleEquipment>>(`/officer/scales/${id}`, { status }),
};

export default api;

