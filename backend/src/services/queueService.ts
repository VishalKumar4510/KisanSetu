import { tokenRepository } from '../repositories/tokenRepository';
import { farmerRepository } from '../repositories/farmerRepository';
import { centreRepository } from '../repositories/centreRepository';
import { procurementRepository } from '../repositories/procurementRepository';
import store from '../data/store';
import { AppError } from '../middleware/errorHandler';

export class QueueService {
  /**
   * Get live FIFO queue for a specific Mandi centre.
   */
  async getQueueByCentre(centreId: string): Promise<any[]> {
    const centre = (await centreRepository.findById(centreId)) || store.getCentreById(centreId);
    if (!centre) {
      throw new AppError('Centre not found', 404);
    }

    const activeTokens = await tokenRepository.findActiveByCentreId(centreId);
    const tokensList = activeTokens.length > 0 ? activeTokens : store.getQueueByCentre(centreId);

    const enriched = [];
    for (const token of tokensList) {
      const farmer = (await farmerRepository.findById(token.farmerId)) || store.getFarmerById(token.farmerId);
      const procurement =
        (await procurementRepository.findByTokenId(token.id)) ||
        store.getProcurementByFarmer(token.farmerId).find(p => p.tokenId === token.id);
      const produce = procurement?.produceId ? store.getProduceById(procurement.produceId) : null;

      enriched.push({
        ...token,
        farmerName: farmer?.name || 'Unknown',
        farmerId: farmer?.farmerId || '',
        produce: produce?.type || '',
        quantity: produce ? `${produce.quantity} ${produce.unit}` : '',
        procurementStatus: procurement?.status || '',
      });
    }

    return enriched;
  }

  /**
   * Get farmer queue position, ETA, and active token.
   */
  async getFarmerQueuePosition(farmerId: string): Promise<any | null> {
    const farmer =
      (await farmerRepository.findById(farmerId)) ||
      (await farmerRepository.findByFarmerId(farmerId)) ||
      store.getFarmerById(farmerId) ||
      store.getFarmerByFarmerId(farmerId);
    const targetFarmerId = farmer?.id || farmerId;

    const activeToken =
      (await tokenRepository.findActiveByFarmerId(targetFarmerId)) ||
      store.getActiveTokenByFarmer(targetFarmerId);
    if (!activeToken) {
      return null;
    }

    const centre =
      (await centreRepository.findById(activeToken.centreId)) || store.getCentreById(activeToken.centreId);
    const activeTokensInCentre = await tokenRepository.findActiveByCentreId(activeToken.centreId);
    const queue = activeTokensInCentre.length > 0 ? activeTokensInCentre : store.getQueueByCentre(activeToken.centreId);

    const pos = queue.findIndex(t => t.id === activeToken.id) + 1;
    const position = pos > 0 ? pos : activeToken.queuePosition || 1;
    const etaMinutes = Math.round((position * 15) / Math.max(centre?.activeBays || 1, 1));

    return {
      position,
      totalInQueue: queue.length,
      estimatedTime: `${etaMinutes}`,
      centreId: activeToken.centreId,
      centreName: centre?.name || '',
      tokenNumber: activeToken.tokenNumber,
      tokenId: activeToken.id,
    };
  }

  /**
   * Pause queue operations at a centre.
   */
  async pauseQueue(
    centreId: string,
    reason?: string,
    officerName?: string
  ): Promise<{ centreId: string; isPaused: boolean; reason?: string }> {
    const centre = (await centreRepository.findById(centreId)) || store.getCentreById(centreId);
    if (!centre) throw new AppError('Centre not found', 404);

    store.setQueuePaused(centreId, true);
    return {
      centreId,
      isPaused: true,
      reason: reason || 'Queue paused by Mandi Officer',
    };
  }

  /**
   * Resume queue operations at a centre.
   */
  async resumeQueue(
    centreId: string,
    officerName?: string
  ): Promise<{ centreId: string; isPaused: boolean }> {
    const centre = (await centreRepository.findById(centreId)) || store.getCentreById(centreId);
    if (!centre) throw new AppError('Centre not found', 404);

    store.setQueuePaused(centreId, false);
    return {
      centreId,
      isPaused: false,
    };
  }

  /**
   * Call next token in queue for officer console.
   */
  async callNext(centreId: string): Promise<any | null> {
    const queue = store.getQueueByCentre(centreId);
    if (queue.length === 0) return null;
    const nextToken = queue[0];
    store.updateToken(nextToken.id, { status: 'USED' });
    queue.slice(1).forEach((t, i) => store.updateToken(t.id, { queuePosition: i + 1 }));
    const farmer = (await farmerRepository.findById(nextToken.farmerId)) || store.getFarmerById(nextToken.farmerId);
    return { token: nextToken, farmerName: farmer?.name };
  }
}

export const queueService = new QueueService();
export default queueService;
