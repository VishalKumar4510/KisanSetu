import { Router } from 'express';
import store from '../data/store';
import { generateToken, authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { UserRole } from '../../../shared/types';
import { generateId } from '../../../shared/utils';

const router = Router();

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ success: false, error: 'Phone and password are required' });
  }
  const user = store.getUserByPhone(phone);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  // MVP: password === phone or password matches stored password
  if (user.password !== password && phone !== password) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  const token = generateToken(user.id, user.role);
  const { password: _, ...userWithoutPassword } = user;
  return res.json({ success: true, data: { token, user: userWithoutPassword } });
}));

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const { name, phone, password, role = 'FARMER', language = 'hi' } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ success: false, error: 'Name, phone, and password are required' });
  }
  const existing = store.getUserByPhone(phone);
  if (existing) {
    return res.status(409).json({ success: false, error: 'Phone number already registered' });
  }
  const user = {
    id: generateId(),
    name,
    phone,
    password,
    role: role as UserRole,
    language: language as 'en' | 'hi',
    createdAt: new Date().toISOString(),
  };
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
