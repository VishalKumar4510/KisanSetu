import { prisma } from '../lib/prisma';
import {
  Procurement,
  ProcurementStatus,
  Weighing,
  QualityCheck,
  ProcurementTimelineEvent,
} from '../../../shared/types';

export class ProcurementRepository {
  async findById(id: string): Promise<Procurement | null> {
    try {
      const proc = await prisma.procurement.findUnique({
        where: { id },
        include: { weighing: true, qualityCheck: true },
      });
      if (!proc) return null;
      return this.mapToProcurement(proc);
    } catch {
      return null;
    }
  }

  async findByTokenId(tokenId: string): Promise<Procurement | null> {
    try {
      const proc = await prisma.procurement.findUnique({
        where: { tokenId },
        include: { weighing: true, qualityCheck: true },
      });
      if (!proc) return null;
      return this.mapToProcurement(proc);
    } catch {
      return null;
    }
  }

  async findActiveByFarmerId(farmerId: string): Promise<Procurement | null> {
    try {
      const proc = await prisma.procurement.findFirst({
        where: {
          farmerId,
          status: {
            notIn: ['COMPLETED', 'REJECTED'],
          },
        },
        orderBy: { createdAt: 'desc' },
        include: { weighing: true, qualityCheck: true },
      });
      if (!proc) return null;
      return this.mapToProcurement(proc);
    } catch {
      return null;
    }
  }

  async findByCentreId(centreId: string): Promise<Procurement[]> {
    try {
      const procs = await prisma.procurement.findMany({
        where: { centreId },
        orderBy: { createdAt: 'desc' },
        include: { weighing: true, qualityCheck: true },
      });
      return procs.map(p => this.mapToProcurement(p));
    } catch {
      return [];
    }
  }

  async getAllProcurements(): Promise<Procurement[]> {
    try {
      const procs = await prisma.procurement.findMany({
        orderBy: { createdAt: 'desc' },
        include: { weighing: true, qualityCheck: true },
      });
      return procs.map(p => this.mapToProcurement(p));
    } catch {
      return [];
    }
  }

  async updateProcurement(id: string, updates: Partial<Procurement>): Promise<Procurement | null> {
    try {
      const data: any = {};
      if (updates.status) data.status = updates.status;
      if (updates.calledAt) data.calledAt = new Date(updates.calledAt);
      if (updates.arrivedAt) data.arrivedAt = new Date(updates.arrivedAt);
      if (updates.gateEntryAt) data.gateEntryAt = new Date(updates.gateEntryAt);
      if (updates.weighingAt) data.weighingAt = new Date(updates.weighingAt);
      if (updates.qualityCheckAt) data.qualityCheckAt = new Date(updates.qualityCheckAt);
      if (updates.procurementAt) data.procurementAt = new Date(updates.procurementAt);
      if (updates.paymentPendingAt) data.paymentPendingAt = new Date(updates.paymentPendingAt);
      if (updates.paymentProcessingAt) data.paymentProcessingAt = new Date(updates.paymentProcessingAt);
      if (updates.completedAt) data.completedAt = new Date(updates.completedAt);
      if (updates.rejectedAt) data.rejectedAt = new Date(updates.rejectedAt);
      if (updates.rejectionReason !== undefined) data.rejectionReason = updates.rejectionReason;
      if (updates.scaleId !== undefined) data.scaleId = updates.scaleId;
      if (updates.calculatedBaseRate !== undefined) data.calculatedBaseRate = updates.calculatedBaseRate;
      if (updates.calculatedAdjustment !== undefined) data.calculatedAdjustment = updates.calculatedAdjustment;
      if (updates.calculatedGrossAmount !== undefined) data.calculatedGrossAmount = updates.calculatedGrossAmount;
      if (updates.calculatedDeductions !== undefined) data.calculatedDeductions = updates.calculatedDeductions;
      if (updates.calculatedNetAmount !== undefined) data.calculatedNetAmount = updates.calculatedNetAmount;
      if (updates.timeline !== undefined) data.timeline = updates.timeline;

      const updated = await prisma.procurement.update({
        where: { id },
        data,
        include: { weighing: true, qualityCheck: true },
      });
      return this.mapToProcurement(updated);
    } catch {
      return null;
    }
  }

  async addTimelineEvent(
    procurementId: string,
    event: { stage: string; label: string; timestamp?: string; actor?: string }
  ): Promise<void> {
    const proc = await prisma.procurement.findUnique({ where: { id: procurementId } });
    if (!proc) return;

    const currentTimeline = Array.isArray(proc.timeline) ? (proc.timeline as any[]) : [];
    const newEvent: ProcurementTimelineEvent = {
      stage: event.stage,
      label: event.label,
      timestamp: event.timestamp || new Date().toISOString(),
      actor: event.actor || 'Officer',
    };

    await prisma.procurement.update({
      where: { id: procurementId },
      data: {
        timeline: [...currentTimeline, newEvent],
      },
    });
  }

  async saveWeighing(data: {
    id?: string;
    procurementId: string;
    grossWeight: number;
    tareWeight: number;
    netWeight: number;
    scaleId?: string;
  }): Promise<Weighing> {
    const weighing = await prisma.weighing.upsert({
      where: { procurementId: data.procurementId },
      create: {
        id: data.id || `wgh-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        procurementId: data.procurementId,
        grossWeight: data.grossWeight,
        tareWeight: data.tareWeight,
        netWeight: data.netWeight,
        scaleId: data.scaleId || null,
        timestamp: new Date(),
      },
      update: {
        grossWeight: data.grossWeight,
        tareWeight: data.tareWeight,
        netWeight: data.netWeight,
        scaleId: data.scaleId || null,
        timestamp: new Date(),
      },
    });

    return {
      id: weighing.id,
      procurementId: weighing.procurementId,
      grossWeight: weighing.grossWeight,
      tareWeight: weighing.tareWeight,
      netWeight: weighing.netWeight,
      scaleId: weighing.scaleId || undefined,
      timestamp: weighing.timestamp.toISOString(),
    };
  }

  async getWeighing(procurementId: string): Promise<Weighing | null> {
    const w = await prisma.weighing.findUnique({ where: { procurementId } });
    if (!w) return null;
    return {
      id: w.id,
      procurementId: w.procurementId,
      grossWeight: w.grossWeight,
      tareWeight: w.tareWeight,
      netWeight: w.netWeight,
      scaleId: w.scaleId || undefined,
      timestamp: w.timestamp.toISOString(),
    };
  }

  async saveQualityCheck(data: {
    id?: string;
    procurementId: string;
    crop?: string;
    moistureContent: number;
    foreignMatter: number;
    damagedGrains?: number;
    grade: string;
    qualityResult?: string;
    accepted: boolean;
    remarks?: string;
  }): Promise<QualityCheck> {
    const qc = await prisma.qualityCheck.upsert({
      where: { procurementId: data.procurementId },
      create: {
        id: data.id || `qc-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        procurementId: data.procurementId,
        crop: data.crop || null,
        moistureContent: data.moistureContent,
        foreignMatter: data.foreignMatter,
        damagedGrains: data.damagedGrains || null,
        grade: data.grade,
        qualityResult: data.qualityResult || 'ACCEPTED',
        accepted: data.accepted,
        remarks: data.remarks || '',
        timestamp: new Date(),
      },
      update: {
        crop: data.crop || null,
        moistureContent: data.moistureContent,
        foreignMatter: data.foreignMatter,
        damagedGrains: data.damagedGrains || null,
        grade: data.grade,
        qualityResult: data.qualityResult || 'ACCEPTED',
        accepted: data.accepted,
        remarks: data.remarks || '',
        timestamp: new Date(),
      },
    });

    return {
      id: qc.id,
      procurementId: qc.procurementId,
      crop: qc.crop || undefined,
      moistureContent: qc.moistureContent,
      foreignMatter: qc.foreignMatter,
      damagedGrains: qc.damagedGrains || undefined,
      grade: qc.grade,
      qualityResult: qc.qualityResult as any,
      accepted: qc.accepted,
      remarks: qc.remarks,
      timestamp: qc.timestamp.toISOString(),
    };
  }

  async getQualityCheck(procurementId: string): Promise<QualityCheck | null> {
    const qc = await prisma.qualityCheck.findUnique({ where: { procurementId } });
    if (!qc) return null;
    return {
      id: qc.id,
      procurementId: qc.procurementId,
      crop: qc.crop || undefined,
      moistureContent: qc.moistureContent,
      foreignMatter: qc.foreignMatter,
      damagedGrains: qc.damagedGrains || undefined,
      grade: qc.grade,
      qualityResult: qc.qualityResult as any,
      accepted: qc.accepted,
      remarks: qc.remarks,
      timestamp: qc.timestamp.toISOString(),
    };
  }

  async getWeighingByProcurementId(procurementId: string): Promise<Weighing | null> {
    return this.getWeighing(procurementId);
  }

  async getQualityCheckByProcurementId(procurementId: string): Promise<QualityCheck | null> {
    return this.getQualityCheck(procurementId);
  }

  private mapToProcurement(p: any): Procurement {
    return {
      id: p.id,
      farmerId: p.farmerId,
      centreId: p.centreId,
      tokenId: p.tokenId,
      produceId: p.produceId,
      crop: p.crop || undefined,
      quantity: p.quantity !== null && p.quantity !== undefined ? p.quantity : undefined,
      estimatedQuantity: p.estimatedQuantity !== null && p.estimatedQuantity !== undefined ? p.estimatedQuantity : undefined,
      status: p.status as ProcurementStatus,
      bookedAt: p.bookedAt?.toISOString(),
      calledAt: p.calledAt?.toISOString(),
      arrivedAt: p.arrivedAt?.toISOString(),
      gateEntryAt: p.gateEntryAt?.toISOString(),
      weighingAt: p.weighingAt?.toISOString(),
      qualityCheckAt: p.qualityCheckAt?.toISOString(),
      procurementAt: p.procurementAt?.toISOString(),
      paymentPendingAt: p.paymentPendingAt?.toISOString(),
      paymentProcessingAt: p.paymentProcessingAt?.toISOString(),
      completedAt: p.completedAt?.toISOString(),
      rejectedAt: p.rejectedAt?.toISOString(),
      rejectionReason: p.rejectionReason || undefined,
      scaleId: p.scaleId || undefined,
      calculatedBaseRate: p.calculatedBaseRate || undefined,
      calculatedAdjustment: p.calculatedAdjustment || undefined,
      calculatedGrossAmount: p.calculatedGrossAmount || undefined,
      calculatedDeductions: p.calculatedDeductions || undefined,
      calculatedNetAmount: p.calculatedNetAmount || undefined,
      timeline: Array.isArray(p.timeline) ? (p.timeline as any) : [],
    };
  }
}

export const procurementRepository = new ProcurementRepository();
export default procurementRepository;
