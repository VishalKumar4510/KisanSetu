import {
  User, Farmer, Centre, Slot, Token, Produce, Procurement,
  Payment, Notification, Weighing, QualityCheck, AuditLog,
  ProcurementStatus, PaymentStatus, CongestionLevel, AnalyticsDataPoint,
} from '../../../shared/types';
import {
  seedUsers, seedFarmers, seedCentres, seedSlots, seedTokens,
  seedProduce, seedProcurements, seedPayments, seedNotifications,
  seedWeighings, seedQualityChecks, seedAuditLogs, seedAnalytics,
} from './seedData';

class DataStore {
  users: User[] = [];
  farmers: Farmer[] = [];
  centres: Centre[] = [];
  slots: Slot[] = [];
  tokens: Token[] = [];
  produce: Produce[] = [];
  procurements: Procurement[] = [];
  payments: Payment[] = [];
  notifications: Notification[] = [];
  weighings: Weighing[] = [];
  qualityChecks: QualityCheck[] = [];
  auditLogs: AuditLog[] = [];
  analytics: { registrations: AnalyticsDataPoint[]; bookings: AnalyticsDataPoint[]; waitTimes: AnalyticsDataPoint[]; procurements: AnalyticsDataPoint[]; payments: AnalyticsDataPoint[]; } = { registrations: [], bookings: [], waitTimes: [], procurements: [], payments: [] };

  constructor() {
    this.users = [...seedUsers, ...seedFarmers.map(f => ({ ...f } as User))];
    this.farmers = [...seedFarmers];
    this.centres = [...seedCentres];
    this.slots = [...seedSlots];
    this.tokens = [...seedTokens];
    this.produce = [...seedProduce];
    this.procurements = [...seedProcurements];
    this.payments = [...seedPayments];
    this.notifications = [...seedNotifications];
    this.weighings = [...seedWeighings];
    this.qualityChecks = [...seedQualityChecks];
    this.auditLogs = [...seedAuditLogs];
    this.analytics = { ...seedAnalytics };
  }

  // ======= Users =======
  getUserById(id: string): User | undefined { return this.users.find(u => u.id === id); }
  getUserByPhone(phone: string): User | undefined { return this.users.find(u => u.phone === phone); }
  createUser(user: User): User { this.users.push(user); return user; }
  updateUser(id: string, data: Partial<User>): User | undefined {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.users[idx] = { ...this.users[idx], ...data };
    return this.users[idx];
  }

  // ======= Farmers =======
  getAllFarmers(): Farmer[] { return this.farmers; }
  getFarmerById(id: string): Farmer | undefined { return this.farmers.find(f => f.id === id); }
  getFarmerByFarmerId(farmerId: string): Farmer | undefined { return this.farmers.find(f => f.farmerId === farmerId); }
  getFarmerByPhone(phone: string): Farmer | undefined { return this.farmers.find(f => f.phone === phone); }
  createFarmer(farmer: Farmer): Farmer { this.farmers.push(farmer); this.users.push(farmer as unknown as User); return farmer; }
  updateFarmer(id: string, data: Partial<Farmer>): Farmer | undefined {
    const idx = this.farmers.findIndex(f => f.id === id);
    if (idx === -1) return undefined;
    this.farmers[idx] = { ...this.farmers[idx], ...data };
    const uIdx = this.users.findIndex(u => u.id === id);
    if (uIdx !== -1) this.users[uIdx] = { ...this.users[uIdx], ...data };
    return this.farmers[idx];
  }

  // ======= Centres =======
  getAllCentres(): Centre[] { return this.centres; }
  getCentreById(id: string): Centre | undefined { return this.centres.find(c => c.id === id); }
  updateCentre(id: string, data: Partial<Centre>): Centre | undefined {
    const idx = this.centres.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.centres[idx] = { ...this.centres[idx], ...data };
    return this.centres[idx];
  }

  // ======= Slots =======
  getAllSlots(): Slot[] { return this.slots; }
  getSlotById(id: string): Slot | undefined { return this.slots.find(s => s.id === id); }
  getSlotsByCentre(centreId: string): Slot[] { return this.slots.filter(s => s.centreId === centreId); }
  getSlotsByCentreAndDate(centreId: string, date: string): Slot[] {
    return this.slots.filter(s => s.centreId === centreId && s.date === date);
  }
  getAvailableSlots(centreId?: string, date?: string): Slot[] {
    return this.slots.filter(s =>
      s.status === 'AVAILABLE' &&
      s.currentBookings < s.maxCapacity &&
      (!centreId || s.centreId === centreId) &&
      (!date || s.date === date)
    );
  }
  updateSlot(id: string, data: Partial<Slot>): Slot | undefined {
    const idx = this.slots.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.slots[idx] = { ...this.slots[idx], ...data };
    return this.slots[idx];
  }
  createSlot(slot: Slot): Slot { this.slots.push(slot); return slot; }

  // ======= Tokens =======
  getAllTokens(): Token[] { return this.tokens; }
  getTokenById(id: string): Token | undefined { return this.tokens.find(t => t.id === id); }
  getTokenByFarmer(farmerId: string): Token[] { return this.tokens.filter(t => t.farmerId === farmerId); }
  getActiveTokenByFarmer(farmerId: string): Token | undefined {
    return this.tokens.find(t => t.farmerId === farmerId && t.status === 'ACTIVE');
  }
  getQueueByCentre(centreId: string): Token[] {
    return this.tokens
      .filter(t => t.centreId === centreId && t.status === 'ACTIVE')
      .sort((a, b) => a.queuePosition - b.queuePosition);
  }
  createToken(token: Token): Token { this.tokens.push(token); return token; }
  updateToken(id: string, data: Partial<Token>): Token | undefined {
    const idx = this.tokens.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    this.tokens[idx] = { ...this.tokens[idx], ...data };
    return this.tokens[idx];
  }

  // ======= Produce =======
  getAllProduce(): Produce[] { return this.produce; }
  getProduceById(id: string): Produce | undefined { return this.produce.find(p => p.id === id); }
  getProduceByFarmer(farmerId: string): Produce[] { return this.produce.filter(p => p.farmerId === farmerId); }
  createProduce(prod: Produce): Produce { this.produce.push(prod); return prod; }

  // ======= Procurements =======
  getAllProcurements(): Procurement[] { return this.procurements; }
  getProcurementById(id: string): Procurement | undefined { return this.procurements.find(p => p.id === id); }
  getProcurementByFarmer(farmerId: string): Procurement[] { return this.procurements.filter(p => p.farmerId === farmerId); }
  getActiveProcurement(farmerId: string): Procurement | undefined {
    return this.procurements.find(p => p.farmerId === farmerId && p.status !== ProcurementStatus.COMPLETED);
  }
  getActiveProcurements(): Procurement[] {
    return this.procurements.filter(p => p.status !== ProcurementStatus.COMPLETED);
  }
  getCompletedToday(): Procurement[] {
    const today = new Date().toISOString().split('T')[0];
    return this.procurements.filter(p =>
      p.status === ProcurementStatus.COMPLETED && p.completedAt && p.completedAt.startsWith(today)
    );
  }
  getProcurementsByCentre(centreId: string): Procurement[] {
    return this.procurements.filter(p => p.centreId === centreId);
  }
  createProcurement(proc: Procurement): Procurement { this.procurements.push(proc); return proc; }
  updateProcurement(id: string, data: Partial<Procurement>): Procurement | undefined {
    const idx = this.procurements.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.procurements[idx] = { ...this.procurements[idx], ...data };
    return this.procurements[idx];
  }

  // ======= Payments =======
  getAllPayments(): Payment[] { return this.payments; }
  getPaymentById(id: string): Payment | undefined { return this.payments.find(p => p.id === id); }
  getPaymentsByFarmer(farmerId: string): Payment[] { return this.payments.filter(p => p.farmerId === farmerId); }
  getPaymentByProcurement(procurementId: string): Payment | undefined {
    return this.payments.find(p => p.procurementId === procurementId);
  }
  getCurrentPayment(farmerId: string): Payment | undefined {
    return this.payments.filter(p => p.farmerId === farmerId).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }
  createPayment(payment: Payment): Payment { this.payments.push(payment); return payment; }
  updatePayment(id: string, data: Partial<Payment>): Payment | undefined {
    const idx = this.payments.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.payments[idx] = { ...this.payments[idx], ...data };
    return this.payments[idx];
  }

  // ======= Notifications =======
  getNotificationsByUser(userId: string): Notification[] {
    return this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  getUnreadCount(userId: string): number {
    return this.notifications.filter(n => n.userId === userId && !n.read).length;
  }
  createNotification(notification: Notification): Notification {
    this.notifications.push(notification);
    return notification;
  }
  updateNotification(id: string, data: Partial<Notification>): void {
    const idx = this.notifications.findIndex(n => n.id === id);
    if (idx !== -1) this.notifications[idx] = { ...this.notifications[idx], ...data };
  }
  markAllRead(userId: string): void {
    this.notifications.forEach(n => { if (n.userId === userId) n.read = true; });
  }

  // ======= Weighings =======
  createWeighing(w: Weighing): Weighing { this.weighings.push(w); return w; }
  getWeighingByProcurement(procurementId: string): Weighing | undefined {
    return this.weighings.find(w => w.procurementId === procurementId);
  }

  // ======= Quality Checks =======
  createQualityCheck(qc: QualityCheck): QualityCheck { this.qualityChecks.push(qc); return qc; }
  getQualityCheckByProcurement(procurementId: string): QualityCheck | undefined {
    return this.qualityChecks.find(qc => qc.procurementId === procurementId);
  }

  // ======= Audit Logs =======
  createAuditLog(log: AuditLog): AuditLog { this.auditLogs.push(log); return log; }

  // ======= Analytics Helpers =======
  getTodaysBookings(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.procurements.filter(p => p.bookedAt && p.bookedAt.startsWith(today)).length;
  }
  getActiveQueueCount(): number {
    return this.tokens.filter(t => t.status === 'ACTIVE').length;
  }
  getAvgWaitTime(): number {
    const activeTokens = this.tokens.filter(t => t.status === 'ACTIVE');
    if (activeTokens.length === 0) return 0;
    const totalMinutes = activeTokens.reduce((sum, t) => {
      const mins = parseInt(t.estimatedTime) || 15;
      return sum + mins;
    }, 0);
    return Math.round(totalMinutes / activeTokens.length);
  }
}

const store = new DataStore();
export default store;
