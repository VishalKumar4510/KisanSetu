import { Request, Response } from 'express';
import { officerService } from '../services/officerService';
import { queueService } from '../services/queueService';
import { paymentService } from '../services/paymentService';
import { procurementService } from '../services/procurementService';
import store from '../data/store';

export class OfficerController {
  /**
   * GET /api/officer/stats
   */
  async getStats(req: Request, res: Response): Promise<Response> {
    const { centreId } = req.query;
    const stats = await officerService.getOfficerStats(centreId as string | undefined);
    return res.json({ success: true, data: stats });
  }

  /**
   * GET /api/officer/queue
   */
  async getQueue(req: Request, res: Response): Promise<Response> {
    const { centreId } = req.query;
    const targetCentreId = (centreId as string) || store.getAllCentres()[0]?.id;
    const result = await queueService.getQueueByCentre(targetCentreId);
    return res.json({ success: true, data: result });
  }

  /**
   * GET /api/officer/current-farmer
   */
  async getCurrentFarmer(req: Request, res: Response): Promise<Response> {
    const { centreId } = req.query;
    const result = await officerService.getCurrentFarmerAtDesk(centreId as string | undefined);
    return res.json({ success: true, data: result });
  }

  /**
   * POST /api/officer/queue/pause
   */
  async pauseQueue(req: Request, res: Response): Promise<Response> {
    const { centreId, reason } = req.body;
    const result = await queueService.pauseQueue(centreId, reason, req.user?.name);
    return res.json({ success: true, data: result });
  }

  /**
   * POST /api/officer/queue/resume
   */
  async resumeQueue(req: Request, res: Response): Promise<Response> {
    const { centreId } = req.body;
    const result = await queueService.resumeQueue(centreId, req.user?.name);
    return res.json({ success: true, data: result });
  }

  /**
   * POST /api/officer/call
   */
  async callFarmer(req: Request, res: Response): Promise<Response> {
    const { centreId, tokenId } = req.body;
    const result = await officerService.callFarmer(centreId, tokenId, req.user?.name);
    return res.json({ success: true, data: result });
  }

  /**
   * POST /api/officer/weighment
   */
  async submitWeighment(req: Request, res: Response): Promise<Response> {
    const { procurementId, grossWeight, tareWeight, scaleId } = req.body;
    const result = await officerService.submitWeighment({
      procurementId,
      grossWeight,
      tareWeight,
      scaleId,
      officerName: req.user?.name,
    });
    return res.json({ success: true, data: result });
  }

  /**
   * POST /api/officer/quality
   */
  async submitQuality(req: Request, res: Response): Promise<Response> {
    const {
      procurementId,
      crop,
      moistureContent,
      foreignMatter,
      damagedGrains,
      grade,
      qualityResult,
      remarks,
    } = req.body;

    const result = await officerService.submitQuality({
      procurementId,
      crop,
      moistureContent,
      foreignMatter,
      damagedGrains,
      grade,
      qualityResult,
      remarks,
      officerName: req.user?.name,
    });
    return res.json({ success: true, data: result });
  }

  /**
   * POST /api/officer/calculate
   */
  async calculate(req: Request, res: Response): Promise<Response> {
    const { procurementId } = req.body;
    const result = await officerService.calculateProcurement(procurementId, req.user?.name);
    return res.json({ success: true, data: result });
  }

  /**
   * POST /api/officer/payment/review
   */
  async reviewPayment(req: Request, res: Response): Promise<Response> {
    const { procurementId } = req.body;
    const result = await paymentService.reviewPayment(procurementId);
    return res.json({ success: true, data: result });
  }

  /**
   * POST /api/officer/payment/initiate
   */
  async initiatePayment(req: Request, res: Response): Promise<Response> {
    const { procurementId } = req.body;
    const result = await paymentService.initiatePayment(procurementId, req.user?.name);
    return res.json({ success: true, data: result });
  }

  /**
   * POST /api/officer/payment/process
   */
  async processPayment(req: Request, res: Response): Promise<Response> {
    const { paymentId, simulateFailure } = req.body;
    const result = await paymentService.processPayment({
      paymentId,
      simulateFailure: Boolean(simulateFailure),
      actorName: req.user?.name || 'Mandi Officer',
    });

    if (simulateFailure) {
      return res.status(400).json({
        success: false,
        error: result.payment.failureReason || 'Payment processing failed in banking simulator',
        data: result,
      });
    }

    return res.json({ success: true, data: result });
  }

  /**
   * GET /api/officer/payments
   */
  async getPayments(req: Request, res: Response): Promise<Response> {
    const { centreId } = req.query;
    const payments = await paymentService.getAllPayments(centreId as string | undefined);
    return res.json({ success: true, data: payments.slice(0, 50) });
  }

  /**
   * GET /api/officer/procurement/:id/receipt
   */
  async getReceipt(req: Request, res: Response): Promise<Response> {
    const result = await procurementService.getProcurementReceipt(req.params.id);
    return res.json({ success: true, data: result });
  }

  /**
   * GET /api/officer/farmers/:farmerId/history
   */
  async getFarmerHistory(req: Request, res: Response): Promise<Response> {
    const result = await officerService.getFarmerHistory(req.params.farmerId);
    return res.json({ success: true, data: result });
  }

  /**
   * GET /api/officer/alerts
   */
  async getAlerts(req: Request, res: Response): Promise<Response> {
    const { centreId } = req.query;
    const alerts = await officerService.getAlerts(centreId as string | undefined);
    return res.json({ success: true, data: alerts });
  }

  /**
   * PATCH /api/officer/alerts/:id/read
   */
  async markAlertRead(req: Request, res: Response): Promise<Response> {
    await officerService.markAlertRead(req.params.id);
    return res.json({ success: true, message: 'Alert marked as read' });
  }

  /**
   * GET /api/officer/settlement
   */
  async getDailySettlement(req: Request, res: Response): Promise<Response> {
    const { centreId } = req.query;
    const result = await officerService.getDailySettlement(centreId as string | undefined);
    return res.json({ success: true, data: result });
  }

  /**
   * GET /api/officer/scales
   */
  async getScales(req: Request, res: Response): Promise<Response> {
    const { centreId } = req.query;
    const scales = await officerService.getScales(centreId as string | undefined);
    return res.json({ success: true, data: scales });
  }

  /**
   * PATCH /api/officer/scales/:id
   */
  async updateScale(req: Request, res: Response): Promise<Response> {
    const { status, lastCalibrationDate } = req.body;
    const result = await officerService.updateScale(req.params.id, status, lastCalibrationDate);
    return res.json({ success: true, data: result });
  }
}

export const officerController = new OfficerController();
export default officerController;
