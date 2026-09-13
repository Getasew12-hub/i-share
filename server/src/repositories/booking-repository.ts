import type {
  Booking,
  CustomerProfile,
  Prisma,
  Product,
  ProductAvailabilityPeriod,
  Rental,
  RentalEvent,
  VendorProfile,
} from "@prisma/client";

import { prisma } from "../config/prisma.js";
import type { AuditInput } from "./vendor-repository.js";

const bookingInclude = {
  product: {
    include: {
      category: true,
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  },
  vendor: true,
  customer: true,
  rental: {
    include: {
      events: {
        orderBy: { occurredAt: "asc" },
      },
    },
  },
} satisfies Prisma.BookingInclude;

export type BookingWithRelations = Booking & {
  product: Product & {
    category: { id: string; name: string; slug: string };
    images: { id: string; url: string; altText: string | null }[];
  };
  vendor: VendorProfile;
  customer: CustomerProfile;
  rental: (Rental & { events: RentalEvent[] }) | null;
};

export type BookingRepository = {
  findCustomerByUserId(userId: string): Promise<{ id: string } | null>;
  findVendorByUserId(userId: string): Promise<{ id: string } | null>;
  findPublishedProductForBooking(productId: string): Promise<
    | (Product & {
        availabilityPeriods: ProductAvailabilityPeriod[];
        vendor: Pick<VendorProfile, "id" | "status" | "verificationStatus">;
      })
    | null
  >;
  countConflictingBookings(
    productId: string,
    startsAt: Date,
    endsAt: Date,
    excludeBookingId?: string,
  ): Promise<number>;
  listCustomerBookings(customerId: string): Promise<BookingWithRelations[]>;
  listVendorBookings(vendorId: string): Promise<BookingWithRelations[]>;
  findCustomerBooking(
    customerId: string,
    bookingId: string,
  ): Promise<BookingWithRelations | null>;
  findVendorBooking(
    vendorId: string,
    bookingId: string,
  ): Promise<BookingWithRelations | null>;
  createBooking(
    data: Prisma.BookingCreateInput,
    audit?: AuditInput,
  ): Promise<BookingWithRelations>;
  updateBookingStatus(
    bookingId: string,
    data: Prisma.BookingUpdateInput,
    audit?: AuditInput,
  ): Promise<BookingWithRelations>;
  createRental(
    bookingId: string,
    data: Prisma.RentalCreateWithoutBookingInput,
    event: Prisma.RentalEventCreateWithoutRentalInput,
    audit?: AuditInput,
  ): Promise<BookingWithRelations>;
  updateRental(
    rentalId: string,
    data: Prisma.RentalUpdateInput,
    event: Prisma.RentalEventCreateWithoutRentalInput,
    bookingData?: Prisma.BookingUpdateInput,
    audit?: AuditInput,
  ): Promise<BookingWithRelations>;
};

function createAudit(tx: Prisma.TransactionClient, input?: AuditInput) {
  if (!input) {
    return Promise.resolve();
  }

  return tx.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

export const prismaBookingRepository: BookingRepository = {
  findCustomerByUserId(userId) {
    return prisma.customerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
  },

  findVendorByUserId(userId) {
    return prisma.vendorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
  },

  findPublishedProductForBooking(productId) {
    return prisma.product.findFirst({
      where: { id: productId, status: "PUBLISHED" },
      include: {
        availabilityPeriods: true,
        vendor: {
          select: {
            id: true,
            status: true,
            verificationStatus: true,
          },
        },
      },
    });
  },

  countConflictingBookings(productId, startsAt, endsAt, excludeBookingId) {
    return prisma.booking.count({
      where: {
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        productId,
        status: { in: ["CONFIRMED", "ACTIVE"] },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
  },

  listCustomerBookings(customerId) {
    return prisma.booking.findMany({
      where: { customerId },
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  listVendorBookings(vendorId) {
    return prisma.booking.findMany({
      where: { vendorId },
      include: bookingInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  findCustomerBooking(customerId, bookingId) {
    return prisma.booking.findFirst({
      where: { id: bookingId, customerId },
      include: bookingInclude,
    });
  },

  findVendorBooking(vendorId, bookingId) {
    return prisma.booking.findFirst({
      where: { id: bookingId, vendorId },
      include: bookingInclude,
    });
  },

  async createBooking(data, audit) {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data,
        include: bookingInclude,
      });

      await createAudit(
        tx,
        audit ? { ...audit, resourceId: booking.id } : undefined,
      );

      return booking;
    });
  },

  async updateBookingStatus(bookingId, data, audit) {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id: bookingId },
        data,
        include: bookingInclude,
      });

      await createAudit(tx, audit);

      return booking;
    });
  },

  async createRental(bookingId, data, event, audit) {
    return prisma.$transaction(async (tx) => {
      await tx.rental.create({
        data: {
          ...data,
          booking: { connect: { id: bookingId } },
          events: { create: event },
        },
      });

      await createAudit(tx, audit);

      return tx.booking.findUniqueOrThrow({
        where: { id: bookingId },
        include: bookingInclude,
      });
    });
  },

  async updateRental(rentalId, data, event, bookingData, audit) {
    return prisma.$transaction(async (tx) => {
      const rental = await tx.rental.update({
        where: { id: rentalId },
        data: {
          ...data,
          events: { create: event },
        },
      });

      if (bookingData) {
        await tx.booking.update({
          where: { id: rental.bookingId },
          data: bookingData,
        });
      }

      await createAudit(tx, audit);

      return tx.booking.findUniqueOrThrow({
        where: { id: rental.bookingId },
        include: bookingInclude,
      });
    });
  },
};
