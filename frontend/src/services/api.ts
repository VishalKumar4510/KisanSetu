import axios from 'axios';

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
  login: (phone: string, password: string) => api.post('/auth/login', { phone, password }),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Farmers
export const farmerAPI = {
  getProfile: () => api.get('/farmers/me'),
  updateProfile: (data: any) => api.put('/farmers/me', data),
  getProduce: () => api.get('/farmers/produce'),
  registerProduce: (data: any) => api.post('/farmers/produce', data),
  getAll: () => api.get('/farmers'),
  getById: (id: string) => api.get(`/farmers/${id}`),
};

// Centres
export const centreAPI = {
  getAll: () => api.get('/centres'),
  getById: (id: string) => api.get(`/centres/${id}`),
  getStats: (id: string) => api.get(`/centres/${id}/stats`),
};

// Slots
export const slotAPI = {
  getAvailable: (centreId?: string, date?: string) => api.get('/slots/available', { params: { centreId, date } }),
  getRecommended: (farmerId?: string) => api.get('/slots/recommended', { params: { farmerId } }),
  book: (data: { centreId: string; slotId: string; produceId?: string }) => api.post('/slots/book', data),
  cancel: (tokenId: string) => api.post('/slots/cancel', { tokenId }),
};

// Queue
export const queueAPI = {
  getCentreQueue: (centreId: string) => api.get(`/queue/centre/${centreId}`),
  getPosition: (farmerId?: string) => api.get('/queue/position', { params: { farmerId } }),
  callNext: (centreId: string) => api.post('/queue/next', { centreId }),
};

// Procurement
export const procurementAPI = {
  getCurrent: (farmerId?: string) => api.get('/procurement/current', { params: { farmerId } }),
  getHistory: (farmerId?: string) => api.get('/procurement/history', { params: { farmerId } }),
  getById: (id: string) => api.get(`/procurement/${id}`),
  updateStatus: (id: string, data: any) => api.put(`/procurement/${id}/status`, data),
  getAll: (params?: any) => api.get('/procurement', { params }),
};

// Payments
export const paymentAPI = {
  getCurrent: (farmerId?: string) => api.get('/payments/current', { params: { farmerId } }),
  getHistory: (farmerId?: string) => api.get('/payments/history', { params: { farmerId } }),
  getAll: (params?: any) => api.get('/payments', { params }),
  process: (id: string) => api.put(`/payments/${id}/process`),
};

// Notifications
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  create: (data: any) => api.post('/notifications', data),
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

export default api;
