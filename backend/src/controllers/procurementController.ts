import { Request, Response } from 'express';
import { procurementService } from '../services/procurementService';
import { procurementRepository } from '../repositories/procurementRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import { centreRepository } from '../repositories/centreRepository';
import { tokenRepository } from '../repositories/tokenRepository';
import { farmerRepository } from '../repositories/farmerRepository';
import { prisma } from '../lib/prisma';
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
        const myFarmer = (await farmerRepository.findById(req.user!.id).catch(() => null)) || store.getFarmerById(req.user!.id);
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

    const weighing = (await procurementRepository.getWeighingByProcurementId(procurement.id).catch(() => null)) || store.getWeighingByProcurement(procurement.id);
    const quality = (await procurementRepository.getQualityCheckByProcurementId(procurement.id).catch(() => null)) || store.getQualityCheckByProcurement(procurement.id);
    const payment = (await paymentRepository.findByProcurementId(procurement.id).catch(() => null)) || store.getPaymentByProcurement(procurement.id);
    let produce = null;
    if (procurement.produceId) {
      try {
        const p = await prisma.produce.findUnique({ where: { id: procurement.produceId } });
        if (p) {
          produce = {
            id: p.id,
            farmerId: p.farmerId,
            type: p.type as any,
            quantity: p.quantity,
            unit: p.unit as any,
            mspRate: p.mspRate,
          };
        }
      } catch {}
      if (!produce) produce = store.getProduceById(procurement.produceId);
    }
    const centre = (await centreRepository.findById(procurement.centreId).catch(() => null)) || store.getCentreById(procurement.centreId);
    const token = (await tokenRepository.findById(procurement.tokenId).catch(() => null)) || store.getTokenById(procurement.tokenId);

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
        const myFarmer = (await farmerRepository.findById(req.user!.id).catch(() => null)) || store.getFarmerById(req.user!.id);
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

    const enriched = await Promise.all(procurements.map(async p => {
      const farmer = (await farmerRepository.findById(p.farmerId).catch(() => null)) || store.getFarmerById(p.farmerId);
      let produce = null;
      if (p.produceId) {
        try {
          const prod = await prisma.produce.findUnique({ where: { id: p.produceId } });
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
        if (!produce) produce = store.getProduceById(p.produceId);
      }
      const token = (await tokenRepository.findById(p.tokenId).catch(() => null)) || store.getTokenById(p.tokenId);
      return {
        ...p,
        farmerName: farmer?.name,
        farmerId: farmer?.farmerId,
        produce,
        tokenNumber: token?.tokenNumber,
      };
    }));

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
      const myFarmer = (await farmerRepository.findById(req.user!.id).catch(() => null)) || store.getFarmerById(req.user!.id);
      if (!myFarmer || procurement.farmerId !== myFarmer.farmerId) {
        return res.status(403).json({ success: false, error: 'Forbidden: You cannot access another farmer procurement record' });
      }
    }

    const weighing = (await procurementRepository.getWeighingByProcurementId(procurement.id).catch(() => null)) || store.getWeighingByProcurement(procurement.id);
    const quality = (await procurementRepository.getQualityCheckByProcurementId(procurement.id).catch(() => null)) || store.getQualityCheckByProcurement(procurement.id);
    const payment = (await paymentRepository.findByProcurementId(procurement.id).catch(() => null)) || store.getPaymentByProcurement(procurement.id);

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
