import { Request, Response } from 'express';
import { queueService } from '../services/queueService';
import { UserRole } from '../../../shared/types';
import store from '../data/store';

export class QueueController {
  /**
   * GET /api/queue/centre/:centreId
   */
  async getQueueByCentre(req: Request, res: Response): Promise<Response> {
    const { centreId } = req.params;
    const result = await queueService.getQueueByCentre(centreId);
    return res.json({ success: true, data: result });
  }

  /**
   * GET /api/queue/position
   */
  async getQueuePosition(req: Request, res: Response): Promise<Response> {
    const queryFarmerId = req.query.farmerId as string | undefined;

    // BOLA/IDOR Defense: Farmers can only query their own queue position
    if (req.user!.role === UserRole.FARMER) {
      if (queryFarmerId) {
        const myFarmer = store.getFarmerById(req.user!.id);
        const isSelf = queryFarmerId === req.user!.id || (myFarmer && queryFarmerId === myFarmer.farmerId);
        if (!isSelf) {
          return res.status(403).json({ success: false, error: 'Forbidden: You cannot access another farmer queue position' });
        }
      }
    }

    const targetFarmerId = queryFarmerId || req.user!.id;
    const result = await queueService.getFarmerQueuePosition(targetFarmerId);
    return res.json({ success: true, data: result });
  }

  /**
   * POST /api/queue/pause
   */
  async pauseQueue(req: Request, res: Response): Promise<Response> {
    const { centreId, reason } = req.body;
    const result = await queueService.pauseQueue(centreId, reason, req.user?.name);
    return res.json({ success: true, data: result });
  }

  /**
   * POST /api/queue/resume
   */
  async resumeQueue(req: Request, res: Response): Promise<Response> {
    const { centreId } = req.body;
    const result = await queueService.resumeQueue(centreId, req.user?.name);
    return res.json({ success: true, data: result });
  }

  /**
   * POST /api/queue/next
   */
  async callNext(req: Request, res: Response): Promise<Response> {
    const { centreId } = req.body;
    const result = await queueService.callNext(centreId);
    if (!result) {
      return res.json({ success: true, data: null, message: 'Queue is empty' });
    }
    return res.json({ success: true, data: result });
  }
}

export const queueController = new QueueController();
export default queueController;
