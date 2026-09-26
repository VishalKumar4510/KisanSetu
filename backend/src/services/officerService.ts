import { procurementRepository } from '../repositories/procurementRepository';
import { farmerRepository } from '../repositories/farmerRepository';
import { centreRepository } from '../repositories/centreRepository';
import { tokenRepository } from '../repositories/tokenRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import store from '../data/store';
import { AppError } from '../middleware/errorHandler';
import {
  ProcurementStatus,
  PaymentStatus,
  NotificationType,
  MSP_RATES,
  ProduceType,
  ScaleEquipment,
} from '../../../shared/types';
import { calculateNetWeight, evaluateQuality, calculateMspPayment } from './procurementMath';
import { defaultNotificationProvider } from './integrations/notificationProvider';
import { procurementService } from './procurementService';

export class OfficerService {
  /**
   * Get operational statistics & KPI metrics for an officer's Mandi centre.
   */
  async getOfficerStats(centreId?: string): Promise<any> {
    const targetCentreId = centreId || store.getAllCentres()[0]?.id;
    const today = new Date().toISOString().split('T')[0];

    const allProcurements = store.getAllProcurements().filter(p => !targetCentreId || p.centreId === targetCentreId);
    const allTokens = store.getAllTokens().filter(t => !targetCentreId || t.centreId === targetCentreId);
    const centrePayments = targetCentreId ? store.getPaymentsByCentre(targetCentreId) : store.getAllPayments();

    const farmersServedToday = allProcurements.filter(p =>
      (p.bookedAt && p.bookedAt.startsWith(today)) ||
      (p.calledAt && p.calledAt.startsWith(today)) ||
      (p.completedAt && p.completedAt.startsWith(today)) ||
      p.status !== ProcurementStatus.BOOKED
    ).length;

    const waitingFarmers = allTokens.filter(t => {
      if (t.status !== 'ACTIVE') return false;
      const proc = allProcurements.find(p => p.tokenId === t.id);
      return !proc || proc.status === ProcurementStatus.BOOKED;
    }).length;

    const completedFarmers = allProcurements.filter(p =>
      p.status === ProcurementStatus.COMPLETED &&
      (!p.completedAt || p.completedAt.startsWith(today) || p.bookedAt?.startsWith(today))
    ).length;

    const completedLots = allProcurements.filter(p => p.status === ProcurementStatus.COMPLETED).length;
    const rejectedLots = allProcurements.filter(p => p.status === ProcurementStatus.REJECTED).length;

    const totalQuantityProcured = Number(
      allProcurements
        .filter(p => p.status === ProcurementStatus.COMPLETED)
        .reduce((sum, p) => {
          const w = store.getWeighingByProcurement(p.id);
          if (w?.netWeight) return sum + w.netWeight;
          const prod = p.produceId ? store.getProduceById(p.produceId) : null;
          return sum + (prod?.quantity || 15);
        }, 0)
        .toFixed(2)
    );

    const totalProcurementValue = centrePayments
      .filter(p => p.status === PaymentStatus.COMPLETED || (p as any).status === 'SUCCESS')
      .reduce((sum, p) => sum + (p.netAmount || 0), 0);

    const paymentsCompleted = centrePayments.filter(p =>
      p.status === PaymentStatus.COMPLETED || (p as any).status === 'SUCCESS'
    ).length;

    const paymentsPending = centrePayments.filter(p =>
      p.status === PaymentStatus.PENDING ||
      (p.status as any) === 'VALIDATING' ||
      (p.status as any) === 'INITIATED' ||
      p.status === PaymentStatus.PROCESSING
    ).length;

    const failedPayments = centrePayments.filter(p => p.status === PaymentStatus.FAILED).length;
    const isQueuePaused = targetCentreId ? store.isQueuePaused(targetCentreId) : false;

    return {
      centreId: targetCentreId,
      farmersServedToday,
      waitingFarmers,
      completedFarmers,
      completedLots,
      rejectedLots,
      totalQuantityProcured,
      totalProcurementValue,
      paymentsCompleted,
      paymentsPending,
      failedPayments,
      isQueuePaused,
    };
  }

  /**
   * Get the farmer currently being processed at the officer desk.
   */
  async getCurrentFarmerAtDesk(centreId?: string): Promise<any> {
    const targetCentreId = centreId || store.getAllCentres()[0]?.id;
    const allTokens = store.getAllTokens().filter(t => !targetCentreId || t.centreId === targetCentreId);
    const allProcurements = store.getAllProcurements().filter(p => !targetCentreId || p.centreId === targetCentreId);

    // Look for in-progress procurement (CALLED, WEIGHING, QUALITY_CHECK, CALCULATED, PAYMENT_REVIEW, PAYMENT_PROCESSING)
    const inProgressStatuses = [
      ProcurementStatus.CALLED,
      ProcurementStatus.ARRIVED,
      ProcurementStatus.GATE_ENTRY,
      ProcurementStatus.WEIGHING,
      ProcurementStatus.QUALITY_CHECK,
      ProcurementStatus.PROCUREMENT,
      ProcurementStatus.PAYMENT_PENDING,
      ProcurementStatus.PAYMENT_PROCESSING,
    ];

    const currentProc = allProcurements.find(p => inProgressStatuses.includes(p.status));
    if (!currentProc) {
      return { active: false, message: 'No farmer currently being processed at desk' };
    }

    const token = allTokens.find(t => t.id === currentProc.tokenId) || (await tokenRepository.findById(currentProc.tokenId));
    const farmer = (await farmerRepository.findById(currentProc.farmerId)) || store.getFarmerById(currentProc.farmerId);
    const produce = currentProc.produceId ? store.getProduceById(currentProc.produceId) : null;
    const weighing = (await procurementRepository.getWeighingByProcurementId(currentProc.id)) || store.getWeighingByProcurement(currentProc.id);
    const quality = (await procurementRepository.getQualityCheckByProcurementId(currentProc.id)) || store.getQualityCheckByProcurement(currentProc.id);
    const payment = (await paymentRepository.findByProcurementId(currentProc.id)) || store.getPaymentByProcurement(currentProc.id);

    return {
      active: true,
      procurement: currentProc,
      token,
      farmer,
      produce,
      weighing,
      qualityCheck: quality,
      payment,
    };
  }

  /**
   * Call next farmer from queue to gate entry / officer desk.
   */
  async callFarmer(centreId: string, tokenId: string, officerName?: string): Promise<any> {
    const token = (await tokenRepository.findById(tokenId).catch(() => null)) || store.getTokenById(tokenId);
    if (!token) throw new AppError('Token not found', 404);

    const farmer = (await farmerRepository.findById(token.farmerId).catch(() => null)) || store.getFarmerById(token.farmerId);
    if (!farmer) throw new AppError('Farmer not found', 404);

    const now = new Date().toISOString();

    // Find or create linked procurement
    let proc = (await procurementRepository.findByTokenId(token.id).catch(() => null)) || store.procurements.find(p => p.tokenId === token.id);
    if (proc) {
      await procurementRepository.updateProcurement(proc.id, {
        status: ProcurementStatus.CALLED,
        calledAt: now,
      }).catch(() => {});
      store.updateProcurement(proc.id, {
        status: ProcurementStatus.CALLED,
        calledAt: now,
      });
      proc = (await procurementRepository.findById(proc.id).catch(() => null)) || proc;
    }

    await tokenRepository.updateToken(token.id, { status: 'ACTIVE' }).catch(() => {});
    store.updateToken(token.id, { status: 'ACTIVE' });

    // Send call alert to farmer
    await defaultNotificationProvider.send({
      userId: farmer.id,
      title: 'Token Called — Proceed to Bay',
      message: `Your token ${token.tokenNumber} has been called. Please proceed to Intake Bay.`,
      type: NotificationType.QUEUE_APPROACHING,
    }).catch(() => {});

    return {
      token,
      procurement: proc,
      farmer,
      calledAt: now,
    };
  }

  /**
   * Record gross/tare weighment and advance state machine to QUALITY_CHECK.
   */
  async submitWeighment(params: {
    procurementId: string;
    grossWeight: number;
    tareWeight: number;
    scaleId?: string;
    officerName?: string;
  }): Promise<any> {
    const { procurementId, grossWeight, tareWeight, scaleId = 'scale-wb-01', officerName } = params;

    // Use pure calculation module
    const { netWeight } = calculateNetWeight(grossWeight, tareWeight);

    const proc = (await procurementRepository.findById(procurementId).catch(() => null)) || store.getProcurementById(procurementId);
    if (!proc) throw new AppError('Procurement not found', 404);

    const now = new Date().toISOString();
    const weighing = await procurementRepository.saveWeighing({
      procurementId,
      grossWeight,
      tareWeight,
      netWeight,
      scaleId,
    }).catch(() => ({ id: `w-${Date.now()}`, procurementId, grossWeight, tareWeight, netWeight, scaleId, timestamp: now }));

    store.createWeighing({
      id: weighing.id,
      procurementId,
      grossWeight,
      tareWeight,
      netWeight,
      timestamp: now,
    });

    // Advance status to QUALITY_CHECK
    await procurementRepository.updateProcurement(procurementId, {
      status: ProcurementStatus.QUALITY_CHECK,
      weighingAt: now,
      scaleId,
    }).catch(() => {});
    store.updateProcurement(procurementId, {
      status: ProcurementStatus.QUALITY_CHECK,
      weighingAt: now,
      scaleId,
    });

    return {
      procurementId,
      weighing,
      status: ProcurementStatus.QUALITY_CHECK,
    };
  }

  /**
   * Record quality inspection and advance state machine to PROCUREMENT.
   */
  async submitQuality(params: {
    procurementId: string;
    crop?: string;
    moistureContent: number;
    foreignMatter?: number;
    damagedGrains?: number;
    grade: string;
    qualityResult?: string;
    remarks?: string;
    officerName?: string;
  }): Promise<any> {
    const { procurementId, moistureContent, foreignMatter = 0, damagedGrains = 0, grade, remarks = '', officerName } = params;

    const proc = (await procurementRepository.findById(procurementId).catch(() => null)) || store.getProcurementById(procurementId);
    if (!proc) throw new AppError('Procurement not found', 404);

    // Use pure evaluation module
    const evaluation = evaluateQuality({
      moistureContent,
      foreignMatter,
      damagedGrains,
    });

    const now = new Date().toISOString();
    const qualityCheck = await procurementRepository.saveQualityCheck({
      procurementId,
      crop: params.crop || proc.crop,
      moistureContent,
      foreignMatter,
      damagedGrains,
      grade: evaluation.grade,
      accepted: evaluation.isAccepted,
      remarks: remarks || evaluation.rejectionReason || 'Certified Agmarknet Grade',
    }).catch(() => ({ id: `qc-${Date.now()}`, procurementId, crop: params.crop || proc.crop, moistureContent, foreignMatter, damagedGrains, grade: evaluation.grade, accepted: evaluation.isAccepted, remarks: remarks || '', timestamp: now }));

    store.createQualityCheck({
      id: qualityCheck.id,
      procurementId,
      moistureContent,
      foreignMatter,
      grade: evaluation.grade as any,
      accepted: evaluation.isAccepted,
      remarks: remarks || '',
      timestamp: now,
    });

    // Advance status to PROCUREMENT
    await procurementRepository.updateProcurement(procurementId, {
      status: ProcurementStatus.PROCUREMENT,
      qualityCheckAt: now,
    }).catch(() => {});
    store.updateProcurement(procurementId, {
      status: ProcurementStatus.PROCUREMENT,
      qualityCheckAt: now,
    });

    return {
      procurementId,
      qualityCheck,
      evaluation,
      status: ProcurementStatus.PROCUREMENT,
    };
  }

  /**
   * Calculate statutory MSP, quality adjustments, and advance to PAYMENT_PENDING.
   */
  async calculateProcurement(procurementId: string, officerName?: string): Promise<any> {
    const proc = (await procurementRepository.findById(procurementId).catch(() => null)) || store.getProcurementById(procurementId);
    if (!proc) throw new AppError('Procurement not found', 404);

    const weighing = (await procurementRepository.getWeighingByProcurementId(proc.id).catch(() => null)) || store.getWeighingByProcurement(proc.id);
    const quality = (await procurementRepository.getQualityCheckByProcurementId(proc.id).catch(() => null)) || store.getQualityCheckByProcurement(proc.id);

    const netQuantity = weighing?.netWeight || proc.quantity || proc.estimatedQuantity || 50;
    const cropType = proc.crop || ProduceType.WHEAT;
    const grade = quality?.grade || 'A';

    // Use pure calculation module
    const calc = calculateMspPayment({
      netQuantity,
      cropType,
      grade,
    });

    const now = new Date().toISOString();
    await procurementRepository.updateProcurement(proc.id, {
      status: ProcurementStatus.PAYMENT_PENDING,
      paymentPendingAt: now,
      calculatedBaseRate: calc.baseRate,
      calculatedAdjustment: calc.qualityAdjustment,
      calculatedGrossAmount: calc.grossAmount,
      calculatedDeductions: calc.deductions,
      calculatedNetAmount: calc.netAmount,
    }).catch(() => {});

    store.updateProcurement(proc.id, {
      status: ProcurementStatus.PAYMENT_PENDING,
      paymentPendingAt: now,
    });

    return {
      procurementId: proc.id,
      netQuantity: calc.netQuantity,
      baseRate: calc.baseRate,
      qualityAdjustment: calc.qualityAdjustment,
      finalRate: calc.finalRate,
      grossAmount: calc.grossAmount,
      statutoryDeductions: calc.deductions,
      finalPayableAmount: calc.netAmount,
      status: ProcurementStatus.PAYMENT_PENDING,
    };
  }

  /**
   * Get procurement & payment history for a specific farmer.
   */
  async getFarmerHistory(farmerId: string): Promise<any> {
    const farmer = (await farmerRepository.findById(farmerId)) || store.getFarmerById(farmerId);
    if (!farmer) throw new AppError('Farmer not found', 404);

    const procurements = await procurementService.getProcurementHistory(farmer.id);
    const payments = await paymentRepository.findByFarmerId(farmer.id);

    return {
      farmer,
      totalProcurements: procurements.length,
      totalPayments: payments.length,
      procurements,
      payments,
    };
  }

  /**
   * Get Mandi equipment and alerts.
   */
  async getAlerts(centreId?: string): Promise<any[]> {
    return store.getAlertsByCentre(centreId);
  }

  async markAlertRead(alertId: string): Promise<boolean> {
    store.markAlertRead(alertId);
    return true;
  }

  async getDailySettlement(centreId?: string): Promise<any> {
    const targetCentreId = centreId || store.getAllCentres()[0]?.id;
    const payments = targetCentreId ? store.getPaymentsByCentre(targetCentreId) : store.getAllPayments();

    const disbursed = payments
      .filter(p => p.status === PaymentStatus.COMPLETED || (p as any).status === 'SUCCESS')
      .reduce((sum, p) => sum + (p.netAmount || 0), 0);

    const pending = payments
      .filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.PROCESSING)
      .reduce((sum, p) => sum + (p.netAmount || 0), 0);

    return {
      centreId: targetCentreId,
      disbursedTotal: disbursed,
      pendingTotal: pending,
      transactionCount: payments.length,
      transactions: payments,
    };
  }

  async getScales(centreId?: string): Promise<ScaleEquipment[]> {
    return store.getScalesByCentre(centreId);
  }

  async updateScale(scaleId: string, status?: string, calibrationDate?: string): Promise<any> {
    const scale = store.getScaleById(scaleId);
    if (!scale) return null;
    if (status) scale.status = status as any;
    if (calibrationDate) scale.lastCalibrationDate = calibrationDate;
    return scale;
  }
}

export const officerService = new OfficerService();
export default officerService;
