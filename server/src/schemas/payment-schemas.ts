import { z } from "zod";

export const createBookingPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  provider: z.enum([
    "CHAPA",
    "STRIPE",
    "PAYPAL",
    "TELEBIRR",
    "BANK_TRANSFER",
    "OTHER",
  ]),
  methodLabel: z.string().trim().max(120).optional(),
});

export const bookingPaymentParamsSchema = z.object({
  paymentId: z.string().uuid(),
});

export const listPaymentQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1)
    .transform((val) => Math.min(val, 1000)),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .default(20)
    .transform((val) => Math.min(val, 50)),
});

export type CreateBookingPaymentInput = z.infer<
  typeof createBookingPaymentSchema
>;
export type ListPaymentQuery = z.infer<typeof listPaymentQuerySchema>;
