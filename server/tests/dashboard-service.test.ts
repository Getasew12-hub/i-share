import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../src/config/prisma.js";
import type {
  AdminDashboard,
  CustomerDashboard,
  DashboardRepository,
  VendorDashboard,
} from "../src/types/dashboard.js";
import { DashboardService } from "../src/services/dashboard-service.js";

const customerDashboard: CustomerDashboard = {
  bookings: {
    total: 4,
    pending: 1,
    upcoming: 2,
    byStatus: { PENDING: 1, CONFIRMED: 2, COMPLETED: 1 },
  },
  rentals: { active: 1, completed: 1 },
  successfulPayments: [{ currency: "USD", amount: "120.00", count: 2 }],
  invoices: [{ currency: "USD", amount: "120.00", count: 2 }],
  submittedReviewCount: 1,
  unreadNotificationCount: 3,
};

const vendorDashboard: VendorDashboard = {
  products: { total: 2, published: 1 },
  bookings: {
    total: 3,
    pending: 1,
    upcoming: 1,
    byStatus: { PENDING: 1, CONFIRMED: 1, COMPLETED: 1 },
  },
  rentals: { active: 1, completed: 1 },
  successfulPayments: [
    { currency: "USD", amount: "100.00", count: 1 },
    { currency: "ETB", amount: "500.00", count: 1 },
  ],
  invoices: [{ currency: "USD", amount: "100.00", count: 1 }],
  reviews: { publishedCount: 2, averageRating: 4.5 },
  unreadNotificationCount: 2,
  subscription: null,
};

const adminDashboard: AdminDashboard = {
  users: {
    total: 3,
    byRole: { ADMIN: 1, VENDOR: 1, CUSTOMER: 1 },
  },
  vendors: { total: 1, byVerificationStatus: { APPROVED: 1 } },
  products: 2,
  bookings: 3,
  rentals: 1,
};

class FakeDashboardRepository implements DashboardRepository {
  async getCustomerMetrics() {
    return customerDashboard;
  }

  async getVendorMetrics() {
    return vendorDashboard;
  }

  async getAdminMetrics() {
    return adminDashboard;
  }
}

describe("DashboardService", () => {
  const repository = new FakeDashboardRepository();
  const service = new DashboardService(repository);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns customer metrics for the authenticated customer's profile", async () => {
    vi.spyOn(prisma.customerProfile, "findUnique").mockResolvedValue({ id: "customer-1" });

    await expect(service.getCustomerDashboard("user-1")).resolves.toEqual(customerDashboard);
  });

  it("returns vendor metrics for the authenticated vendor's profile", async () => {
    vi.spyOn(prisma.vendorProfile, "findUnique").mockResolvedValue({ id: "vendor-1" });

    await expect(service.getVendorDashboard("user-1")).resolves.toEqual(vendorDashboard);
  });

  it("returns the admin operational dashboard", async () => {
    await expect(service.getAdminDashboard()).resolves.toEqual(adminDashboard);
  });

  it("rejects a customer dashboard request without a customer profile", async () => {
    vi.spyOn(prisma.customerProfile, "findUnique").mockResolvedValue(null);

    await expect(service.getCustomerDashboard("user-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "CUSTOMER_PROFILE_NOT_FOUND",
    });
  });

  it("rejects a vendor dashboard request without a vendor profile", async () => {
    vi.spyOn(prisma.vendorProfile, "findUnique").mockResolvedValue(null);

    await expect(service.getVendorDashboard("user-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "VENDOR_PROFILE_NOT_FOUND",
    });
  });
});