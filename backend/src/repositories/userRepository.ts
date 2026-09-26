import { prisma } from '../lib/prisma';
import { User, UserRole } from '../../../shared/types';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      password: user.password,
      role: user.role as UserRole,
      aadhaar: user.aadhaar || undefined,
      language: user.language as 'en' | 'hi',
      createdAt: user.createdAt.toISOString(),
    };
  }

  async findByPhone(phone: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      password: user.password,
      role: user.role as UserRole,
      aadhaar: user.aadhaar || undefined,
      language: user.language as 'en' | 'hi',
      createdAt: user.createdAt.toISOString(),
    };
  }

  async createUser(data: {
    id?: string;
    name: string;
    phone: string;
    password: string;
    role?: UserRole;
    aadhaar?: string;
    language?: 'en' | 'hi';
  }): Promise<User> {
    const created = await prisma.user.create({
      data: {
        id: data.id,
        name: data.name,
        phone: data.phone,
        password: data.password,
        role: (data.role || UserRole.FARMER) as any,
        aadhaar: data.aadhaar || null,
        language: data.language || 'en',
      },
    });

    return {
      id: created.id,
      name: created.name,
      phone: created.phone,
      password: created.password,
      role: created.role as UserRole,
      aadhaar: created.aadhaar || undefined,
      language: created.language as 'en' | 'hi',
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getAllUsers(): Promise<User[]> {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return users.map(u => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      password: u.password,
      role: u.role as UserRole,
      aadhaar: u.aadhaar || undefined,
      language: u.language as 'en' | 'hi',
      createdAt: u.createdAt.toISOString(),
    }));
  }
}

export const userRepository = new UserRepository();
export default userRepository;
