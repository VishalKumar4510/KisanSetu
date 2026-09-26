import { Router } from 'express';
import bcrypt from 'bcrypt';
import store from '../data/store';
import { userRepository } from '../repositories/userRepository';
import { generateToken, authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { UserRole } from '../../../shared/types';
import { generateId } from '../../../shared/utils';

const router = Router();

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  // Query persistent PostgreSQL user record first, fallback to store
  const user = (await userRepository.findByPhone(phone).catch(() => null)) || store.getUserByPhone(phone);
  if (!user || !user.password) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  // Cryptographic verification using bcrypt
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  const token = generateToken(user.id, user.role);
  const { password: _, ...userWithoutPassword } = user;
  return res.json({ success: true, data: { token, user: userWithoutPassword } });
}));

// POST /api/auth/register
router.post('/register', validateBody(registerSchema), asyncHandler(async (req, res) => {
  const { name, phone, password, role = 'FARMER', language = 'hi' } = req.body;

  const existing = (await userRepository.findByPhone(phone).catch(() => null)) || store.getUserByPhone(phone);
  if (existing) {
    return res.status(409).json({ success: false, error: 'Phone number already registered' });
  }

  // Hash password using bcrypt with cost factor 12
  const hashedPassword = await bcrypt.hash(password, 12);
  const newId = generateId();

  // Persist to PostgreSQL via UserRepository
  const user = await userRepository.createUser({
    id: newId,
    name,
    phone,
    password: hashedPassword,
    role: role as UserRole,
    language: language as 'en' | 'hi',
  }).catch(() => ({
    id: newId,
    name,
    phone,
    password: hashedPassword,
    role: role as UserRole,
    language: language as 'en' | 'hi',
    createdAt: new Date().toISOString(),
  }));

  // Maintain store compatibility
  store.createUser(user);

  const token = generateToken(user.id, user.role);
  const { password: _, ...userWithoutPassword } = user;
  return res.status(201).json({ success: true, data: { token, user: userWithoutPassword } });
}));

// GET /api/auth/me
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user!;
  return res.json({ success: true, data: userWithoutPassword });
}));

export default router;
