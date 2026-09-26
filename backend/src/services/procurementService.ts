import { procurementRepository } from '../repositories/procurementRepository';
import { farmerRepository } from '../repositories/farmerRepository';
import { centreRepository } from '../repositories/centreRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { tokenRepository } from '../repositories/tokenRepository';
import store from '../data/store';
import { AppError } from '../middleware/errorHandler';
import { Procurement, ProcurementStatus } from '../../../shared/types';
import { ProcurementStateMachine } from './procurementStateMachine';

export class ProcurementService {
  /**
   * Get currently active procurement for an authenticated farmer.
   */
  async getCurrentProcurement(farmerId: string): Promise<Procurement | null> {
    const active = await procurementRepository.findActiveByFarmerId(farmerId);
    if (active) return active;

    // Fallback to in-memory store if legacy tests or compatibility requires
    const storeProc = store.getActiveProcurement(farmerId);
    return storeProc || null;
  }

  /**
   * Get procurement history for a farmer.
   */
  async getProcurementHistory(farmerId: string): Promise<Procurement[]> {
    const all = await procurementRepository.getAllProcurements();
    const farmerProcs = all.filter(p => p.farmerId === farmerId);
    if (farmerProcs.length > 0) return farmerProcs;

    return store.getProcurementByFarmer(farmerId);
  }

  /**
   * Get single procurement by ID.
   */
  async getProcurementById(id: string): Promise<Procurement | null> {
    const proc = await procurementRepository.findById(id);
    if (proc) return proc;
    return store.getProcurementById(id) || null;
  }

  /**
   * Get all procurements, optionally filtered by centre.
   */
  async getAllProcurements(centreId?: string): Promise<Procurement[]> {
    if (centreId) {
      const procs = await procurementRepository.findByCentreId(centreId);
      if (procs.length > 0) return procs;
      return store.getAllProcurements().filter(p => p.centreId === centreId);
    }
    const all = await procurementRepository.getAllProcurements();
    if (all.length > 0) return all;
    return store.getAllProcurements();
  }

  /**
   * Transition procurement lifecycle status with strict state machine validation.
   */
  async transitionStatus(params: {
    procurementId: string;
    targetStatus: ProcurementStatus;
    weighingData?: any;
    qualityData?: any;
    actorName?: string;
  }): Promise<Procurement> {
    const { procurementId, targetStatus, weighingData, qualityData, actorName } = params;

    const proc = await this.getProcurementById(procurementId);
    if (!proc) {
      throw new AppError('Procurement not found', 404);
    }

    // Enforce state machine transitions
    ProcurementStateMachine.validateTransition(proc.status, targetStatus);

    const now = new Date().toISOString();
    const updates: Partial<Procurement> = { status: targetStatus };

    // Record weighing if transition provides weighment data
    if (targetStatus === ProcurementStatus.WEIGHING && weighingData) {
      const netWeight = weighingData.netWeight || Number((weighingData.grossWeight - weighingData.tareWeight).toFixed(2));
      await procurementRepository.saveWeighing({
        procurementId,
        grossWeight: weighingData.grossWeight,
        tareWeight: weighingData.tareWeight,
        netWeight,
        scaleId: weighingData.scaleId,
      });
      updates.weighingAt = now;
      updates.quantity = netWeight;
    }

    // Record quality check if transition provides inspection data
    if (targetStatus === ProcurementStatus.QUALITY_CHECK && qualityData) {
      await procurementRepository.saveQualityCheck({
        procurementId,
        crop: qualityData.crop || proc.crop,
        moistureContent: qualityData.moistureContent,
        foreignMatter: qualityData.foreignMatter || 0,
        damagedGrains: qualityData.damagedGrains || 0,
        grade: qualityData.grade,
        accepted: qualityData.accepted !== false,
        remarks: qualityData.remarks || '',
      });
      updates.qualityCheckAt = now;
    }

    const updated = await procurementRepository.updateProcurement(procurementId, updates);
    await procurementRepository.addTimelineEvent(procurementId, {
      stage: targetStatus,
      label: `Advanced status to ${targetStatus}`,
      actor: actorName || 'Mandi Officer',
    });

    // Keep store in sync for legacy compatibility
    store.updateProcurement(procurementId, updates);

    return updated || proc;
  }

  /**
   * Generate official receipt payload for a procurement lot.
   */
  async getProcurementReceipt(procurementId: string): Promise<any> {
    const proc = await this.getProcurementById(procurementId);
    if (!proc) throw new AppError('Procurement not found', 404);

    const farmer = (await farmerRepository.findById(proc.farmerId)) || store.getFarmerById(proc.farmerId);
    const centre = (await centreRepository.findById(proc.centreId)) || store.getCentreById(proc.centreId);
    const weighing = (await procurementRepository.getWeighingByProcurementId(proc.id)) || store.getWeighingByProcurement(proc.id);
    const quality = (await procurementRepository.getQualityCheckByProcurementId(proc.id)) || store.getQualityCheckByProcurement(proc.id);
    const payment = (await paymentRepository.findByProcurementId(proc.id)) || store.getPaymentByProcurement(proc.id);
    const token = (await tokenRepository.findById(proc.tokenId)) || store.getTokenById(proc.tokenId);

    return {
      receiptNumber: `RCP-${proc.id.toUpperCase()}`,
      issuedAt: proc.completedAt || new Date().toISOString(),
      procurement: proc,
      farmer,
      centre,
      token,
      weighing,
      qualityCheck: quality,
      payment,
    };
  }
}

export const procurementService = new ProcurementService();
export default procurementService;
