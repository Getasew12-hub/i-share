import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "./api-client";
import { checkAvailability } from "./availability-service";

afterEach(() => {
  apiClient.defaults.adapter = undefined;
  vi.restoreAllMocks();
});

describe("availability service", () => {
  it("returns an available result for a covered available period", async () => {
    const adapter = vi.fn(async (config) => ({
      data: {
        data: {
          available: true,
          productId: "product-1",
          startsAt: "2030-01-10T10:00:00.000Z",
          endsAt: "2030-01-10T12:00:00.000Z",
          coveringPeriod: { type: "AVAILABLE" },
          conflicts: [],
        },
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    apiClient.defaults.adapter = adapter;

    await expect(
      checkAvailability(
        "product-1",
        "2030-01-10T10:00:00.000Z",
        "2030-01-10T12:00:00.000Z",
      ),
    ).resolves.toMatchObject({ available: true });
  });

  it("returns conflicts for unavailable periods", async () => {
    const adapter = vi.fn(async (config) => ({
      data: {
        data: {
          available: false,
          productId: "product-1",
          startsAt: "2030-01-10T10:00:00.000Z",
          endsAt: "2030-01-10T12:00:00.000Z",
          coveringPeriod: null,
          conflicts: [{ type: "MAINTENANCE" }],
        },
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    apiClient.defaults.adapter = adapter;

    await expect(
      checkAvailability(
        "product-1",
        "2030-01-10T10:00:00.000Z",
        "2030-01-10T12:00:00.000Z",
      ),
    ).resolves.toMatchObject({
      available: false,
      conflicts: [{ type: "MAINTENANCE" }],
    });
  });
});
