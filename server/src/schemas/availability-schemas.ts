import { z } from "zod";

export const availabilityCheckSchema = z
  .object({
    productId: z.string().uuid(),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
  })
  .superRefine((value, context) => {
    if (new Date(value.startsAt) >= new Date(value.endsAt)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "Availability check end must be after the start.",
      });
    }
  });

export const availabilityQuerySchema = z
  .object({
    startsAt: z
      .preprocess(
        (value) => (Array.isArray(value) ? value[0] : value),
        z
          .string()
          .trim()
          .transform((value) => (value.length ? value : undefined))
          .optional(),
      )
      .refine(
        (value) => value === undefined || !Number.isNaN(Date.parse(value)),
        {
          message: "startsAt must be a valid date.",
        },
      ),
    endsAt: z
      .preprocess(
        (value) => (Array.isArray(value) ? value[0] : value),
        z
          .string()
          .trim()
          .transform((value) => (value.length ? value : undefined))
          .optional(),
      )
      .refine(
        (value) => value === undefined || !Number.isNaN(Date.parse(value)),
        {
          message: "endsAt must be a valid date.",
        },
      ),
  })
  .superRefine((value, context) => {
    if (value.startsAt && value.endsAt) {
      if (new Date(value.startsAt) >= new Date(value.endsAt)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endsAt"],
          message: "endsAt must be after startsAt.",
        });
      }
    }
  });

export type AvailabilityCheckInput = z.infer<typeof availabilityCheckSchema>;
export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
