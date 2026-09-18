import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "./api-client";
import { createMyBooking } from "./booking-service";

const bookingResponse = {
  id: "booking-1",
  status: "PENDING",
};

afterEach(() => {
  apiClient.defaults.adapter = undefined;
  vi.restoreAllMocks();
});

describe("booking service", () => {
  it("creates a booking with the expected endpoint, body, and response envelope", async () => {
    const adapter = vi.fn(async (config) => ({
      data: { data: { booking: bookingResponse } },
      status: 201,
      statusText: "Created",
      headers: {},
      config,
    }));
    apiClient.defaults.adapter = adapter;

    const result = await createMyBooking("access-token", {
      productId: "product-1",
      startsAt: "2030-01-10T10:00:00.000Z",
      endsAt: "2030-01-10T12:00:00.000Z",
      quantity: 1,
    });

    expect(result).toEqual(bookingResponse);
    expect(adapter).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "post",
        url: "/bookings/me",
        data: {
          productId: "product-1",
          startsAt: "2030-01-10T10:00:00.000Z",
          endsAt: "2030-01-10T12:00:00.000Z",
          quantity: 1,
        },
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("preserves booking failures from the API", async () => {
    const adapter = vi.fn(async (config) => {
      throw new axios.AxiosError(
        "Request failed",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        {
          data: {
            error: {
              code: "PRODUCT_UNAVAILABLE",
              message: "Product is unavailable for the requested period.",
            },
          },
          headers: {},
          status: 409,
          statusText: "Conflict",
          config: config as never,
        },
      );
    });
    apiClient.defaults.adapter = adapter;

    await expect(
      createMyBooking("access-token", {
        productId: "product-1",
        startsAt: "2030-01-10T10:00:00.000Z",
        endsAt: "2030-01-10T12:00:00.000Z",
        quantity: 1,
      }),
    ).rejects.toMatchObject({
      response: {
        status: 409,
        data: {
          error: { code: "PRODUCT_UNAVAILABLE" },
        },
      },
    });
  });
});
