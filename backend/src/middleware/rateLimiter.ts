import rateLimit from 'express-rate-limit';
import config from '../lib/config';

const isTest = process.env.NODE_ENV === 'test';

/**
 * Rate limiter for sensitive authentication endpoints (login, register).
 * Throttles brute force and credential-stuffing attacks while allowing normal operations.
 */
export const authRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: isTest ? 10000 : config.RATE_LIMIT_MAX_AUTH, // Generous in test mode to prevent test flakiness
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP address. Please try again later.',
  },
  skip: () => isTest,
});

/**
 * General API rate limiter to protect against denial-of-service and API abuse.
 */
export const generalRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: isTest ? 50000 : config.RATE_LIMIT_MAX_GENERAL,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'API rate limit exceeded. Please throttle your requests.',
  },
  skip: () => isTest,
});
