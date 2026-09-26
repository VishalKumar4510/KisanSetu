import { z } from 'zod';

export const bookSlotSchema = z.object({
  slotId: z.string().trim().min(1, 'slotId cannot be empty'),
  centreId: z.string().trim().optional(),
  produceId: z.string().trim().optional(),
});

export const cancelSlotSchema = z.object({
  tokenId: z.string().trim().min(1, 'tokenId cannot be empty'),
});

export type BookSlotInput = z.infer<typeof bookSlotSchema>;
export type CancelSlotInput = z.infer<typeof cancelSlotSchema>;
