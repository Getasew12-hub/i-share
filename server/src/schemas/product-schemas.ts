import { z } from "zod";

const jsonRecordSchema = z.record(z.unknown());

const moneyStringSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))
  .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
    message: "Amount must be a non-negative number.",
  });

const positiveMoneyStringSchema = moneyStringSchema.refine(
  (value) => Number(value) > 0,
  {
    message: "Amount must be greater than zero.",
  },
);

const currencySchema = z
  .string()
  .trim()
  .length(3)
  .transform((value) => value.toUpperCase());

const queryStringSchema = z.preprocess(
  (value) => (Array.isArray(value) ? value[0] : value),
  z
    .string()
    .trim()
    .transform((value) => (value.length ? value : undefined))
    .optional(),
);

const optionalNumberQuerySchema = queryStringSchema
  .refine(
    (value) =>
      value === undefined ||
      (Number.isFinite(Number(value)) && Number(value) >= 0),
    {
      message: "Value must be a non-negative number.",
    },
  )
  .transform((value) => (value === undefined ? undefined : Number(value)));

const optionalIntegerQuerySchema = queryStringSchema
  .refine(
    (value) =>
      value === undefined ||
      (Number.isInteger(Number(value)) && Number(value) > 0),
    {
      message: "Value must be a positive integer.",
    },
  )
  .transform((value) => (value === undefined ? undefined : Number(value)));

const marketplaceSortSchema = z.preprocess(
  (value) => {
    const singleValue = Array.isArray(value) ? value[0] : value;

    if (typeof singleValue !== "string") {
      return singleValue;
    }

    const trimmed = singleValue.trim();

    return trimmed.length ? trimmed : undefined;
  },
  z.enum(["newest", "name_asc", "name_desc"]).optional().default("newest"),
);

const fileMetadataSchema = z.object({
  fileName: z.string().trim().min(1).max(240),
  storageKey: z.string().trim().min(1).max(500),
  url: z.string().url().optional(),
  mimeType: z.string().trim().min(1).max(120),
  fileSize: z.number().int().positive(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  metadata: jsonRecordSchema.optional(),
});

export const productParamsSchema = z.object({
  productId: z.string().uuid(),
});

export const publicProductParamsSchema = z.object({
  productId: z.string().uuid(),
});

export const categoryParamsSchema = z.object({
  categoryId: z.string().uuid(),
});

export const marketplaceQuerySchema = z
  .object({
    query: queryStringSchema,
    search: queryStringSchema,
    category: queryStringSchema,
    minPrice: optionalNumberQuerySchema,
    maxPrice: optionalNumberQuerySchema,
    location: queryStringSchema,
    availableOn: queryStringSchema.refine(
      (value) => value === undefined || !Number.isNaN(Date.parse(value)),
      {
        message: "Availability date must be a valid date.",
      },
    ),
    page: optionalIntegerQuerySchema.default(1),
    limit: optionalIntegerQuerySchema.default(12),
    sort: marketplaceSortSchema,
  })
  .superRefine((value, context) => {
    if (value.page > 1000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["page"],
        message: "Page is too high.",
      });
    }

    if (value.limit > 50) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["limit"],
        message: "Limit cannot exceed 50.",
      });
    }

    if (
      value.minPrice !== undefined &&
      value.maxPrice !== undefined &&
      value.minPrice > value.maxPrice
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxPrice"],
        message:
          "Maximum price must be greater than or equal to minimum price.",
      });
    }
  })
  .transform((value) => ({
    query: value.query ?? value.search,
    category: value.category,
    minPrice: value.minPrice,
    maxPrice: value.maxPrice,
    location: value.location,
    availableOn: value.availableOn,
    page: value.page,
    limit: value.limit,
    sort: value.sort,
  }));

const productBaseSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().min(10),
  pricingModel: z.enum(["HOURLY", "DAILY", "WEEKLY", "MONTHLY"]),
  hourlyRate: positiveMoneyStringSchema.optional(),
  dailyRate: positiveMoneyStringSchema.optional(),
  weeklyRate: positiveMoneyStringSchema.optional(),
  monthlyRate: positiveMoneyStringSchema.optional(),
  currency: currencySchema.default("USD"),
  securityDeposit: moneyStringSchema.default("0"),
  deliveryAvailable: z.boolean().default(false),
  deliveryCharge: moneyStringSchema.default("0"),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(80).optional(),
  specifications: jsonRecordSchema.optional(),
  rentalPolicies: jsonRecordSchema.optional(),
  metadata: jsonRecordSchema.optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED"]).default("DRAFT"),
});

export const createProductSchema = productBaseSchema.superRefine(
  (value, context) => {
    const rateByModel = {
      HOURLY: value.hourlyRate,
      DAILY: value.dailyRate,
      WEEKLY: value.weeklyRate,
      MONTHLY: value.monthlyRate,
    };

    if (!rateByModel[value.pricingModel]) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [`${value.pricingModel.toLowerCase()}Rate`],
        message: "A positive rate is required for the selected pricing model.",
      });
    }
  },
);

const productUpdateBaseSchema = productBaseSchema
  .omit({ status: true })
  .partial();

export const updateProductSchema = productUpdateBaseSchema.superRefine(
  (value, context) => {
    if (!value.pricingModel) {
      return;
    }

    const rateByModel = {
      HOURLY: value.hourlyRate,
      DAILY: value.dailyRate,
      WEEKLY: value.weeklyRate,
      MONTHLY: value.monthlyRate,
    };

    if (!rateByModel[value.pricingModel]) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [`${value.pricingModel.toLowerCase()}Rate`],
        message: "A positive rate is required for the selected pricing model.",
      });
    }
  },
);

export const productStatusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"]),
});

export const productImageSchema = fileMetadataSchema.extend({
  url: z.string().url(),
  sortOrder: z.number().int().min(0).default(0),
  altText: z.string().trim().max(240).optional(),
});

export const productDocumentSchema = fileMetadataSchema;

export const availabilityParamsSchema = z.object({
  productId: z.string().uuid(),
  availabilityId: z.string().uuid(),
});

export const availabilityPeriodSchema = z
  .object({
    type: z.enum(["AVAILABLE", "MAINTENANCE", "BLOCKED"]),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    reason: z.string().trim().max(500).optional(),
  })
  .superRefine((value, context) => {
    if (new Date(value.startsAt) >= new Date(value.endsAt)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "Availability end must be after the start.",
      });
    }
  });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductStatusInput = z.infer<typeof productStatusSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type ProductDocumentInput = z.infer<typeof productDocumentSchema>;
export type AvailabilityPeriodInput = z.infer<typeof availabilityPeriodSchema>;
export type MarketplaceQueryInput = {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  availableOn?: string;
  page: number;
  limit: number;
  sort: "newest" | "name_asc" | "name_desc";
};
