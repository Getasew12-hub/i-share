import { apiClient } from "./api-client";
import type { AvailabilityPeriod } from "../types/product";

type Envelope<T> = { data: T };

export type AvailabilityCheck = {
  available: boolean;
  productId: string;
  startsAt: string;
  endsAt: string;
  coveringPeriod: AvailabilityPeriod | null;
  conflicts: AvailabilityPeriod[];
};

export type AvailabilitySchedule = {
  productId: string;
  isRentable: boolean;
  periods: Array<{
    type: AvailabilityPeriod["type"];
    startsAt: string;
    endsAt: string;
    reason: string | null;
  }>;
};

export async function checkAvailability(
  productId: string,
  startsAt: string,
  endsAt: string,
) {
  const response = await apiClient.get<Envelope<AvailabilityCheck>>(
    `/products/${productId}/availability`,
    { params: { startsAt, endsAt } },
  );

  return response.data.data;
}

export async function getAvailabilitySchedule(productId: string) {
  const response = await apiClient.get<Envelope<AvailabilitySchedule>>(
    `/products/${productId}/schedule`,
  );

  return response.data.data;
}
