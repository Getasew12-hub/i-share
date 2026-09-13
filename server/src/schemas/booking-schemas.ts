import { z } from "zod";

export const bookingParamsSchema = z.object({
  bookingId: z.string().uuid(),
});

export const createBookingSchema = z
  .object({
    productId: z.string().uuid(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    quantity: z.number().int().positive().default(1),
  })
  .superRefine((value, context) => {
    if (new Date(value.startsAt) >= new Date(value.endsAt)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "Booking end must be after the start.",
      });
    }
  });

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const rejectBookingSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const completeRentalSchema = z.object({
  actualReturnDate: z.string().datetime({ offset: true }).optional(),
  damageNotes: z.string().trim().max(1000).optional(),
  additionalCharges: z
    .union([z.string(), z.number()])
    .transform((value) => String(value))
    .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
      message: "Additional charges must be a non-negative number.",
    })
    .optional(),
  additionalChargeReason: z.string().trim().max(500).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type RejectBookingInput = z.infer<typeof rejectBookingSchema>;
export type CompleteRentalInput = z.infer<typeof completeRentalSchema>;
