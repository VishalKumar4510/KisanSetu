import {
  User, Farmer, Centre, Slot, Token, Produce, Procurement,
  Payment, Notification, Weighing, QualityCheck, AuditLog,
  ProcurementStatus, PaymentStatus, CongestionLevel, AnalyticsDataPoint,
  ScaleEquipment, OfficerAlert, ScaleStatus,
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
  analytics: Record<string, AnalyticsDataPoint[]> = {};
  scales: ScaleEquipment[] = [];
  officerAlerts: OfficerAlert[] = [];
  pausedCentres: Set<string> = new Set();

  constructor() {
    this.reset();
  }

  reset(): void {
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
    this.pausedCentres = new Set();

    // Seed realistic scales for centers
    const centreIds = this.centres.map(c => c.id);
    const primaryCentreId = centreIds[0] || 'centre-1';
    this.scales = [
      {
        id: 'scale-wb-01',
        centreId: primaryCentreId,
        name: 'Weighbridge #01',
        type: 'WEIGHBRIDGE',
        capacityKg: 50000,
        status: 'ONLINE',
        lastCalibrationDate: '2026-09-01',
      },
      {
        id: 'scale-wb-02',
        centreId: primaryCentreId,
        name: 'Weighbridge #02',
        type: 'WEIGHBRIDGE',
        capacityKg: 50000,
        status: 'ONLINE',
        lastCalibrationDate: '2026-09-05',
      },
      {
        id: 'scale-plt-03',
        centreId: primaryCentreId,
        name: 'Platform Scale #03',
        type: 'PLATFORM_SCALE',
        capacityKg: 3000,
        status: 'ONLINE',
        lastCalibrationDate: '2026-09-10',
      },
    ];

    // Seed realistic operational alerts
    this.officerAlerts = [
      {
        id: 'alert-01',
        centreId: primaryCentreId,
        severity: 'WARNING',
        title: 'Moisture Inspection Flag',
        message: 'Recent arrivals from Sector 4 showing elevated moisture readings (>12.5%). Ensure rigorous sampling.',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        read: false,
      },
      {
        id: 'alert-02',
        centreId: primaryCentreId,
        severity: 'INFO',
        title: 'Scale Calibration Verified',
        message: 'Weighbridge #01 and #02 daily zero-load calibration verified by Legal Metrology Dept.',
        timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        read: true,
      },
      {
        id: 'alert-03',
        centreId: primaryCentreId,
        severity: 'INFO',
        title: 'Demo Settlement Batch Reconciliation',
        message: 'Previous procurement demo batch of 24 lots settled in simulated banking gateway.',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        read: true,
      },
    ];
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
  getFarmerById(id: string): Farmer | undefined { return this.farmers.find(f => f.id === id || f.farmerId === id); }
  getFarmerByFarmerId(farmerId: string): Farmer | undefined { return this.farmers.find(f => f.farmerId === farmerId || f.id === farmerId); }
  getFarmerByPhone(phone: string): Farmer | undefined { return this.farmers.find(f => f.phone === phone); }
  createFarmer(farmer: Farmer): Farmer { this.farmers.push(farmer); this.users.push(farmer as unknown as User); return farmer; }
  updateFarmer(id: string, data: Partial<Farmer>): Farmer | undefined {
    const idx = this.farmers.findIndex(f => f.id === id || f.farmerId === id);
    if (idx === -1) return undefined;
    this.farmers[idx] = { ...this.farmers[idx], ...data };
    const uIdx = this.users.findIndex(u => u.id === id);
    if (uIdx !== -1) this.users[uIdx] = { ...this.users[uIdx], ...data };
    return this.farmers[idx];
  }

  private resolveFarmerInternalId(farmerId: string): string {
    if (!farmerId) return farmerId;
    const f = this.farmers.find(farmer => farmer.id === farmerId || farmer.farmerId === farmerId);
    return f ? f.id : farmerId;
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
  getTokenByFarmer(farmerId: string): Token[] {
    const id = this.resolveFarmerInternalId(farmerId);
    return this.tokens.filter(t => t.farmerId === id || t.farmerId === farmerId);
  }
  getActiveTokenByFarmer(farmerId: string): Token | undefined {
    const id = this.resolveFarmerInternalId(farmerId);
    return this.tokens.find(t => (t.farmerId === id || t.farmerId === farmerId) && t.status === 'ACTIVE');
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
  getProduceByFarmer(farmerId: string): Produce[] {
    const id = this.resolveFarmerInternalId(farmerId);
    return this.produce.filter(p => p.farmerId === id || p.farmerId === farmerId);
  }
  createProduce(prod: Produce): Produce { this.produce.push(prod); return prod; }

  // ======= Procurements =======
  getAllProcurements(): Procurement[] { return this.procurements; }
  getProcurementById(id: string): Procurement | undefined { return this.procurements.find(p => p.id === id); }
  getProcurementByFarmer(farmerId: string): Procurement[] {
    const id = this.resolveFarmerInternalId(farmerId);
    return this.procurements.filter(p => p.farmerId === id || p.farmerId === farmerId);
  }
  getActiveProcurement(farmerId: string): Procurement | undefined {
    const id = this.resolveFarmerInternalId(farmerId);
    return this.procurements.find(p => (p.farmerId === id || p.farmerId === farmerId) && p.status !== ProcurementStatus.COMPLETED);
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
  getPaymentsByFarmer(farmerId: string): Payment[] {
    const id = this.resolveFarmerInternalId(farmerId);
    return this.payments.filter(p => p.farmerId === id || p.farmerId === farmerId);
  }
  getPaymentByProcurement(procurementId: string): Payment | undefined {
    return this.payments.find(p => p.procurementId === procurementId);
  }
  getCurrentPayment(farmerId: string): Payment | undefined {
    const id = this.resolveFarmerInternalId(farmerId);
    return this.payments.filter(p => p.farmerId === id || p.farmerId === farmerId).sort((a, b) =>
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
  upsertWeighing(w: Weighing): Weighing {
    const idx = this.weighings.findIndex(item => item.procurementId === w.procurementId);
    if (idx !== -1) {
      this.weighings[idx] = { ...this.weighings[idx], ...w };
      return this.weighings[idx];
    }
    this.weighings.push(w);
    return w;
  }
  getWeighingByProcurement(procurementId: string): Weighing | undefined {
    return this.weighings.find(w => w.procurementId === procurementId);
  }

  // ======= Quality Checks =======
  createQualityCheck(qc: QualityCheck): QualityCheck { this.qualityChecks.push(qc); return qc; }
  upsertQualityCheck(qc: QualityCheck): QualityCheck {
    const idx = this.qualityChecks.findIndex(item => item.procurementId === qc.procurementId);
    if (idx !== -1) {
      this.qualityChecks[idx] = { ...this.qualityChecks[idx], ...qc };
      return this.qualityChecks[idx];
    }
    this.qualityChecks.push(qc);
    return qc;
  }
  getQualityCheckByProcurement(procurementId: string): QualityCheck | undefined {
    return this.qualityChecks.find(qc => qc.procurementId === procurementId);
  }

  // ======= Audit Logs & Timeline =======
  createAuditLog(log: AuditLog): AuditLog { this.auditLogs.push(log); return log; }
  addTimelineEvent(procurementId: string, event: { stage: string; label: string; timestamp: string; details?: string; actor?: string }): void {
    const proc = this.getProcurementById(procurementId);
    if (proc) {
      if (!proc.timeline) proc.timeline = [];
      proc.timeline.push(event);
    }
  }
  getPaymentsByCentre(centreId: string): Payment[] {
    const procIds = new Set(this.procurements.filter(p => p.centreId === centreId).map(p => p.id));
    return this.payments.filter(p => procIds.has(p.procurementId));
  }

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
      let mins = 15;
      if (t.estimatedTime) {
        if (t.estimatedTime.includes('T') || t.estimatedTime.includes('-')) {
          const diffMs = new Date(t.estimatedTime).getTime() - Date.now();
          mins = Math.max(5, Math.round(diffMs / 60000));
          if (isNaN(mins) || mins > 120) mins = 18;
        } else {
          mins = parseInt(t.estimatedTime, 10);
          if (isNaN(mins) || mins > 300) mins = 18;
        }
      }
      return sum + mins;
    }, 0);
    return Math.round(totalMinutes / activeTokens.length);
  }

  // ======= Scales =======
  getScalesByCentre(centreId?: string): ScaleEquipment[] {
    return this.scales.filter(s => !centreId || s.centreId === centreId);
  }
  getScaleById(id: string): ScaleEquipment | undefined {
    return this.scales.find(s => s.id === id);
  }
  updateScaleStatus(id: string, status: ScaleStatus): ScaleEquipment | undefined {
    const scale = this.scales.find(s => s.id === id);
    if (scale) scale.status = status;
    return scale;
  }

  // ======= Officer Alerts =======
  getAlertsByCentre(centreId?: string): OfficerAlert[] {
    return this.officerAlerts
      .filter(a => !centreId || a.centreId === centreId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  markAlertRead(id: string): OfficerAlert | undefined {
    const alert = this.officerAlerts.find(a => a.id === id);
    if (alert) alert.read = true;
    return alert;
  }
  addOfficerAlert(alert: OfficerAlert): OfficerAlert {
    this.officerAlerts.unshift(alert);
    return alert;
  }

  // ======= Queue Paused =======
  isQueuePaused(centreId: string): boolean {
    return this.pausedCentres.has(centreId);
  }
  setQueuePaused(centreId: string, paused: boolean): boolean {
    if (paused) {
      this.pausedCentres.add(centreId);
    } else {
      this.pausedCentres.delete(centreId);
    }
    return paused;
  }
}

const store = new DataStore();
export default store;
