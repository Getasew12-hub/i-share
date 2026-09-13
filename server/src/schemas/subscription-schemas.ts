import { z } from "zod";

export const selectSubscriptionSchema = z.object({
  planId: z.string().uuid(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]),
});

export const changeSubscriptionPlanSchema = z.object({
  planId: z.string().uuid(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
});

export type SelectSubscriptionInput = z.infer<typeof selectSubscriptionSchema>;
export type ChangeSubscriptionPlanInput = z.infer<
  typeof changeSubscriptionPlanSchema
>;
