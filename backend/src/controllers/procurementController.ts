import { Request, Response } from 'express';
import { procurementService } from '../services/procurementService';
import { UserRole } from '../../../shared/types';
import store from '../data/store';

export class ProcurementController {
  /**
   * GET /api/procurement/current
   */
  async getCurrent(req: Request, res: Response): Promise<Response> {
    const queryFarmerId = req.query.farmerId as string | undefined;

    // BOLA/IDOR Defense: Farmers can only query their own procurement
    if (req.user!.role === UserRole.FARMER) {
      if (queryFarmerId) {
        const myFarmer = store.getFarmerById(req.user!.id);
        const isSelf = queryFarmerId === req.user!.id || (myFarmer && queryFarmerId === myFarmer.farmerId);
        if (!isSelf) {
          return res.status(403).json({ success: false, error: 'Forbidden: You cannot access another farmer procurement' });
        }
      }
    }

    const targetFarmerId = queryFarmerId || req.user!.id;
    const procurement = await procurementService.getCurrentProcurement(targetFarmerId);

    if (!procurement) {
      return res.json({ success: true, data: null });
    }

    const weighing = store.getWeighingByProcurement(procurement.id);
    const quality = store.getQualityCheckByProcurement(procurement.id);
    const payment = store.getPaymentByProcurement(procurement.id);
    const produce = procurement.produceId ? store.getProduceById(procurement.produceId) : null;
    const centre = store.getCentreById(procurement.centreId);
    const token = store.getTokenById(procurement.tokenId);

    return res.json({
      success: true,
      data: {
        ...procurement,
        produce,
        weighing,
        qualityCheck: quality,
        payment,
        centreName: centre?.name,
        tokenNumber: token?.tokenNumber,
      },
    });
  }

  /**
   * GET /api/procurement/history
   */
  async getHistory(req: Request, res: Response): Promise<Response> {
    const queryFarmerId = req.query.farmerId as string | undefined;

    // BOLA/IDOR Defense: Farmers can only query their own history
    if (req.user!.role === UserRole.FARMER) {
      if (queryFarmerId) {
        const myFarmer = store.getFarmerById(req.user!.id);
        const isSelf = queryFarmerId === req.user!.id || (myFarmer && queryFarmerId === myFarmer.farmerId);
        if (!isSelf) {
          return res.status(403).json({ success: false, error: 'Forbidden: You cannot access another farmer procurement history' });
        }
      }
    }

    const targetFarmerId = queryFarmerId || req.user!.id;
    const history = await procurementService.getProcurementHistory(targetFarmerId);
    return res.json({ success: true, data: history });
  }

  /**
   * GET /api/procurement
   */
  async getAll(req: Request, res: Response): Promise<Response> {
    const { status, centreId } = req.query;
    let procurements = await procurementService.getAllProcurements(centreId as string | undefined);
    if (status) {
      procurements = procurements.filter(p => p.status === status);
    }

    const enriched = procurements.map(p => {
      const farmer = store.getFarmerById(p.farmerId);
      const produce = p.produceId ? store.getProduceById(p.produceId) : null;
      const token = store.getTokenById(p.tokenId);
      return {
        ...p,
        farmerName: farmer?.name,
        farmerId: farmer?.farmerId,
        produce,
        tokenNumber: token?.tokenNumber,
      };
    });

    return res.json({ success: true, data: enriched });
  }

  /**
   * GET /api/procurement/:id
   */
  async getById(req: Request, res: Response): Promise<Response> {
    const procurement = await procurementService.getProcurementById(req.params.id);
    if (!procurement) {
      return res.status(404).json({ success: false, error: 'Procurement not found' });
    }

    // BOLA Defense: Farmers can only access their own procurement
    if (req.user!.role === UserRole.FARMER && procurement.farmerId !== req.user!.id) {
      const myFarmer = store.getFarmerById(req.user!.id);
      if (!myFarmer || procurement.farmerId !== myFarmer.farmerId) {
        return res.status(403).json({ success: false, error: 'Forbidden: You cannot access another farmer procurement record' });
      }
    }

    const weighing = store.getWeighingByProcurement(procurement.id);
    const quality = store.getQualityCheckByProcurement(procurement.id);
    const payment = store.getPaymentByProcurement(procurement.id);

    return res.json({
      success: true,
      data: {
        procurement,
        weighing,
        qualityCheck: quality,
        payment,
      },
    });
  }

  /**
   * PUT /api/procurement/:id/status
   */
  async updateStatus(req: Request, res: Response): Promise<Response> {
    const { status, weighingData, qualityData } = req.body;
    const updated = await procurementService.transitionStatus({
      procurementId: req.params.id,
      targetStatus: status,
      weighingData,
      qualityData,
      actorName: req.user?.name,
    });

    return res.json({ success: true, data: updated });
  }
}

export const procurementController = new ProcurementController();
export default procurementController;
