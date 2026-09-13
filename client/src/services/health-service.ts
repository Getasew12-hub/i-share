import { z } from "zod";

import { apiClient } from "./api-client";

const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export async function getHealth(): Promise<HealthResponse> {
  const response = await apiClient.get("/health");

  return healthResponseSchema.parse(response.data);
}
