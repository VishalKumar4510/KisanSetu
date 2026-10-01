import { prisma } from '../lib/prisma';
import { Slot, Token, Procurement, ProduceType, ProcurementStatus } from '../../../shared/types';
import { AppError } from '../middleware/errorHandler';

type TokenStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';

export class SlotRepository {
  async findById(id: string): Promise<Slot | null> {
    try {
      const slot = await prisma.slot.findUnique({ where: { id } });
      if (!slot) return null;
      return this.mapToSlot(slot);
    } catch {
      return null;
    }
  }

  async findByCentreAndDate(centreId: string, date: string): Promise<Slot[]> {
    try {
      const slots = await prisma.slot.findMany({
        where: { centreId, date },
        orderBy: { timeStart: 'asc' },
      });
      return slots.map(s => this.mapToSlot(s));
    } catch {
      return [];
    }
  }

  async getAvailableSlots(centreId?: string, date?: string): Promise<Slot[]> {
    try {
      const where: any = {
        status: 'AVAILABLE',
      };
      if (centreId) where.centreId = centreId;
      if (date) where.date = date;
      const slots = await prisma.slot.findMany({
        where,
        orderBy: [{ date: 'asc' }, { timeStart: 'asc' }],
      });
      return slots.map(s => this.mapToSlot(s));
    } catch {
      return [];
    }
  }

  async getAllSlots(): Promise<Slot[]> {
    try {
      const slots = await prisma.slot.findMany({
        orderBy: [{ date: 'asc' }, { timeStart: 'asc' }],
      });
      return slots.map(s => this.mapToSlot(s));
    } catch {
      return [];
    }
  }

  async updateSlot(id: string, updates: Partial<Slot>): Promise<Slot | null> {
    try {
      const updated = await prisma.slot.update({
        where: { id },
        data: {
          maxCapacity: updates.maxCapacity,
          currentBookings: updates.currentBookings,
          status: updates.status,
        },
      });
      return this.mapToSlot(updated);
    } catch {
      return null;
    }
  }

  /**
   * Atomic PostgreSQL Transaction for Slot Booking
   * Atomically verifies capacity & duplicate active tokens, increments slot,
   * generates digital token, and creates procurement in one all-or-nothing unit.
   */
  async bookSlotAtomic(params: {
    slotId: string;
    farmerId: string;
    centreId: string;
    produceId?: string;
    crop?: ProduceType;
    estimatedQuantity?: number;
  }): Promise<{ token: Token; procurement: Procurement; slot: Slot }> {
    return prisma.$transaction(async (tx) => {
      // 1. Check if farmer already has an ACTIVE token
      const existingToken = await tx.token.findFirst({
        where: {
          farmerId: params.farmerId,
          status: 'ACTIVE',
        },
      });
      if (existingToken) {
        throw new AppError('Farmer already has an active token. Cancel or complete it before booking another.', 409);
      }

      // 2. Fetch slot with capacity check
      const slot = await tx.slot.findUnique({
        where: { id: params.slotId },
      });
      if (!slot) {
        throw new AppError('Slot not found', 404);
      }
      if (slot.status === 'FULL' || slot.currentBookings >= slot.maxCapacity) {
        throw new AppError('Slot capacity is fully booked', 409);
      }

      // 3. Atomically increment slot bookings and update status if full
      const newBookings = slot.currentBookings + 1;
      const isFull = newBookings >= slot.maxCapacity;
      const updatedSlot = await tx.slot.update({
        where: { id: slot.id },
        data: {
          currentBookings: newBookings,
          status: isFull ? 'FULL' : slot.status,
        },
      });

      const count = await tx.token.count({ where: { centreId: params.centreId } });
      const year = new Date().getFullYear();
      let tokenNumber = `T-${year}-${String(count + 1).padStart(4, '0')}`;
      const tokenByNumber = await tx.token.findUnique({ where: { tokenNumber } });
      if (tokenByNumber) {
        tokenNumber = `T-${year}-${String(count + 1).padStart(4, '0')}-${Math.floor(100 + Math.random() * 900)}`;
      }
      const tokenId = `token-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const qrData = JSON.stringify({
        tokenId,
        tokenNumber,
        farmerId: params.farmerId,
        centreId: params.centreId,
        slotId: params.slotId,
      });

      const queuePosition = (await tx.token.count({
        where: { centreId: params.centreId, status: 'ACTIVE' },
      })) + 1;

      const createdToken = await tx.token.create({
        data: {
          id: tokenId,
          farmerId: params.farmerId,
          slotId: params.slotId,
          centreId: params.centreId,
          tokenNumber,
          qrData,
          status: 'ACTIVE',
          queuePosition,
          estimatedTime: `${queuePosition * 12} mins`,
        },
      });

      // 5. Ensure Produce exists or link existing
      let produceId = params.produceId;
      if (!produceId) {
        const farmerProduces = await tx.produce.findMany({ where: { farmerId: params.farmerId } });
        if (farmerProduces.length > 0) {
          produceId = farmerProduces[0].id;
        } else {
          const newProduce = await tx.produce.create({
            data: {
              id: `prod-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
              farmerId: params.farmerId,
              type: (params.crop || 'WHEAT') as any,
              quantity: params.estimatedQuantity || 50,
              unit: 'QUINTAL',
              mspRate: 2275,
            },
          });
          produceId = newProduce.id;
        }
      }

      // 6. Create Procurement in BOOKED status
      const procId = `proc-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const now = new Date();
      const createdProcurement = await tx.procurement.create({
        data: {
          id: procId,
          farmerId: params.farmerId,
          centreId: params.centreId,
          tokenId: createdToken.id,
          produceId,
          status: 'BOOKED',
          bookedAt: now,
          timeline: [
            {
              stage: 'BOOKED',
              label: `Slot Booked for ${slot.date} (${slot.timeStart} - ${slot.timeEnd})`,
              timestamp: now.toISOString(),
              actor: 'Farmer',
            },
          ],
        },
      });

      return {
        token: {
          id: createdToken.id,
          farmerId: createdToken.farmerId,
          slotId: createdToken.slotId,
          centreId: createdToken.centreId,
          tokenNumber: createdToken.tokenNumber,
          qrData: createdToken.qrData,
          status: createdToken.status as TokenStatus,
          queuePosition: createdToken.queuePosition,
          estimatedTime: createdToken.estimatedTime,
          createdAt: createdToken.createdAt.toISOString(),
        },
        procurement: {
          id: createdProcurement.id,
          farmerId: createdProcurement.farmerId,
          centreId: createdProcurement.centreId,
          tokenId: createdProcurement.tokenId,
          produceId: createdProcurement.produceId,
          status: createdProcurement.status as ProcurementStatus,
          bookedAt: createdProcurement.bookedAt.toISOString(),
          timeline: (createdProcurement.timeline as any) || [],
        },
        slot: this.mapToSlot(updatedSlot),
      };
    });
  }

  private mapToSlot(s: any): Slot {
    return {
      id: s.id,
      centreId: s.centreId,
      date: s.date,
      timeStart: s.timeStart,
      timeEnd: s.timeEnd,
      maxCapacity: s.maxCapacity,
      currentBookings: s.currentBookings,
      status: s.status as 'AVAILABLE' | 'FULL' | 'CLOSED',
    };
  }
}

export const slotRepository = new SlotRepository();
export default slotRepository;
