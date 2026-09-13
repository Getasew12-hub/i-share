import { z } from "zod";

const email = z.string().trim().email().max(320).toLowerCase();
const password = z.string().min(10).max(128);
const optionalName = z.string().trim().min(1).max(100).optional();
const displayName = z.string().trim().min(1).max(200);

export const customerRegistrationSchema = z.object({
  email,
  password,
  firstName: optionalName,
  lastName: optionalName,
  phoneNumber: z.string().trim().min(4).max(40).optional(),
  displayName,
});

export const vendorRegistrationSchema = customerRegistrationSchema.extend({
  businessName: z.string().trim().min(1).max(200).optional(),
  businessEmail: email.optional(),
  businessPhone: z.string().trim().min(4).max(40).optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const emailVerificationConfirmSchema = z.object({
  token: z.string().min(32).max(256),
});

export type CustomerRegistrationInput = z.infer<
  typeof customerRegistrationSchema
>;
export type VendorRegistrationInput = z.infer<typeof vendorRegistrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
