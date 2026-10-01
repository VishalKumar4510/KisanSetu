import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
import { procurementRepository } from '../repositories/procurementRepository';
import { farmerRepository } from '../repositories/farmerRepository';
import { prisma } from '../lib/prisma';
import { UserRole } from '../../../shared/types';
import store from '../data/store';

export class PaymentController {
  /**
   * GET /api/payments/current
   */
  async getCurrent(req: Request, res: Response): Promise<Response> {
    const queryFarmerId = req.query.farmerId as string | undefined;

    // BOLA/IDOR Defense: Farmers can only query their own payments
    if (req.user!.role === UserRole.FARMER) {
      if (queryFarmerId) {
        const myFarmer = (await farmerRepository.findById(req.user!.id).catch(() => null)) || store.getFarmerById(req.user!.id);
        const isSelf = queryFarmerId === req.user!.id || (myFarmer && queryFarmerId === myFarmer.farmerId);
        if (!isSelf) {
          return res.status(403).json({ success: false, error: 'Forbidden: You cannot access another farmer payment records' });
        }
      }
    }

    const targetFarmerId = queryFarmerId || req.user!.id;
    const payment = await paymentService.getCurrentPayment(targetFarmerId);
    if (!payment) return res.json({ success: true, data: null });

    const proc = (await procurementRepository.findById(payment.procurementId)) || store.getProcurementById(payment.procurementId);
    let produce = null;
    if (proc?.produceId) {
      try {
        const prod = await prisma.produce.findUnique({ where: { id: proc.produceId } });
        if (prod) {
          produce = {
            id: prod.id,
            farmerId: prod.farmerId,
            type: prod.type as any,
            quantity: prod.quantity,
            unit: prod.unit as any,
            mspRate: prod.mspRate,
          };
        }
      } catch {}
      if (!produce) produce = store.getProduceById(proc.produceId);
    }

    return res.json({
      success: true,
      data: {
        ...payment,
        produce,
        procurementStatus: proc?.status,
      },
    });
  }

  /**
   * GET /api/payments/history
   */
  async getHistory(req: Request, res: Response): Promise<Response> {
    const queryFarmerId = req.query.farmerId as string | undefined;

    // BOLA/IDOR Defense: Farmers can only query their own payment history
    if (req.user!.role === UserRole.FARMER) {
      if (queryFarmerId) {
        const myFarmer = (await farmerRepository.findById(req.user!.id).catch(() => null)) || store.getFarmerById(req.user!.id);
        const isSelf = queryFarmerId === req.user!.id || (myFarmer && queryFarmerId === myFarmer.farmerId);
        if (!isSelf) {
          return res.status(403).json({ success: false, error: 'Forbidden: You cannot access another farmer payment history' });
        }
      }
    }

    const targetFarmerId = queryFarmerId || req.user!.id;
    const payments = await paymentService.getPaymentHistory(targetFarmerId);
    return res.json({ success: true, data: payments });
  }

  /**
   * GET /api/payments
   */
  async getAll(req: Request, res: Response): Promise<Response> {
    const { status, centreId } = req.query;
    let payments = await paymentService.getAllPayments(centreId as string | undefined);
    if (status) {
      payments = payments.filter(p => p.status === status);
    }

    const enriched = await Promise.all(payments.map(async p => {
      const farmer = (await farmerRepository.findById(p.farmerId).catch(() => null)) || store.getFarmerById(p.farmerId);
      const proc = (await procurementRepository.findById(p.procurementId).catch(() => null)) || store.getProcurementById(p.procurementId);
      let produce = null;
      if (proc?.produceId) {
        try {
          const prod = await prisma.produce.findUnique({ where: { id: proc.produceId } });
          if (prod) {
            produce = {
              id: prod.id,
              farmerId: prod.farmerId,
              type: prod.type as any,
              quantity: prod.quantity,
              unit: prod.unit as any,
              mspRate: prod.mspRate,
            };
          }
        } catch {}
        if (!produce) produce = store.getProduceById(proc.produceId);
      }
      return {
        ...p,
        farmerName: farmer?.name,
        farmerId: farmer?.farmerId,
        produce,
      };
    }));

    return res.json({ success: true, data: enriched });
  }

  /**
   * PUT /api/payments/:id/process (Admin settlement)
   */
  async processPayment(req: Request, res: Response): Promise<Response> {
    const result = await paymentService.processPayment({
      paymentId: req.params.id,
      simulateFailure: false,
      actorName: req.user?.name || 'Mandi Admin',
    });

    return res.json({
      success: true,
      data: result.payment,
    });
  }

  /**
   * POST /api/payments/webhook (Provider Webhook Callback)
   * Authenticated via cryptographic HMAC signature header.
   */
  async handleWebhook(req: Request, res: Response): Promise<Response> {
    const signature = (req.headers['x-webhook-signature'] ||
      req.headers['x-signature'] ||
      req.headers['x-pfms-signature'] ||
      req.query.signature) as string | undefined;

    const providerName = (req.headers['x-provider-name'] || req.query.provider) as string | undefined;

    const result = await paymentService.handleWebhook({
      rawBody: req.body,
      signature,
      headers: req.headers,
      providerName,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  /**
   * GET /api/payments/:id/receipt
   */
  async getReceipt(req: Request, res: Response): Promise<Response> {
    const receipt = await paymentService.getReceipt(req.params.id);
    return res.json({
      success: true,
      data: receipt,
    });
  }

  /**
   * GET /api/payments/:id/transactions (Audit Trail & Ledger)
   */
  async getTransactionHistory(req: Request, res: Response): Promise<Response> {
    const history = await paymentService.getTransactionHistory(req.params.id);
    return res.json({
      success: true,
      data: history,
    });
  }

  /**
   * POST /api/payments/:id/reverse (Administrative Reversal)
   */
  async reversePayment(req: Request, res: Response): Promise<Response> {
    const { reason } = req.body;
    const result = await paymentService.reversePayment({
      paymentId: req.params.id,
      reason: reason || 'Administrative reversal',
      actorName: req.user?.name || 'Mandi Admin',
    });

    return res.json({
      success: true,
      data: result,
    });
  }
}

export const paymentController = new PaymentController();
export default paymentController;
