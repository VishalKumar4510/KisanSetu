import { prisma } from '../lib/prisma';
import { Token } from '../../../shared/types';

type TokenStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';

export class TokenRepository {
  async findById(id: string): Promise<Token | null> {
    try {
      const token = await prisma.token.findUnique({ where: { id } });
      if (!token) return null;
      return this.mapToToken(token);
    } catch {
      return null;
    }
  }

  async findByTokenNumber(tokenNumber: string): Promise<Token | null> {
    try {
      const token = await prisma.token.findUnique({ where: { tokenNumber } });
      if (!token) return null;
      return this.mapToToken(token);
    } catch {
      return null;
    }
  }

  async findActiveByFarmerId(farmerId: string): Promise<Token | null> {
    try {
      const token = await prisma.token.findFirst({
        where: {
          farmerId,
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!token) return null;
      return this.mapToToken(token);
    } catch {
      return null;
    }
  }

  async findActiveByCentreId(centreId: string): Promise<Token[]> {
    try {
      const tokens = await prisma.token.findMany({
        where: {
          centreId,
          status: 'ACTIVE',
        },
        orderBy: { queuePosition: 'asc' },
      });
      return tokens.map(t => this.mapToToken(t));
    } catch {
      return [];
    }
  }

  async getAllTokens(): Promise<Token[]> {
    try {
      const tokens = await prisma.token.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return tokens.map(t => this.mapToToken(t));
    } catch {
      return [];
    }
  }

  async updateToken(id: string, updates: Partial<Token>): Promise<Token | null> {
    try {
      const updated = await prisma.token.update({
        where: { id },
        data: {
          status: updates.status ? (updates.status as any) : undefined,
          queuePosition: updates.queuePosition !== undefined ? updates.queuePosition : undefined,
          estimatedTime: updates.estimatedTime !== undefined ? updates.estimatedTime : undefined,
        },
      });
      return this.mapToToken(updated);
    } catch {
      return null;
    }
  }

  async cancelToken(id: string): Promise<Token | null> {
    return prisma.$transaction(async (tx) => {
      const token = await tx.token.findUnique({ where: { id } });
      if (!token) return null;

      // Update token status to CANCELLED
      const updatedToken = await tx.token.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Also update linked procurement if exists
      await tx.procurement.updateMany({
        where: { tokenId: id, status: 'BOOKED' },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: 'Cancelled by farmer',
        },
      });

      // Free slot capacity
      const slot = await tx.slot.findUnique({ where: { id: token.slotId } });
      if (slot && slot.currentBookings > 0) {
        await tx.slot.update({
          where: { id: slot.id },
          data: {
            currentBookings: slot.currentBookings - 1,
            status: 'AVAILABLE',
          },
        });
      }

      return this.mapToToken(updatedToken);
    });
  }

  private mapToToken(t: any): Token {
    return {
      id: t.id,
      farmerId: t.farmerId,
      slotId: t.slotId,
      centreId: t.centreId,
      tokenNumber: t.tokenNumber,
      qrData: t.qrData,
      status: t.status as TokenStatus,
      queuePosition: t.queuePosition,
      estimatedTime: t.estimatedTime,
      createdAt: t.createdAt.toISOString(),
    };
  }
}

export const tokenRepository = new TokenRepository();
export default tokenRepository;
