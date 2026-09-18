import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient, configureAuthHandlers } from "./api-client";
import { invoiceService } from "./invoice-service";
import { notificationService } from "./notification-service";
import { paymentService } from "./payment-service";
import { reviewService } from "./review-service";

afterEach(() => {
  apiClient.defaults.adapter = undefined;
  configureAuthHandlers({
    getAccessToken: () => null,
    refreshAccessToken: async () => ({ accessToken: "unused" }),
    onRefreshFailure: vi.fn(),
  });
  vi.restoreAllMocks();
});

describe("Step 3 service contracts", () => {
  it("sends the required payment body and unwraps payment lists", async () => {
    const adapter = vi.fn(async (config) => ({
      data: {
        data: {
          payments: [
            {
              id: "payment-1",
              bookingId: "booking-1",
              provider: "OTHER",
              status: "PENDING",
              amount: "20.00",
              currency: "USD",
              createdAt: "2030-01-01T00:00:00.000Z",
              updatedAt: "2030-01-01T00:00:00.000Z",
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        },
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    apiClient.defaults.adapter = adapter;

    const paymentList = await paymentService.listMyPayments();

    expect(paymentList.totalPages).toBe(1);
    expect(paymentList.payments[0].amount).toBe("20.00");

    await paymentService.createBookingPayment("booking-1", {
      provider: "OTHER",
    });
    expect(JSON.parse(adapter.mock.calls[1][0].data)).toEqual({
      bookingId: "booking-1",
      provider: "OTHER",
    });
  });

  it("maps invoice snapshots and pagination", async () => {
    apiClient.defaults.adapter = vi.fn(async (config) => ({
      data: {
        data: {
          invoices: [
            {
              id: "invoice-1",
              bookingId: "booking-1",
              paymentId: "payment-1",
              invoiceNumber: "INV-1",
              status: "ISSUED",
              customerSnapshot: { id: "customer-1", displayName: "Customer", email: "customer@example.com" },
              vendorSnapshot: { id: "vendor-1", displayName: "Vendor", email: "vendor@example.com" },
              productSnapshot: { id: "product-1", name: "Camera", slug: "camera" },
              pricingSnapshot: { pricingModel: "DAILY", unitPrice: "20.00", rentalDuration: 2, rentalSubtotal: "40.00", deliveryCharge: "0.00", securityDeposit: "0.00", promotionalDiscount: "0.00", currency: "USD" },
              subtotalAmount: "40.00",
              discountAmount: "0.00",
              totalAmount: "40.00",
              currency: "USD",
              issuedAt: "2030-01-01T00:00:00.000Z",
              createdAt: "2030-01-01T00:00:00.000Z",
              updatedAt: "2030-01-01T00:00:00.000Z",
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));

    const result = await invoiceService.listMyInvoices();

    expect(result.invoices[0].snapshots.productName).toBe("Camera");
    expect(result.invoices[0].currency).toBe("USD");
  });

  it("unwraps review creation and notification read responses", async () => {
    const adapter = vi
      .fn()
      .mockImplementationOnce(async (config) => ({
        data: { data: { review: { id: "review-1", rentalId: "rental-1" } } },
        status: 201,
        statusText: "Created",
        headers: {},
        config,
      }))
      .mockImplementationOnce(async (config) => ({
        data: { data: { notification: { id: "notification-1", status: "READ" } } },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      }));
    apiClient.defaults.adapter = adapter;

    await expect(
      reviewService.createReview({ rentalId: "rental-1", rating: 5 }),
    ).resolves.toMatchObject({ review: { id: "review-1" } });
    await expect(notificationService.markAsRead("notification-1")).resolves.toMatchObject({
      notification: { status: "READ" },
    });
  });
});