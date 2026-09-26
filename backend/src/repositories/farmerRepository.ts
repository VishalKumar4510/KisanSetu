import { prisma } from '../lib/prisma';
import { Farmer, UserRole, Produce, ProduceType } from '../../../shared/types';

export class FarmerRepository {
  async findById(id: string): Promise<Farmer | null> {
    try {
      const farmer = await prisma.farmer.findFirst({
        where: {
          OR: [{ id }, { userId: id }, { farmerId: id }],
        },
        include: { user: true },
      });
      if (!farmer) return null;
      return this.mapToFarmer(farmer);
    } catch {
      return null;
    }
  }

  async findByFarmerId(farmerId: string): Promise<Farmer | null> {
    try {
      const farmer = await prisma.farmer.findUnique({
        where: { farmerId },
        include: { user: true },
      });
      if (!farmer) return null;
      return this.mapToFarmer(farmer);
    } catch {
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Farmer | null> {
    try {
      const farmer = await prisma.farmer.findUnique({
        where: { userId },
        include: { user: true },
      });
      if (!farmer) return null;
      return this.mapToFarmer(farmer);
    } catch {
      return null;
    }
  }

  async getAllFarmers(): Promise<Farmer[]> {
    try {
      const farmers = await prisma.farmer.findMany({
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      });
      return farmers.map(f => this.mapToFarmer(f));
    } catch {
      return [];
    }
  }

  async countFarmers(): Promise<number> {
    try {
      return await prisma.farmer.count();
    } catch {
      return 0;
    }
  }

  async createFarmer(data: {
    id?: string;
    farmerId: string;
    userId: string;
    village: string;
    district: string;
    state: string;
    landArea: number;
    crops: ProduceType[];
    bankAccount?: string;
    ifsc?: string;
    bankName?: string;
  }): Promise<Farmer> {
    const created = await prisma.farmer.create({
      data: {
        id: data.id,
        farmerId: data.farmerId,
        userId: data.userId,
        village: data.village,
        district: data.district,
        state: data.state,
        landArea: data.landArea,
        crops: data.crops as string[],
        bankAccount: data.bankAccount || null,
        ifsc: data.ifsc || null,
        bankName: data.bankName || null,
      },
      include: { user: true },
    });
    return this.mapToFarmer(created);
  }

  async updateFarmer(id: string, updates: Partial<Farmer>): Promise<Farmer | null> {
    const target = await prisma.farmer.findFirst({
      where: { OR: [{ id }, { userId: id }] },
    });
    if (!target) return null;

    const updated = await prisma.farmer.update({
      where: { id: target.id },
      data: {
        village: updates.village !== undefined ? updates.village : undefined,
        district: updates.district !== undefined ? updates.district : undefined,
        state: updates.state !== undefined ? updates.state : undefined,
        landArea: updates.landArea !== undefined ? updates.landArea : undefined,
        crops: updates.crops !== undefined ? (updates.crops as string[]) : undefined,
        bankAccount: updates.bankAccount !== undefined ? updates.bankAccount : undefined,
        ifsc: updates.ifsc !== undefined ? updates.ifsc : undefined,
        bankName: updates.bankName !== undefined ? updates.bankName : undefined,
        bankVerificationStatus: updates.bankVerificationStatus !== undefined ? updates.bankVerificationStatus : undefined,
      },
      include: { user: true },
    });

    if (updates.name || updates.phone || updates.language) {
      await prisma.user.update({
        where: { id: target.userId },
        data: {
          name: updates.name !== undefined ? updates.name : undefined,
          phone: updates.phone !== undefined ? updates.phone : undefined,
          language: updates.language !== undefined ? updates.language : undefined,
        },
      });
    }

    return this.findById(target.id);
  }

  async getProduceByFarmer(farmerId: string): Promise<Produce[]> {
    const produces = await prisma.produce.findMany({
      where: { farmerId },
    });
    return produces.map(p => ({
      id: p.id,
      farmerId: p.farmerId,
      type: p.type as ProduceType,
      quantity: p.quantity,
      unit: p.unit,
      grade: p.grade || undefined,
      mspRate: p.mspRate,
    }));
  }

  async createProduce(data: {
    id?: string;
    farmerId: string;
    type: ProduceType;
    quantity: number;
    unit?: string;
    grade?: string;
    mspRate: number;
  }): Promise<Produce> {
    const created = await prisma.produce.create({
      data: {
        id: data.id,
        farmerId: data.farmerId,
        type: data.type as any,
        quantity: data.quantity,
        unit: data.unit || 'QUINTAL',
        grade: data.grade || null,
        mspRate: data.mspRate,
      },
    });
    return {
      id: created.id,
      farmerId: created.farmerId,
      type: created.type as ProduceType,
      quantity: created.quantity,
      unit: created.unit,
      grade: created.grade || undefined,
      mspRate: created.mspRate,
    };
  }

  private mapToFarmer(f: any): Farmer {
    return {
      id: f.id,
      farmerId: f.farmerId,
      name: f.user?.name || '',
      phone: f.user?.phone || '',
      password: f.user?.password,
      role: UserRole.FARMER,
      village: f.village,
      district: f.district,
      state: f.state,
      landArea: f.landArea,
      crops: f.crops as ProduceType[],
      language: (f.user?.language || 'hi') as 'en' | 'hi',
      aadhaar: f.user?.aadhaar || undefined,
      bankAccount: f.bankAccount || undefined,
      ifsc: f.ifsc || undefined,
      bankName: f.bankName || undefined,
      bankVerificationStatus: f.bankVerificationStatus,
      createdAt: f.createdAt.toISOString(),
    };
  }
}

export const farmerRepository = new FarmerRepository();
export default farmerRepository;
