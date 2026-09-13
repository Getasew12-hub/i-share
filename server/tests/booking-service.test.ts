import {
  Prisma,
  type Booking,
  type CustomerProfile,
  type Product,
  type ProductAvailabilityPeriod,
  type Rental,
  type RentalEvent,
  type VendorProfile,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import type { BookingRepository } from "../src/repositories/booking-repository.js";
import { BookingService } from "../src/services/booking-service.js";

const now = new Date("2026-09-01T10:00:00.000Z");
const vendorId = "30000000-0000-4000-8000-000000000001";
const customerId = "40000000-0000-4000-8000-000000000001";
const otherCustomerId = "40000000-0000-4000-8000-000000000002";
const productId = "60000000-0000-4000-8000-000000000001";
const bookingId = "80000000-0000-4000-8000-000000000001";
const rentalId = "90000000-0000-4000-8000-000000000001";

type BookingProduct = {
  id: string;
  name: string;
  pricingModel: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY";
  city: string | null;
  country: string | null;
  category: { id: string; name: string; slug: string };
  images: { id: string; url: string; altText: string | null }[];
};

type BookingWithRelations = Booking & {
  product: BookingProduct;
  vendor: VendorProfile;
  customer: CustomerProfile;
  rental: (Rental & { events: RentalEvent[] }) | null;
};

function decimal(value: string) {
  return new Prisma.Decimal(value);
}

function product(
  overrides: Partial<Product> = {},
  periods?: ProductAvailabilityPeriod[],
): Product & {
  availabilityPeriods: ProductAvailabilityPeriod[];
  vendor: Pick<VendorProfile, "id" | "status" | "verificationStatus">;
} {
  const defaultPeriods: ProductAvailabilityPeriod[] = periods ?? [
    {
      id: "70000000-0000-4000-8000-000000000001",
      productId,
      type: "AVAILABLE",
      startsAt: new Date("2026-09-10T00:00:00.000Z"),
      endsAt: new Date("2026-09-20T00:00:00.000Z"),
      reason: null,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    id: productId,
    vendorId,
    categoryId: "50000000-0000-4000-8000-000000000001",
    name: "Cordless Drill",
    slug: "cordless-drill",
    description: "A reliable cordless drill.",
    pricingModel: "DAILY",
    hourlyRate: null,
    dailyRate: decimal("15.00"),
    weeklyRate: null,
    monthlyRate: null,
    currency: "USD",
    securityDeposit: decimal("50.00"),
    deliveryAvailable: false,
    deliveryCharge: decimal("0.00"),
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
    availabilityPeriods: defaultPeriods,
    vendor: {
      id: vendorId,
      status: "APPROVED",
      verificationStatus: "APPROVED",
    },
    ...overrides,
  };
}

function booking(
  overrides: Partial<BookingWithRelations> = {},
): BookingWithRelations {
  return {
    id: bookingId,
    productId,
    vendorId,
    customerId,
    status: "PENDING",
    startsAt: new Date("2026-09-11T00:00:00.000Z"),
    endsAt: new Date("2026-09-13T00:00:00.000Z"),
    rentalDuration: 2,
    pricingModelSnapshot: "DAILY",
    unitPriceSnapshot: decimal("15.00"),
    quantity: 1,
    rentalSubtotal: decimal("30.00"),
    deliveryCharge: decimal("0.00"),
    securityDeposit: decimal("50.00"),
    promotionalDiscount: decimal("0.00"),
    totalAmount: decimal("80.00"),
    currency: "USD",
    cancellationReason: null,
    cancelledAt: null,
    rejectedReason: null,
    rejectedAt: null,
    expiresAt: null,
    createdAt: now,
    updatedAt: now,
    product: {
      id: productId,
      name: "Cordless Drill",
      pricingModel: "DAILY",
      city: "Addis Ababa",
      country: "ET",
      category: {
        id: "50000000-0000-4000-8000-000000000001",
        name: "Tools",
        slug: "tools",
      },
      images: [],
    },
    vendor: {
      id: vendorId,
      userId: "10000000-0000-4000-8000-000000000001",
      displayName: "Tool Vendor",
      businessName: null,
      businessEmail: null,
      businessPhone: null,
      taxIdentifier: null,
      description: null,
      websiteUrl: null,
      country: null,
      city: null,
      addressLine1: null,
      addressLine2: null,
      lifecycleStage: "REGISTERED",
      verificationStatus: "APPROVED",
      status: "APPROVED",
      rejectionReason: null,
      submittedAt: null,
      approvedAt: null,
      rejectedAt: null,
      reviewedById: null,
      createdAt: now,
      updatedAt: now,
    },
    customer: {
      id: customerId,
      userId: "20000000-0000-4000-8000-000000000001",
      displayName: "Test Customer",
      phoneNumber: null,
      country: null,
      city: null,
      createdAt: now,
      updatedAt: now,
    },
    rental: null,
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseBookingRepository = any;

class FakeBookingRepository implements LooseBookingRepository {
  customers = new Map<string, { id: string }>([
    [customerId, { id: customerId }],
    [otherCustomerId, { id: otherCustomerId }],
  ]);
  vendors = new Map<string, { id: string }>([[vendorId, { id: vendorId }]]);
  products = new Map<string, ReturnType<typeof product>>();
  bookings = new Map<string, BookingWithRelations>();
  conflictCount = 0;

  async findCustomerByUserId(id: string) {
    return this.customers.get(id) ?? null;
  }

  async findVendorByUserId(id: string) {
    return this.vendors.get(id) ?? null;
  }

  async findPublishedProductForBooking(id: string) {
    return this.products.get(id) ?? null;
  }

  async countConflictingBookings() {
    return this.conflictCount;
  }

  async listCustomerBookings(customerId: string) {
    return [...this.bookings.values()].filter(
      (b) => b.customerId === customerId,
    );
  }

  async listVendorBookings(vendorId: string) {
    return [...this.bookings.values()].filter((b) => b.vendorId === vendorId);
  }

  async findCustomerBooking(customerId: string, bookingId: string) {
    const item = this.bookings.get(bookingId);
    return item?.customerId === customerId ? item : null;
  }

  async findVendorBooking(vendorId: string, bookingId: string) {
    const item = this.bookings.get(bookingId);
    return item?.vendorId === vendorId ? item : null;
  }

  async createBooking(data: Prisma.BookingCreateInput) {
    const item = booking({
      id: `80000000-0000-4000-8000-00000000000${this.bookings.size + 1}`,
      productId: data.product.connect!.id!,
      vendorId: data.vendor.connect!.id!,
      customerId: data.customer.connect!.id!,
      status: data.status as Booking["status"],
      startsAt: data.startsAt as Date,
      endsAt: data.endsAt as Date,
      rentalDuration: data.rentalDuration as number,
      pricingModelSnapshot:
        data.pricingModelSnapshot as Booking["pricingModelSnapshot"],
      unitPriceSnapshot: data.unitPriceSnapshot as Prisma.Decimal,
      quantity: data.quantity as number,
      rentalSubtotal: data.rentalSubtotal as Prisma.Decimal,
      deliveryCharge: data.deliveryCharge as Prisma.Decimal,
      securityDeposit: data.securityDeposit as Prisma.Decimal,
      promotionalDiscount: data.promotionalDiscount as Prisma.Decimal,
      totalAmount: data.totalAmount as Prisma.Decimal,
      currency: data.currency as string,
    });
    this.bookings.set(item.id, item);
    return item;
  }

  async updateBookingStatus(
    bookingId: string,
    data: Prisma.BookingUpdateInput,
  ) {
    const item = this.bookings.get(bookingId)!;
    const updated = {
      ...item,
      status: (data.status ?? item.status) as Booking["status"],
      cancellationReason:
        data.cancellationReason !== undefined
          ? (data.cancellationReason as string | null)
          : item.cancellationReason,
      cancelledAt:
        data.cancelledAt !== undefined
          ? (data.cancelledAt as Date | null)
          : item.cancelledAt,
      rejectedReason:
        data.rejectedReason !== undefined
          ? (data.rejectedReason as string | null)
          : item.rejectedReason,
      rejectedAt:
        data.rejectedAt !== undefined
          ? (data.rejectedAt as Date | null)
          : item.rejectedAt,
      updatedAt: now,
    };
    this.bookings.set(bookingId, updated);
    return updated;
  }

  async createRental(bookingId: string) {
    const item = this.bookings.get(bookingId)!;
    const updated = {
      ...item,
      rental: {
        id: rentalId,
        bookingId,
        status: "CONFIRMED" as const,
        pickupDate: null,
        expectedReturnDate: item.endsAt,
        actualReturnDate: null,
        isLateReturn: false,
        damageNotes: null,
        additionalCharges: decimal("0.00"),
        additionalChargeReason: null,
        createdAt: now,
        updatedAt: now,
        events: [
          {
            id: "a0000000-0000-4000-8000-000000000001",
            rentalId,
            recordedByUserId: null,
            eventType: "RENTAL_CREATED",
            occurredAt: now,
            notes: "Rental created on booking confirmation.",
            metadata: null,
            createdAt: now,
          },
        ],
      },
    };
    this.bookings.set(bookingId, updated);
    return updated;
  }

  async updateRental(
    rentalId: string,
    data: Prisma.RentalUpdateInput,
    event: Prisma.RentalEventCreateWithoutRentalInput,
    bookingData?: Prisma.BookingUpdateInput,
  ) {
    const item = [...this.bookings.values()].find(
      (b) => b.rental?.id === rentalId,
    )!;
    const rental = item.rental!;
    const updatedRental = {
      ...rental,
      status: (data.status ?? rental.status) as Rental["status"],
      pickupDate:
        data.pickupDate !== undefined
          ? (data.pickupDate as Date | null)
          : rental.pickupDate,
      actualReturnDate:
        data.actualReturnDate !== undefined
          ? (data.actualReturnDate as Date | null)
          : rental.actualReturnDate,
      isLateReturn:
        data.isLateReturn !== undefined
          ? (data.isLateReturn as boolean)
          : rental.isLateReturn,
      damageNotes:
        data.damageNotes !== undefined
          ? (data.damageNotes as string | null)
          : rental.damageNotes,
      additionalCharges:
        data.additionalCharges !== undefined
          ? (data.additionalCharges as Prisma.Decimal)
          : rental.additionalCharges,
      additionalChargeReason:
        data.additionalChargeReason !== undefined
          ? (data.additionalChargeReason as string | null)
          : rental.additionalChargeReason,
      events: [
        ...rental.events,
        {
          id: `a0000000-0000-4000-8000-00000000000${rental.events.length + 1}`,
          rentalId,
          recordedByUserId: event.recordedBy as unknown as string | null,
          eventType: event.eventType as string,
          occurredAt: event.occurredAt as Date,
          notes: event.notes as string | null,
          metadata: null,
          createdAt: now,
        },
      ],
      updatedAt: now,
    };
    const updated = {
      ...item,
      status: bookingData?.status
        ? (bookingData.status as Booking["status"])
        : item.status,
      rental: updatedRental,
    };
    this.bookings.set(item.id, updated);
    return updated;
  }
}

function createService(
  options: { conflictCount?: number; bookingLimit?: number } = {},
) {
  const repository = new FakeBookingRepository();
  repository.conflictCount = options.conflictCount ?? 0;
  const service = new BookingService(
    repository as unknown as BookingRepository,
    async () => ({
      allowed: (options.bookingLimit ?? 10) > 0,
      used: 0,
      limit: options.bookingLimit ?? 10,
    }),
  );
  return { repository, service };
}

describe("BookingService", () => {
  describe("createMyBooking", () => {
    it("creates a booking for a published product", async () => {
      const { repository, service } = createService();
      repository.products.set(productId, product());

      const result = await service.createMyBooking(
        customerId,
        {
          productId,
          startsAt: "2026-09-11T00:00:00.000Z",
          endsAt: "2026-09-13T00:00:00.000Z",
          quantity: 1,
        },
        {},
      );

      expect(result.status).toBe("PENDING");
      expect(result.productId).toBe(productId);
      expect(result.rentalDuration).toBe(2);
      expect(repository.bookings.size).toBe(1);
    });

    it("rejects booking when product is not found", async () => {
      const { service } = createService();

      await expect(
        service.createMyBooking(
          customerId,
          {
            productId,
            startsAt: "2026-09-11T00:00:00.000Z",
            endsAt: "2026-09-13T00:00:00.000Z",
            quantity: 1,
          },
          {},
        ),
      ).rejects.toMatchObject({ statusCode: 404, code: "PRODUCT_NOT_FOUND" });
    });

    it("rejects booking when product is unavailable", async () => {
      const { repository, service } = createService();
      repository.products.set(
        productId,
        product({}, [
          {
            id: "70000000-0000-4000-8000-000000000002",
            productId,
            type: "AVAILABLE",
            startsAt: new Date("2026-09-10T00:00:00.000Z"),
            endsAt: new Date("2026-09-12T00:00:00.000Z"),
            reason: null,
            createdAt: now,
            updatedAt: now,
          },
        ]),
      );

      await expect(
        service.createMyBooking(
          customerId,
          {
            productId,
            startsAt: "2026-09-11T00:00:00.000Z",
            endsAt: "2026-09-14T00:00:00.000Z",
            quantity: 1,
          },
          {},
        ),
      ).rejects.toMatchObject({ statusCode: 409, code: "PRODUCT_UNAVAILABLE" });
    });

    it("rejects booking when there is a conflicting booking", async () => {
      const { repository, service } = createService({ conflictCount: 1 });
      repository.products.set(productId, product());

      await expect(
        service.createMyBooking(
          customerId,
          {
            productId,
            startsAt: "2026-09-11T00:00:00.000Z",
            endsAt: "2026-09-13T00:00:00.000Z",
            quantity: 1,
          },
          {},
        ),
      ).rejects.toMatchObject({ statusCode: 409, code: "BOOKING_CONFLICT" });
    });

    it("rejects booking for non-existent customer", async () => {
      const { repository, service } = createService();
      repository.products.set(productId, product());

      await expect(
        service.createMyBooking(
          "non-existent-customer",
          {
            productId,
            startsAt: "2026-09-11T00:00:00.000Z",
            endsAt: "2026-09-13T00:00:00.000Z",
            quantity: 1,
          },
          {},
        ),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: "CUSTOMER_PROFILE_NOT_FOUND",
      });
    });
  });

  describe("cancelMyBooking", () => {
    it("allows customer to cancel a pending booking", async () => {
      const { repository, service } = createService();
      const item = booking({ status: "PENDING" });
      repository.bookings.set(item.id, item);

      const result = await service.cancelMyBooking(customerId, item.id, {}, {});

      expect(result.status).toBe("CANCELLED");
      expect(result.cancelledAt).not.toBeNull();
    });

    it("allows customer to cancel a confirmed booking", async () => {
      const { repository, service } = createService();
      const item = booking({ status: "CONFIRMED" });
      repository.bookings.set(item.id, item);

      const result = await service.cancelMyBooking(customerId, item.id, {}, {});

      expect(result.status).toBe("CANCELLED");
    });

    it("prevents customer from cancelling another customer's booking", async () => {
      const { repository, service } = createService();
      const item = booking({ customerId: otherCustomerId });
      repository.bookings.set(item.id, item);

      await expect(
        service.cancelMyBooking(customerId, item.id, {}, {}),
      ).rejects.toMatchObject({ statusCode: 404, code: "BOOKING_NOT_FOUND" });
    });

    it("prevents cancelling a completed booking", async () => {
      const { repository, service } = createService();
      const item = booking({ status: "COMPLETED" });
      repository.bookings.set(item.id, item);

      await expect(
        service.cancelMyBooking(customerId, item.id, {}, {}),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: "INVALID_BOOKING_STATUS_TRANSITION",
      });
    });
  });

  describe("confirmVendorBooking", () => {
    it("allows vendor to confirm a pending booking", async () => {
      const { repository, service } = createService();
      const item = booking({ status: "PENDING" });
      repository.bookings.set(item.id, item);

      const result = await service.confirmVendorBooking(vendorId, item.id, {});

      expect(result.status).toBe("CONFIRMED");
      expect(result.rental).not.toBeNull();
      expect(result.rental?.status).toBe("CONFIRMED");
    });

    it("prevents confirming another vendor's booking", async () => {
      const { repository, service } = createService();
      const item = booking({
        vendorId: "30000000-0000-4000-8000-000000000099",
      });
      repository.bookings.set(item.id, item);

      await expect(
        service.confirmVendorBooking(vendorId, item.id, {}),
      ).rejects.toMatchObject({ statusCode: 404, code: "BOOKING_NOT_FOUND" });
    });

    it("prevents confirming a non-pending booking", async () => {
      const { repository, service } = createService();
      const item = booking({ status: "CONFIRMED" });
      repository.bookings.set(item.id, item);

      await expect(
        service.confirmVendorBooking(vendorId, item.id, {}),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: "INVALID_BOOKING_STATUS_TRANSITION",
      });
    });
  });

  describe("rejectVendorBooking", () => {
    it("allows vendor to reject a pending booking", async () => {
      const { repository, service } = createService();
      const item = booking({ status: "PENDING" });
      repository.bookings.set(item.id, item);

      const result = await service.rejectVendorBooking(
        vendorId,
        item.id,
        { reason: "Not available" },
        {},
      );

      expect(result.status).toBe("REJECTED");
      expect(result.rejectedReason).toBe("Not available");
    });

    it("prevents rejecting a confirmed booking", async () => {
      const { repository, service } = createService();
      const item = booking({ status: "CONFIRMED" });
      repository.bookings.set(item.id, item);

      await expect(
        service.rejectVendorBooking(
          vendorId,
          item.id,
          { reason: "Too late" },
          {},
        ),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: "INVALID_BOOKING_STATUS_TRANSITION",
      });
    });
  });

  describe("rental lifecycle", () => {
    it("allows vendor to start a confirmed rental", async () => {
      const { repository, service } = createService();
      const item = booking({
        status: "CONFIRMED",
        rental: {
          id: rentalId,
          bookingId,
          status: "CONFIRMED",
          pickupDate: null,
          expectedReturnDate: new Date("2026-09-13T00:00:00.000Z"),
          actualReturnDate: null,
          isLateReturn: false,
          damageNotes: null,
          additionalCharges: decimal("0.00"),
          additionalChargeReason: null,
          createdAt: now,
          updatedAt: now,
          events: [],
        },
      });
      repository.bookings.set(item.id, item);

      const result = await service.startVendorRental(vendorId, item.id, {});

      expect(result.rental?.status).toBe("ACTIVE");
      expect(result.rental?.pickupDate).not.toBeNull();
    });

    it("allows vendor to complete an active rental", async () => {
      const { repository, service } = createService();
      const item = booking({
        status: "ACTIVE",
        rental: {
          id: rentalId,
          bookingId,
          status: "ACTIVE",
          pickupDate: new Date("2026-09-11T00:00:00.000Z"),
          expectedReturnDate: new Date("2026-09-13T00:00:00.000Z"),
          actualReturnDate: null,
          isLateReturn: false,
          damageNotes: null,
          additionalCharges: decimal("0.00"),
          additionalChargeReason: null,
          createdAt: now,
          updatedAt: now,
          events: [],
        },
      });
      repository.bookings.set(item.id, item);

      const result = await service.completeVendorRental(
        vendorId,
        item.id,
        { actualReturnDate: "2026-09-13T00:00:00.000Z" },
        {},
      );

      expect(result.rental?.status).toBe("COMPLETED");
      expect(result.rental?.actualReturnDate).not.toBeNull();
      expect(result.rental?.isLateReturn).toBe(false);
    });

    it("detects late return when completing rental", async () => {
      const { repository, service } = createService();
      const item = booking({
        status: "ACTIVE",
        rental: {
          id: rentalId,
          bookingId,
          status: "ACTIVE",
          pickupDate: new Date("2026-09-11T00:00:00.000Z"),
          expectedReturnDate: new Date("2026-09-13T00:00:00.000Z"),
          actualReturnDate: null,
          isLateReturn: false,
          damageNotes: null,
          additionalCharges: decimal("0.00"),
          additionalChargeReason: null,
          createdAt: now,
          updatedAt: now,
          events: [],
        },
      });
      repository.bookings.set(item.id, item);

      const result = await service.completeVendorRental(
        vendorId,
        item.id,
        { actualReturnDate: "2026-09-14T00:00:00.000Z" },
        {},
      );

      expect(result.rental?.isLateReturn).toBe(true);
    });

    it("prevents starting a non-confirmed rental", async () => {
      const { repository, service } = createService();
      const item = booking({
        status: "PENDING",
        rental: null,
      });
      repository.bookings.set(item.id, item);

      await expect(
        service.startVendorRental(vendorId, item.id, {}),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: "INVALID_RENTAL_STATUS_TRANSITION",
      });
    });

    it("prevents completing a non-active rental", async () => {
      const { repository, service } = createService();
      const item = booking({
        status: "CONFIRMED",
        rental: {
          id: rentalId,
          bookingId,
          status: "CONFIRMED",
          pickupDate: null,
          expectedReturnDate: new Date("2026-09-13T00:00:00.000Z"),
          actualReturnDate: null,
          isLateReturn: false,
          damageNotes: null,
          additionalCharges: decimal("0.00"),
          additionalChargeReason: null,
          createdAt: now,
          updatedAt: now,
          events: [],
        },
      });
      repository.bookings.set(item.id, item);

      await expect(
        service.completeVendorRental(vendorId, item.id, {}, {}),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: "INVALID_RENTAL_STATUS_TRANSITION",
      });
    });
  });

  describe("authorization", () => {
    it("prevents vendor from viewing customer bookings", async () => {
      const { service } = createService();

      await expect(service.listMyBookings(vendorId)).rejects.toMatchObject({
        statusCode: 404,
        code: "CUSTOMER_PROFILE_NOT_FOUND",
      });
    });

    it("prevents customer from viewing vendor bookings", async () => {
      const { service } = createService();

      await expect(
        service.listVendorBookings(customerId),
      ).rejects.toMatchObject({
        statusCode: 404,
        code: "VENDOR_PROFILE_NOT_FOUND",
      });
    });
  });
});
