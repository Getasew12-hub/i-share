import { z } from "zod";

export const createReviewSchema = z.object({
  rentalId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});

export const reviewParamsSchema = z.object({
  reviewId: z.string().uuid(),
});

export const listReviewQuerySchema = z.object({
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

export const productReviewQuerySchema = z.object({
  productId: z.string().uuid(),
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

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ListReviewQuery = z.infer<typeof listReviewQuerySchema>;
export type ProductReviewQuery = z.infer<typeof productReviewQuerySchema>;
