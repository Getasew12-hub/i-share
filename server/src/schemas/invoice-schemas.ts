import { z } from "zod";

export const invoiceParamsSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const listInvoiceQuerySchema = z.object({
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

export type ListInvoiceQuery = z.infer<typeof listInvoiceQuerySchema>;
