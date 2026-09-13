import { VendorDocumentType } from "@prisma/client";
import { z } from "zod";

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value === "" ? undefined : value));

export const vendorProfileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(200).optional(),
  businessName: z.string().trim().min(1).max(200).optional(),
  businessEmail: z.string().trim().email().max(320).toLowerCase().optional(),
  businessPhone: z.string().trim().min(4).max(40).optional(),
  taxIdentifier: optionalTrimmedString(100),
  description: optionalTrimmedString(2000),
  websiteUrl: z.string().trim().url().max(2048).optional(),
  country: z.string().trim().min(1).max(80).optional(),
  city: z.string().trim().min(1).max(120).optional(),
  addressLine1: optionalTrimmedString(500),
  addressLine2: optionalTrimmedString(500),
});

export const vendorDocumentMetadataSchema = z.object({
  documentType: z.nativeEnum(VendorDocumentType).default("OTHER"),
  fileName: z.string().trim().min(1).max(255),
  storageKey: z.string().trim().min(1).max(500),
  url: z.string().trim().url().max(2048).optional(),
  mimeType: z.string().trim().min(3).max(120),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024),
  metadata: z.record(z.unknown()).optional(),
});

export const vendorIdParamSchema = z.object({
  vendorId: z.string().uuid(),
});

export const vendorRejectionSchema = z.object({
  reason: z.string().trim().min(10).max(2000),
});

export type VendorProfileUpdateInput = z.infer<
  typeof vendorProfileUpdateSchema
>;
export type VendorDocumentMetadataInput = z.infer<
  typeof vendorDocumentMetadataSchema
>;
export type VendorRejectionInput = z.infer<typeof vendorRejectionSchema>;
