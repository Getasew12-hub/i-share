import { z } from "zod";

export const listNotificationQuerySchema = z.object({
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

export const notificationParamsSchema = z.object({
  notificationId: z.string().uuid(),
});

export type ListNotificationQuery = z.infer<typeof listNotificationQuerySchema>;
