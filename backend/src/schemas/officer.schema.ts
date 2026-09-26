import { z } from 'zod';

export const callFarmerSchema = z.object({
  centreId: z.string().trim().min(1, 'centreId cannot be empty'),
  tokenId: z.string().trim().optional(),
});

export const pauseQueueSchema = z.object({
  centreId: z.string().trim().min(1, 'centreId cannot be empty'),
  reason: z.string().trim().optional(),
});

export const resumeQueueSchema = z.object({
  centreId: z.string().trim().min(1, 'centreId cannot be empty'),
});

export const weighmentSchema = z.object({
  procurementId: z.string().trim().min(1, 'procurementId cannot be empty'),
  grossWeight: z.coerce
    .number()
    .positive('grossWeight must be strictly greater than 0')
    .max(100000, 'grossWeight exceeds maximum plausible boundary'),
  tareWeight: z.coerce
    .number()
    .min(0, 'tareWeight must be non-negative')
    .max(100000, 'tareWeight exceeds maximum plausible boundary'),
  scaleId: z.string().trim().optional(),
});

export const qualitySchema = z.object({
  procurementId: z.string().trim().min(1, 'procurementId cannot be empty'),
  crop: z.string().trim().optional(),
  moistureContent: z.coerce
    .number()
    .min(0, 'moistureContent cannot be negative')
    .max(100, 'moistureContent cannot exceed 100%')
    .optional(),
  foreignMatter: z.coerce
    .number()
    .min(0, 'foreignMatter cannot be negative')
    .max(100, 'foreignMatter cannot exceed 100%')
    .optional(),
  damagedGrains: z.coerce
    .number()
    .min(0, 'damagedGrains cannot be negative')
    .max(100, 'damagedGrains cannot exceed 100%')
    .optional(),
  grade: z.string().trim().optional(),
  qualityResult: z
    .enum(['ACCEPTED', 'REJECTED', 'NEEDS_REVIEW'] as const)
    .optional(),
  remarks: z.string().max(500, 'remarks cannot exceed 500 characters').optional(),
});

export const procurementIdSchema = z.object({
  procurementId: z.string().trim().min(1, 'procurementId cannot be empty'),
});

export const paymentProcessSchema = z.object({
  paymentId: z.string().trim().min(1, 'paymentId cannot be empty'),
  simulateFailure: z.boolean().optional(),
});
