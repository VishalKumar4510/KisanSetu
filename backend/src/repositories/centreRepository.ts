import { prisma } from '../lib/prisma';
import { Centre, CongestionLevel } from '../../../shared/types';

export class CentreRepository {
  async findById(id: string): Promise<Centre | null> {
    try {
      const centre = await prisma.centre.findUnique({ where: { id } });
      if (!centre) return null;
      return this.mapToCentre(centre);
    } catch {
      return null;
    }
  }

  async getAllCentres(): Promise<Centre[]> {
    try {
      const centres = await prisma.centre.findMany({ orderBy: { name: 'asc' } });
      return centres.map(c => this.mapToCentre(c));
    } catch {
      return [];
    }
  }

  async updateCentre(id: string, updates: Partial<Centre>): Promise<Centre | null> {
    try {
      const updated = await prisma.centre.update({
        where: { id },
        data: {
          name: updates.name,
          location: updates.location,
          district: updates.district,
          state: updates.state,
          capacity: updates.capacity,
          activeBays: updates.activeBays,
          totalBays: updates.totalBays,
          status: updates.status,
          congestionLevel: updates.congestionLevel as any,
          contactPhone: updates.contactPhone,
          operatingHoursStart: updates.operatingHours?.start,
          operatingHoursEnd: updates.operatingHours?.end,
        },
      });
      return this.mapToCentre(updated);
    } catch {
      return null;
    }
  }

  private mapToCentre(c: any): Centre {
    return {
      id: c.id,
      name: c.name,
      location: c.location,
      district: c.district,
      state: c.state,
      capacity: c.capacity,
      activeBays: c.activeBays,
      totalBays: c.totalBays,
      operatingHours: {
        start: c.operatingHoursStart,
        end: c.operatingHoursEnd,
      },
      status: c.status as 'ACTIVE' | 'INACTIVE',
      congestionLevel: c.congestionLevel as CongestionLevel,
      contactPhone: c.contactPhone,
    };
  }
}

export const centreRepository = new CentreRepository();
export default centreRepository;
