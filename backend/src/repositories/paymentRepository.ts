import { prisma } from '../lib/prisma';
import store from '../data/store';
import { Payment, PaymentStatus, ProcurementStatus } from '../../../shared/types';
import { AppError } from '../middleware/errorHandler';

export class PaymentRepository {
  async findById(id: string): Promise<Payment | null> {
    try {
      const pay = await prisma.payment.findUnique({ where: { id } });
      if (!pay) return null;
      return this.mapToPayment(pay);
    } catch {
      return null;
    }
  }

  async findByProcurementId(procurementId: string): Promise<Payment | null> {
    try {
      const pay = await prisma.payment.findUnique({ where: { procurementId } });
      if (!pay) return null;
      return this.mapToPayment(pay);
    } catch {
      return null;
    }
  }

  async findByFarmerId(farmerId: string): Promise<Payment[]> {
    try {
      const payments = await prisma.payment.findMany({
        where: { farmerId },
        orderBy: { createdAt: 'desc' },
      });
      return payments.map(p => this.mapToPayment(p));
    } catch {
      return [];
    }
  }

  async getAllPayments(): Promise<Payment[]> {
    try {
      const payments = await prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return payments.map(p => this.mapToPayment(p));
    } catch {
      return [];
    }
  }

  async createPayment(data: {
    id?: string;
    procurementId: string;
    farmerId: string;
    bookingId?: string;
    grossAmount: number;
    deductions: number;
    netAmount: number;
    status?: PaymentStatus;
    paymentMethod?: string;
    transactionId?: string;
    utr?: string;
    dbtReferenceId?: string;
    failureReason?: string;
  }): Promise<Payment> {
    const created = await prisma.payment.create({
      data: {
        id: data.id || `pay-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        procurementId: data.procurementId,
        farmerId: data.farmerId,
        bookingId: data.bookingId || null,
        grossAmount: data.grossAmount,
        deductions: data.deductions,
        netAmount: data.netAmount,
        status: (data.status || 'PENDING') as any,
        paymentMethod: data.paymentMethod || 'DBT (Direct Benefit Transfer)',
        transactionId: data.transactionId || null,
        utr: data.utr || null,
        dbtReferenceId: data.dbtReferenceId || null,
        failureReason: data.failureReason || null,
      },
    });
    return this.mapToPayment(created);
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | null> {
    const data: any = {};
    if (updates.status) data.status = updates.status;
    if (updates.grossAmount !== undefined) data.grossAmount = updates.grossAmount;
    if (updates.deductions !== undefined) data.deductions = updates.deductions;
    if (updates.netAmount !== undefined) data.netAmount = updates.netAmount;
    if (updates.paymentMethod !== undefined) data.paymentMethod = updates.paymentMethod;
    if (updates.transactionId !== undefined) data.transactionId = updates.transactionId;
    if (updates.utr !== undefined) data.utr = updates.utr;
    if (updates.dbtReferenceId !== undefined) data.dbtReferenceId = updates.dbtReferenceId;
    if (updates.failureReason !== undefined) data.failureReason = updates.failureReason;
    if (updates.initiatedAt) data.initiatedAt = new Date(updates.initiatedAt);
    if (updates.completedAt) data.completedAt = new Date(updates.completedAt);
    if (updates.processedAt) data.processedAt = new Date(updates.processedAt);

    const updated = await prisma.payment.update({
      where: { id },
      data,
    });
    return this.mapToPayment(updated);
  }

  /**
   * Atomic PostgreSQL Transaction for DBT Payment Completion
   * Guarantees that Payment, Procurement, Token, and Timeline updates
   * are committed atomically or rolled back, preventing orphaned or contradictory state.
   */
  async completePaymentAtomic(params: {
    paymentId: string;
    utr: string;
    dbtReferenceId: string;
    actorName?: string;
  }): Promise<{ payment: Payment; procurementId: string }> {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id: params.paymentId } });
      if (!payment) throw new AppError('Payment not found', 404);

      if (payment.status === 'COMPLETED') {
        const storePayment = store.getPaymentById(params.paymentId);
        if (!storePayment || storePayment.status === 'COMPLETED') {
          throw new AppError('Cannot re-process an already completed payment', 409);
        }
      }

      const now = new Date();

      // 1. Update Payment
      const updatedPayment = await tx.payment.update({
        where: { id: params.paymentId },
        data: {
          status: 'COMPLETED',
          utr: params.utr,
          dbtReferenceId: params.dbtReferenceId,
          completedAt: now,
          processedAt: now,
          failureReason: null,
        },
      });

      // 2. Update Procurement
      const proc = await tx.procurement.findUnique({ where: { id: payment.procurementId } });
      if (proc) {
        const currentTimeline = Array.isArray(proc.timeline) ? (proc.timeline as any[]) : [];
        const newEvent = {
          stage: 'COMPLETED',
          label: `Payment Settled via DBT. UTR: ${params.utr} | Reference: ${params.dbtReferenceId}`,
          timestamp: now.toISOString(),
          actor: params.actorName || 'System',
        };

        await tx.procurement.update({
          where: { id: proc.id },
          data: {
            status: 'COMPLETED',
            completedAt: now,
            timeline: [...currentTimeline, newEvent],
          },
        });

        // 3. Mark Token as USED
        if (proc.tokenId) {
          await tx.token.update({
            where: { id: proc.tokenId },
            data: { status: 'USED' },
          });
        }
      }

      return {
        payment: this.mapToPayment(updatedPayment),
        procurementId: payment.procurementId,
      };
    });
  }

  private mapToPayment(p: any): Payment {
    return {
      id: p.id,
      procurementId: p.procurementId,
      farmerId: p.farmerId,
      bookingId: p.bookingId || undefined,
      grossAmount: p.grossAmount,
      deductions: p.deductions,
      netAmount: p.netAmount,
      status: p.status as PaymentStatus,
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId || undefined,
      utr: p.utr || undefined,
      dbtReferenceId: p.dbtReferenceId || undefined,
      initiatedAt: p.initiatedAt?.toISOString(),
      completedAt: p.completedAt?.toISOString(),
      processedAt: p.processedAt?.toISOString(),
      failureReason: p.failureReason || undefined,
      createdAt: p.createdAt.toISOString(),
    };
  }
}

export const paymentRepository = new PaymentRepository();
export default paymentRepository;
