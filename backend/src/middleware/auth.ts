import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import store from '../data/store';
import { User, UserRole } from '../../../shared/types';

import logger from '../lib/logger';

const isProduction = process.env.NODE_ENV === 'production';
const envSecret = process.env.JWT_SECRET;

if (isProduction && (!envSecret || envSecret === 'kisansetu-dev-secret' || envSecret.length < 32)) {
  logger.fatal('FATAL CONFIGURATION ERROR: In production mode, JWT_SECRET must be set to a secure string of at least 32 characters.');
  process.exit(1);
}

const JWT_SECRET = envSecret || 'kisansetu-dev-secret-change-in-production';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: UserRole };
    const user = store.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: UserRole };
      req.user = store.getUserById(decoded.userId);
    } catch { /* ignore invalid tokens */ }
  }
  next();
}

export function generateToken(userId: string, role: UserRole): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '24h' });
}
