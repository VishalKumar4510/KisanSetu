import { z } from 'zod';

export const updateProcurementStatusSchema = z.object({
  status: z.enum([
    'BOOKED',
    'ARRIVED',
    'CALLED',
    'GATE_ENTRY',
    'WEIGHING',
    'QUALITY_CHECK',
    'PROCUREMENT',
    'PAYMENT_PENDING',
    'PAYMENT_PROCESSING',
    'COMPLETED',
    'REJECTED',
  ] as const),
  weighingData: z
    .object({
      grossWeight: z.coerce.number().positive('grossWeight must be positive'),
      tareWeight: z.coerce.number().min(0, 'tareWeight must be non-negative'),
      netWeight: z.coerce.number().positive().optional(),
    })
    .optional(),
  qualityData: z
    .object({
      moistureContent: z.coerce.number().min(0).max(100),
      foreignMatter: z.coerce.number().min(0).max(100).optional(),
      grade: z.string(),
      accepted: z.boolean().optional(),
      remarks: z.string().optional(),
    })
    .optional(),
});

export type UpdateProcurementStatusInput = z.infer<typeof updateProcurementStatusSchema>;
