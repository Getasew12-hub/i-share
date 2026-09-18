import { describe, expect, it } from "vitest";

import type { Booking, RentalStatus } from "../types/booking";
import {
  canCancelCustomerBooking,
  canCancelVendorBooking,
  canCompleteVendorRental,
  canConfirmVendorBooking,
  canRejectVendorBooking,
  canStartVendorRental,
} from "./booking-workflow";

function booking(
  status: Booking["status"],
  rentalStatus: RentalStatus = "CONFIRMED",
): Booking {
  return {
    id: "booking-1",
    productId: "product-1",
    vendorId: "vendor-1",
    customerId: "customer-1",
    status,
    startsAt: "2030-01-10T10:00:00.000Z",
    endsAt: "2030-01-10T12:00:00.000Z",
    rentalDuration: 2,
    pricingModelSnapshot: "HOURLY",
    unitPriceSnapshot: "10",
    quantity: 1,
    rentalSubtotal: "20",
    deliveryCharge: "0",
    securityDeposit: "0",
    promotionalDiscount: "0",
    totalAmount: "20",
    currency: "USD",
    cancellationReason: null,
    cancelledAt: null,
    rejectedReason: null,
    rejectedAt: null,
    expiresAt: null,
    product: {
      id: "product-1",
      name: "Product",
      pricingModel: "HOURLY",
      city: null,
      country: null,
      imageUrl: null,
      category: { id: "category-1", name: "Category", slug: "category" },
    },
    vendor: { id: "vendor-1", displayName: "Vendor" },
    customer: { id: "customer-1", displayName: "Customer" },
    rental: {
      id: "rental-1",
      bookingId: "booking-1",
      status: rentalStatus,
      pickupDate: null,
      expectedReturnDate: "2030-01-10T12:00:00.000Z",
      actualReturnDate: null,
      isLateReturn: false,
      damageNotes: null,
      additionalCharges: "0",
      additionalChargeReason: null,
      events: [],
      createdAt: "2030-01-01T00:00:00.000Z",
      updatedAt: "2030-01-01T00:00:00.000Z",
    },
    createdAt: "2030-01-01T00:00:00.000Z",
    updatedAt: "2030-01-01T00:00:00.000Z",
  };
}

describe("booking workflow state rules", () => {
  it("allows cancellation only from pending or confirmed", () => {
    expect(canCancelCustomerBooking("PENDING")).toBe(true);
    expect(canCancelCustomerBooking("CONFIRMED")).toBe(true);
    expect(canCancelCustomerBooking("ACTIVE")).toBe(false);
    expect(canCancelVendorBooking("COMPLETED")).toBe(false);
  });

  it("allows vendor approval and rejection only for pending bookings", () => {
    expect(canConfirmVendorBooking("PENDING")).toBe(true);
    expect(canRejectVendorBooking("PENDING")).toBe(true);
    expect(canConfirmVendorBooking("CONFIRMED")).toBe(false);
    expect(canRejectVendorBooking("CANCELLED")).toBe(false);
  });

  it("allows rental transitions only from backend-supported states", () => {
    expect(canStartVendorRental(booking("CONFIRMED", "CONFIRMED"))).toBe(true);
    expect(canStartVendorRental(booking("CONFIRMED", "PAID"))).toBe(true);
    expect(canStartVendorRental(booking("PENDING", "CONFIRMED"))).toBe(false);
    expect(canCompleteVendorRental(booking("ACTIVE", "ACTIVE"))).toBe(true);
    expect(canCompleteVendorRental(booking("ACTIVE", "IN_PROGRESS"))).toBe(true);
    expect(canCompleteVendorRental(booking("CONFIRMED", "ACTIVE"))).toBe(false);
  });
});
