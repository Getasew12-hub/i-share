import {
  Prisma,
  type Product,
  type ProductAvailabilityPeriod,
  type VendorProfile,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { AvailabilityRepository } from "../src/repositories/availability-repository.js";
import { AvailabilityService } from "../src/services/availability-service.js";

const now = new Date("2026-09-01T10:00:00.000Z");
const vendorId = "30000000-0000-4000-8000-000000000001";
const productId = "60000000-0000-4000-8000-000000000001";

type VendorPick = Pick<VendorProfile, "id" | "status" | "verificationStatus">;
type ProductWithAvailability = Product & {
  availabilityPeriods: ProductAvailabilityPeriod[];
  vendor: VendorPick;
};

function vendor(overrides: Partial<VendorProfile> = {}): VendorPick {
  return {
    id: vendorId,
    status: "APPROVED",
    verificationStatus: "APPROVED",
    ...overrides,
  };
}

function product(
  overrides: Partial<Product> = {},
  periods: ProductAvailabilityPeriod[] = [],
  vendorOverride: Partial<VendorProfile> = {},
): ProductWithAvailability {
  return {
    id: productId,
    vendorId,
    categoryId: "50000000-0000-4000-8000-000000000001",
    name: "Cordless Drill",
    slug: "cordless-drill",
    description: "A reliable cordless drill.",
    pricingModel: "DAILY",
    hourlyRate: null,
    dailyRate: new Prisma.Decimal("15.00"),
    weeklyRate: null,
    monthlyRate: null,
    currency: "USD",
    securityDeposit: new Prisma.Decimal("50.00"),
    deliveryAvailable: false,
    deliveryCharge: new Prisma.Decimal("0.00"),
    city: "Addis Ababa",
    country: "ET",
    specifications: null,
    rentalPolicies: null,
    metadata: null,
    status: "PUBLISHED",
    publishedAt: now,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    availabilityPeriods: periods,
    vendor: vendor(vendorOverride),
    ...overrides,
  };
}

function period(
  overrides: Partial<ProductAvailabilityPeriod> = {},
): ProductAvailabilityPeriod {
  return {
    id: "70000000-0000-4000-8000-000000000001",
    productId,
    type: "AVAILABLE",
    startsAt: new Date("2026-09-10T00:00:00.000Z"),
    endsAt: new Date("2026-09-15T00:00:00.000Z"),
    reason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

class FakeAvailabilityRepository implements AvailabilityRepository {
  product: ReturnType<typeof product> | null = null;

  async findProductWithAvailability() {
    return this.product;
  }

  async findAvailabilityForRange(
    _productId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    if (!this.product) return [];
    return this.product.availabilityPeriods.filter(
      (p) => p.startsAt < endsAt && p.endsAt > startsAt,
    );
  }

  async hasAvailableWindow(_productId: string, startsAt: Date, endsAt: Date) {
    if (!this.product) return false;
    return this.product.availabilityPeriods.some(
      (p) =>
        p.type === "AVAILABLE" && p.startsAt <= startsAt && p.endsAt >= endsAt,
    );
  }

  async hasUnavailableConflict(
    _productId: string,
    startsAt: Date,
    endsAt: Date,
  ) {
    if (!this.product) return false;
    return this.product.availabilityPeriods.some(
      (p) =>
        ["RESERVED", "MAINTENANCE", "BLOCKED"].includes(p.type) &&
        p.startsAt < endsAt &&
        p.endsAt > startsAt,
    );
  }
}

function createService(productData: ReturnType<typeof product> | null) {
  const repository = new FakeAvailabilityRepository();
  repository.product = productData;
  return new AvailabilityService(repository);
}

describe("AvailabilityService", () => {
  describe("checkAvailability", () => {
    it("returns available when date range is fully covered by an available period", async () => {
      const service = createService(
        product({}, [
          period({
            startsAt: new Date("2026-09-10T00:00:00.000Z"),
            endsAt: new Date("2026-09-15T00:00:00.000Z"),
          }),
        ]),
      );

      const result = await service.checkAvailability(
        productId,
        new Date("2026-09-11T00:00:00.000Z"),
        new Date("2026-09-13T00:00:00.000Z"),
      );

      expect(result.available).toBe(true);
      expect(result.coveringPeriod).not.toBeNull();
      expect(result.conflicts).toHaveLength(0);
    });

    it("returns unavailable when no available period covers the range", async () => {
      const service = createService(
        product({}, [
          period({
            startsAt: new Date("2026-09-10T00:00:00.000Z"),
            endsAt: new Date("2026-09-12T00:00:00.000Z"),
          }),
        ]),
      );

      const result = await service.checkAvailability(
        productId,
        new Date("2026-09-11T00:00:00.000Z"),
        new Date("2026-09-14T00:00:00.000Z"),
      );

      expect(result.available).toBe(false);
      expect(result.coveringPeriod).toBeNull();
    });

    it("returns unavailable when a blocked period overlaps", async () => {
      const service = createService(
        product({}, [
          period({
            startsAt: new Date("2026-09-10T00:00:00.000Z"),
            endsAt: new Date("2026-09-15T00:00:00.000Z"),
          }),
          period({
            id: "70000000-0000-4000-8000-000000000002",
            type: "BLOCKED",
            startsAt: new Date("2026-09-12T00:00:00.000Z"),
            endsAt: new Date("2026-09-13T00:00:00.000Z"),
          }),
        ]),
      );

      const result = await service.checkAvailability(
        productId,
        new Date("2026-09-11T00:00:00.000Z"),
        new Date("2026-09-14T00:00:00.000Z"),
      );

      expect(result.available).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe("BLOCKED");
    });

    it("returns unavailable when a maintenance period overlaps", async () => {
      const service = createService(
        product({}, [
          period({
            startsAt: new Date("2026-09-10T00:00:00.000Z"),
            endsAt: new Date("2026-09-15T00:00:00.000Z"),
          }),
          period({
            id: "70000000-0000-4000-8000-000000000003",
            type: "MAINTENANCE",
            startsAt: new Date("2026-09-12T00:00:00.000Z"),
            endsAt: new Date("2026-09-13T00:00:00.000Z"),
          }),
        ]),
      );

      const result = await service.checkAvailability(
        productId,
        new Date("2026-09-11T00:00:00.000Z"),
        new Date("2026-09-14T00:00:00.000Z"),
      );

      expect(result.available).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe("MAINTENANCE");
    });

    it("returns unavailable when a reserved period overlaps", async () => {
      const service = createService(
        product({}, [
          period({
            startsAt: new Date("2026-09-10T00:00:00.000Z"),
            endsAt: new Date("2026-09-15T00:00:00.000Z"),
          }),
          period({
            id: "70000000-0000-4000-8000-000000000004",
            type: "RESERVED",
            startsAt: new Date("2026-09-12T00:00:00.000Z"),
            endsAt: new Date("2026-09-13T00:00:00.000Z"),
          }),
        ]),
      );

      const result = await service.checkAvailability(
        productId,
        new Date("2026-09-11T00:00:00.000Z"),
        new Date("2026-09-14T00:00:00.000Z"),
      );

      expect(result.available).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe("RESERVED");
    });

    it("treats adjacent periods as non-overlapping", async () => {
      const service = createService(
        product({}, [
          period({
            startsAt: new Date("2026-09-10T00:00:00.000Z"),
            endsAt: new Date("2026-09-15T00:00:00.000Z"),
          }),
          period({
            id: "70000000-0000-4000-8000-000000000005",
            type: "BLOCKED",
            startsAt: new Date("2026-09-15T00:00:00.000Z"),
            endsAt: new Date("2026-09-16T00:00:00.000Z"),
          }),
        ]),
      );

      const result = await service.checkAvailability(
        productId,
        new Date("2026-09-11T00:00:00.000Z"),
        new Date("2026-09-15T00:00:00.000Z"),
      );

      expect(result.available).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it("handles exact boundary matches as available", async () => {
      const service = createService(
        product({}, [
          period({
            startsAt: new Date("2026-09-10T00:00:00.000Z"),
            endsAt: new Date("2026-09-15T00:00:00.000Z"),
          }),
        ]),
      );

      const result = await service.checkAvailability(
        productId,
        new Date("2026-09-10T00:00:00.000Z"),
        new Date("2026-09-15T00:00:00.000Z"),
      );

      expect(result.available).toBe(true);
      expect(result.coveringPeriod).not.toBeNull();
    });

    it("returns unavailable when range starts before available period", async () => {
      const service = createService(
        product({}, [
          period({
            startsAt: new Date("2026-09-10T00:00:00.000Z"),
            endsAt: new Date("2026-09-15T00:00:00.000Z"),
          }),
        ]),
      );

      const result = await service.checkAvailability(
        productId,
        new Date("2026-09-09T00:00:00.000Z"),
        new Date("2026-09-14T00:00:00.000Z"),
      );

      expect(result.available).toBe(false);
      expect(result.coveringPeriod).toBeNull();
    });

    it("returns unavailable when range ends after available period", async () => {
      const service = createService(
        product({}, [
          period({
            startsAt: new Date("2026-09-10T00:00:00.000Z"),
            endsAt: new Date("2026-09-15T00:00:00.000Z"),
          }),
        ]),
      );

      const result = await service.checkAvailability(
        productId,
        new Date("2026-09-11T00:00:00.000Z"),
        new Date("2026-09-16T00:00:00.000Z"),
      );

      expect(result.available).toBe(false);
      expect(result.coveringPeriod).toBeNull();
    });

    it("returns 404 when product does not exist", async () => {
      const service = createService(null);

      await expect(
        service.checkAvailability(
          productId,
          new Date("2026-09-11T00:00:00.000Z"),
          new Date("2026-09-13T00:00:00.000Z"),
        ),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: "PRODUCT_NOT_FOUND",
      });
    });

    it("returns not rentable when vendor is not approved", async () => {
      const service = createService(
        product(
          {},
          [
            period({
              startsAt: new Date("2026-09-10T00:00:00.000Z"),
              endsAt: new Date("2026-09-15T00:00:00.000Z"),
            }),
          ],
          vendor({
            status: "PENDING_VERIFICATION",
            verificationStatus: "PENDING",
          }),
        ),
      );

      await expect(
        service.checkAvailability(
          productId,
          new Date("2026-09-11T00:00:00.000Z"),
          new Date("2026-09-13T00:00:00.000Z"),
        ),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: "PRODUCT_NOT_RENTABLE",
      });
    });

    it("handles multiple overlapping conflicts", async () => {
      const service = createService(
        product({}, [
          period({
            startsAt: new Date("2026-09-10T00:00:00.000Z"),
            endsAt: new Date("2026-09-20T00:00:00.000Z"),
          }),
          period({
            id: "70000000-0000-4000-8000-000000000006",
            type: "BLOCKED",
            startsAt: new Date("2026-09-12T00:00:00.000Z"),
            endsAt: new Date("2026-09-13T00:00:00.000Z"),
          }),
          period({
            id: "70000000-0000-4000-8000-000000000007",
            type: "MAINTENANCE",
            startsAt: new Date("2026-09-14T00:00:00.000Z"),
            endsAt: new Date("2026-09-16T00:00:00.000Z"),
          }),
        ]),
      );

      const result = await service.checkAvailability(
        productId,
        new Date("2026-09-11T00:00:00.000Z"),
        new Date("2026-09-18T00:00:00.000Z"),
      );

      expect(result.available).toBe(false);
      expect(result.conflicts).toHaveLength(2);
    });
  });

  describe("getSchedule", () => {
    it("returns the availability schedule for a product", async () => {
      const service = createService(
        product({}, [
          period({
            startsAt: new Date("2026-09-10T00:00:00.000Z"),
            endsAt: new Date("2026-09-15T00:00:00.000Z"),
          }),
          period({
            id: "70000000-0000-4000-8000-000000000008",
            type: "BLOCKED",
            startsAt: new Date("2026-09-15T00:00:00.000Z"),
            endsAt: new Date("2026-09-16T00:00:00.000Z"),
          }),
        ]),
      );

      const result = await service.getSchedule(productId);

      expect(result.productId).toBe(productId);
      expect(result.isRentable).toBe(true);
      expect(result.periods).toHaveLength(2);
      expect(result.periods[0].type).toBe("AVAILABLE");
      expect(result.periods[1].type).toBe("BLOCKED");
    });

    it("returns not rentable when vendor is not approved", async () => {
      const service = createService(
        product(
          {},
          [],
          vendor({ status: "REJECTED", verificationStatus: "REJECTED" }),
        ),
      );

      const result = await service.getSchedule(productId);

      expect(result.isRentable).toBe(false);
    });

    it("returns 404 when product does not exist", async () => {
      const service = createService(null);

      await expect(service.getSchedule(productId)).rejects.toMatchObject({
        statusCode: 404,
        code: "PRODUCT_NOT_FOUND",
      });
    });
  });
});
