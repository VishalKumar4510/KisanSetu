import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
import { procurementRepository } from '../repositories/procurementRepository';
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
        const myFarmer = store.getFarmerById(req.user!.id);
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
    const produce = proc?.produceId ? store.getProduceById(proc.produceId) : null;

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
        const myFarmer = store.getFarmerById(req.user!.id);
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

    const enriched = payments.map(p => {
      const farmer = store.getFarmerById(p.farmerId);
      const proc = store.getProcurementById(p.procurementId);
      const produce = proc?.produceId ? store.getProduceById(proc.produceId) : null;
      return {
        ...p,
        farmerName: farmer?.name,
        farmerId: farmer?.farmerId,
        produce,
      };
    });

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
}

export const paymentController = new PaymentController();
export default paymentController;
