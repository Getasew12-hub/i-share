import {
  Prisma,
  type BookingStatus,
  type PricingModel,
  type ProductAvailabilityPeriod,
} from "@prisma/client";

import { AppError } from "../errors/app-error.js";
import type {
  BookingRepository,
  BookingWithRelations,
} from "../repositories/booking-repository.js";
import { prismaBookingRepository } from "../repositories/booking-repository.js";
import type {
  CancelBookingInput,
  CompleteRentalInput,
  CreateBookingInput,
  RejectBookingInput,
} from "../schemas/booking-schemas.js";
import { checkActiveBookingLimit } from "./subscription-service.js";

type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

type ActiveBookingLimitCheck = (vendorId: string) => Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}>;

const customerCancellableStatuses: BookingStatus[] = ["PENDING", "CONFIRMED"];
const vendorCancellableStatuses: BookingStatus[] = ["PENDING", "CONFIRMED"];

function decimal(value: Prisma.Decimal.Value) {
  return new Prisma.Decimal(value);
}

function overlaps(
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date,
) {
  return firstStart < secondEnd && firstEnd > secondStart;
}

function unitsForRange(
  startsAt: Date,
  endsAt: Date,
  pricingModel: PricingModel,
) {
  const milliseconds = endsAt.getTime() - startsAt.getTime();
  const hours = milliseconds / 3_600_000;
  const days = milliseconds / 86_400_000;

  if (pricingModel === "HOURLY") {
    return Math.max(1, Math.ceil(hours));
  }

  if (pricingModel === "WEEKLY") {
    return Math.max(1, Math.ceil(days / 7));
  }

  if (pricingModel === "MONTHLY") {
    return Math.max(1, Math.ceil(days / 30));
  }

  return Math.max(1, Math.ceil(days));
}

export class BookingService {
  constructor(
    private readonly repository: BookingRepository,
    private readonly activeBookingLimitCheck: ActiveBookingLimitCheck,
  ) {}

  async createMyBooking(
    userId: string,
    input: CreateBookingInput,
    context: RequestContext,
  ) {
    const customer = await this.requireCustomer(userId);
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    if (input.quantity !== 1) {
      throw new AppError(
        400,
        "INVALID_BOOKING_QUANTITY",
        "Only quantity 1 is supported until product inventory quantity is defined.",
      );
    }

    const product = await this.repository.findPublishedProductForBooking(
      input.productId,
    );

    if (!product) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    }

    if (
      product.vendor.status !== "APPROVED" ||
      product.vendor.verificationStatus !== "APPROVED"
    ) {
      throw new AppError(
        409,
        "PRODUCT_NOT_RENTABLE",
        "This product is not currently rentable.",
      );
    }

    this.requireAvailability(product.availabilityPeriods, startsAt, endsAt);
    await this.requireNoConflictingBookings(product.id, startsAt, endsAt);

    const pricing = this.calculatePrice(
      product,
      startsAt,
      endsAt,
      input.quantity,
    );

    const booking = await this.repository.createBooking(
      {
        product: { connect: { id: product.id } },
        vendor: { connect: { id: product.vendorId } },
        customer: { connect: { id: customer.id } },
        status: "PENDING",
        startsAt,
        endsAt,
        rentalDuration: pricing.rentalDuration,
        pricingModelSnapshot: product.pricingModel,
        unitPriceSnapshot: pricing.unitPrice,
        quantity: input.quantity,
        rentalSubtotal: pricing.rentalSubtotal,
        deliveryCharge: pricing.deliveryCharge,
        securityDeposit: pricing.securityDeposit,
        promotionalDiscount: decimal(0),
        totalAmount: pricing.totalAmount,
        currency: product.currency,
      },
      {
        actorUserId: userId,
        action: "CREATE",
        resourceType: "Booking",
        metadata: {
          event: "booking_created",
          productId: product.id,
        },
        ...context,
      },
    );

    return this.toBookingResponse(booking);
  }

  async listMyBookings(userId: string) {
    const customer = await this.requireCustomer(userId);
    const bookings = await this.repository.listCustomerBookings(customer.id);

    return bookings.map((booking) => this.toBookingResponse(booking));
  }

  async getMyBooking(userId: string, bookingId: string) {
    const booking = await this.requireCustomerBooking(userId, bookingId);

    return this.toBookingResponse(booking);
  }

  async cancelMyBooking(
    userId: string,
    bookingId: string,
    input: CancelBookingInput,
    context: RequestContext,
  ) {
    const booking = await this.requireCustomerBooking(userId, bookingId);

    if (!customerCancellableStatuses.includes(booking.status)) {
      throw new AppError(
        409,
        "INVALID_BOOKING_STATUS_TRANSITION",
        "This booking cannot be cancelled by the customer.",
      );
    }

    const updated = await this.repository.updateBookingStatus(
      booking.id,
      {
        status: "CANCELLED",
        cancellationReason: input.reason,
        cancelledAt: new Date(),
      },
      {
        actorUserId: userId,
        action: "STATUS_CHANGE",
        resourceType: "Booking",
        resourceId: booking.id,
        metadata: {
          event: "booking_cancelled_by_customer",
          from: booking.status,
        },
        ...context,
      },
    );

    return this.toBookingResponse(updated);
  }

  async listVendorBookings(userId: string) {
    const vendor = await this.requireVendor(userId);
    const bookings = await this.repository.listVendorBookings(vendor.id);

    return bookings.map((booking) => this.toBookingResponse(booking));
  }

  async getVendorBooking(userId: string, bookingId: string) {
    const booking = await this.requireVendorBooking(userId, bookingId);

    return this.toBookingResponse(booking);
  }

  async confirmVendorBooking(
    userId: string,
    bookingId: string,
    context: RequestContext,
  ) {
    const booking = await this.requireVendorBooking(userId, bookingId);

    if (booking.status !== "PENDING") {
      throw new AppError(
        409,
        "INVALID_BOOKING_STATUS_TRANSITION",
        "Only pending bookings can be confirmed.",
      );
    }

    await this.requireActiveBookingCapacity(booking.vendorId);
    await this.requireNoConflictingBookings(
      booking.productId,
      booking.startsAt,
      booking.endsAt,
      booking.id,
    );

    const confirmed = await this.repository.updateBookingStatus(
      booking.id,
      { status: "CONFIRMED" },
      {
        actorUserId: userId,
        action: "STATUS_CHANGE",
        resourceType: "Booking",
        resourceId: booking.id,
        metadata: {
          event: "booking_confirmed",
          from: booking.status,
        },
        ...context,
      },
    );

    const withRental = await this.repository.createRental(
      confirmed.id,
      {
        status: "CONFIRMED",
        expectedReturnDate: confirmed.endsAt,
      },
      this.rentalEvent(
        userId,
        "RENTAL_CREATED",
        "Rental created on booking confirmation.",
      ),
      {
        actorUserId: userId,
        action: "CREATE",
        resourceType: "Rental",
        resourceId: confirmed.id,
        metadata: {
          event: "rental_created",
          bookingId: confirmed.id,
        },
        ...context,
      },
    );

    return this.toBookingResponse(withRental);
  }

  async rejectVendorBooking(
    userId: string,
    bookingId: string,
    input: RejectBookingInput,
    context: RequestContext,
  ) {
    const booking = await this.requireVendorBooking(userId, bookingId);

    if (booking.status !== "PENDING") {
      throw new AppError(
        409,
        "INVALID_BOOKING_STATUS_TRANSITION",
        "Only pending bookings can be rejected.",
      );
    }

    const updated = await this.repository.updateBookingStatus(
      booking.id,
      {
        status: "REJECTED",
        rejectedReason: input.reason,
        rejectedAt: new Date(),
      },
      {
        actorUserId: userId,
        action: "REJECT",
        resourceType: "Booking",
        resourceId: booking.id,
        metadata: {
          event: "booking_rejected",
        },
        ...context,
      },
    );

    return this.toBookingResponse(updated);
  }

  async cancelVendorBooking(
    userId: string,
    bookingId: string,
    input: CancelBookingInput,
    context: RequestContext,
  ) {
    const booking = await this.requireVendorBooking(userId, bookingId);

    if (!vendorCancellableStatuses.includes(booking.status)) {
      throw new AppError(
        409,
        "INVALID_BOOKING_STATUS_TRANSITION",
        "This booking cannot be cancelled by the vendor.",
      );
    }

    const updated = await this.repository.updateBookingStatus(
      booking.id,
      {
        status: "CANCELLED",
        cancellationReason: input.reason,
        cancelledAt: new Date(),
      },
      {
        actorUserId: userId,
        action: "STATUS_CHANGE",
        resourceType: "Booking",
        resourceId: booking.id,
        metadata: {
          event: "booking_cancelled_by_vendor",
          from: booking.status,
        },
        ...context,
      },
    );

    return this.toBookingResponse(updated);
  }

  async startVendorRental(
    userId: string,
    bookingId: string,
    context: RequestContext,
  ) {
    const booking = await this.requireVendorBooking(userId, bookingId);

    if (booking.status !== "CONFIRMED" || !booking.rental) {
      throw new AppError(
        409,
        "INVALID_RENTAL_STATUS_TRANSITION",
        "Only confirmed bookings with rentals can be started.",
      );
    }

    if (!["CONFIRMED", "PAID"].includes(booking.rental.status)) {
      throw new AppError(
        409,
        "INVALID_RENTAL_STATUS_TRANSITION",
        "This rental cannot be started from its current status.",
      );
    }

    const updated = await this.repository.updateRental(
      booking.rental.id,
      {
        status: "ACTIVE",
        pickupDate: new Date(),
      },
      this.rentalEvent(userId, "RENTAL_STARTED", "Rental marked active."),
      { status: "ACTIVE" },
      {
        actorUserId: userId,
        action: "STATUS_CHANGE",
        resourceType: "Rental",
        resourceId: booking.rental.id,
        metadata: {
          event: "rental_started",
          bookingId: booking.id,
        },
        ...context,
      },
    );

    return this.toBookingResponse(updated);
  }

  async completeVendorRental(
    userId: string,
    bookingId: string,
    input: CompleteRentalInput,
    context: RequestContext,
  ) {
    const booking = await this.requireVendorBooking(userId, bookingId);

    if (booking.status !== "ACTIVE" || !booking.rental) {
      throw new AppError(
        409,
        "INVALID_RENTAL_STATUS_TRANSITION",
        "Only active rentals can be completed.",
      );
    }

    if (!["ACTIVE", "IN_PROGRESS"].includes(booking.rental.status)) {
      throw new AppError(
        409,
        "INVALID_RENTAL_STATUS_TRANSITION",
        "This rental cannot be completed from its current status.",
      );
    }

    const actualReturnDate = input.actualReturnDate
      ? new Date(input.actualReturnDate)
      : new Date();
    const updated = await this.repository.updateRental(
      booking.rental.id,
      {
        status: "COMPLETED",
        actualReturnDate,
        isLateReturn: actualReturnDate > booking.rental.expectedReturnDate,
        damageNotes: input.damageNotes,
        additionalCharges: input.additionalCharges
          ? decimal(input.additionalCharges)
          : undefined,
        additionalChargeReason: input.additionalChargeReason,
      },
      this.rentalEvent(
        userId,
        "RENTAL_COMPLETED",
        "Rental returned and completed.",
      ),
      { status: "COMPLETED" },
      {
        actorUserId: userId,
        action: "STATUS_CHANGE",
        resourceType: "Rental",
        resourceId: booking.rental.id,
        metadata: {
          event: "rental_completed",
          bookingId: booking.id,
        },
        ...context,
      },
    );

    return this.toBookingResponse(updated);
  }

  private async requireCustomer(userId: string) {
    const customer = await this.repository.findCustomerByUserId(userId);

    if (!customer) {
      throw new AppError(
        404,
        "CUSTOMER_PROFILE_NOT_FOUND",
        "Customer profile not found.",
      );
    }

    return customer;
  }

  private async requireVendor(userId: string) {
    const vendor = await this.repository.findVendorByUserId(userId);

    if (!vendor) {
      throw new AppError(
        404,
        "VENDOR_PROFILE_NOT_FOUND",
        "Vendor profile not found.",
      );
    }

    return vendor;
  }

  private async requireCustomerBooking(userId: string, bookingId: string) {
    const customer = await this.requireCustomer(userId);
    const booking = await this.repository.findCustomerBooking(
      customer.id,
      bookingId,
    );

    if (!booking) {
      throw new AppError(404, "BOOKING_NOT_FOUND", "Booking not found.");
    }

    return booking;
  }

  private async requireVendorBooking(userId: string, bookingId: string) {
    const vendor = await this.requireVendor(userId);
    const booking = await this.repository.findVendorBooking(
      vendor.id,
      bookingId,
    );

    if (!booking) {
      throw new AppError(404, "BOOKING_NOT_FOUND", "Booking not found.");
    }

    return booking;
  }

  private requireAvailability(
    periods: ProductAvailabilityPeriod[],
    startsAt: Date,
    endsAt: Date,
  ) {
    const available = periods.some(
      (period) =>
        period.type === "AVAILABLE" &&
        period.startsAt <= startsAt &&
        period.endsAt >= endsAt,
    );

    const unavailable = periods.some(
      (period) =>
        ["RESERVED", "MAINTENANCE", "BLOCKED"].includes(period.type) &&
        overlaps(period.startsAt, period.endsAt, startsAt, endsAt),
    );

    if (!available || unavailable) {
      throw new AppError(
        409,
        "PRODUCT_UNAVAILABLE",
        "Product is unavailable for the requested period.",
      );
    }
  }

  private async requireNoConflictingBookings(
    productId: string,
    startsAt: Date,
    endsAt: Date,
    excludeBookingId?: string,
  ) {
    const conflicts = await this.repository.countConflictingBookings(
      productId,
      startsAt,
      endsAt,
      excludeBookingId,
    );

    if (conflicts > 0) {
      throw new AppError(
        409,
        "BOOKING_CONFLICT",
        "Product is already booked for the requested period.",
      );
    }
  }

  private async requireActiveBookingCapacity(vendorId: string) {
    const capacity = await this.activeBookingLimitCheck(vendorId);

    if (!capacity.allowed) {
      throw new AppError(
        403,
        "ACTIVE_BOOKING_LIMIT_EXCEEDED",
        `Active booking limit reached for the active subscription (${capacity.used}/${capacity.limit}).`,
      );
    }
  }

  private calculatePrice(
    product: NonNullable<
      Awaited<ReturnType<BookingRepository["findPublishedProductForBooking"]>>
    >,
    startsAt: Date,
    endsAt: Date,
    quantity: number,
  ) {
    const rateByModel = {
      HOURLY: product.hourlyRate,
      DAILY: product.dailyRate,
      WEEKLY: product.weeklyRate,
      MONTHLY: product.monthlyRate,
    };
    const unitPrice = rateByModel[product.pricingModel];

    if (!unitPrice) {
      throw new AppError(
        409,
        "PRODUCT_PRICE_UNAVAILABLE",
        "Product pricing is incomplete.",
      );
    }

    const rentalDuration = unitsForRange(
      startsAt,
      endsAt,
      product.pricingModel,
    );
    const rentalSubtotal = unitPrice.mul(rentalDuration).mul(quantity);
    const deliveryCharge = product.deliveryAvailable
      ? product.deliveryCharge
      : decimal(0);
    const securityDeposit = product.securityDeposit;

    return {
      rentalDuration,
      unitPrice,
      rentalSubtotal,
      deliveryCharge,
      securityDeposit,
      totalAmount: rentalSubtotal.add(deliveryCharge).add(securityDeposit),
    };
  }

  private rentalEvent(userId: string, eventType: string, notes: string) {
    return {
      recordedBy: { connect: { id: userId } },
      eventType,
      occurredAt: new Date(),
      notes,
    };
  }

  private toBookingResponse(booking: BookingWithRelations) {
    return {
      id: booking.id,
      productId: booking.productId,
      vendorId: booking.vendorId,
      customerId: booking.customerId,
      status: booking.status,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
      rentalDuration: booking.rentalDuration,
      pricingModelSnapshot: booking.pricingModelSnapshot,
      unitPriceSnapshot: booking.unitPriceSnapshot.toString(),
      quantity: booking.quantity,
      rentalSubtotal: booking.rentalSubtotal.toString(),
      deliveryCharge: booking.deliveryCharge.toString(),
      securityDeposit: booking.securityDeposit.toString(),
      promotionalDiscount: booking.promotionalDiscount.toString(),
      totalAmount: booking.totalAmount.toString(),
      currency: booking.currency,
      cancellationReason: booking.cancellationReason,
      cancelledAt: booking.cancelledAt?.toISOString() ?? null,
      rejectedReason: booking.rejectedReason,
      rejectedAt: booking.rejectedAt?.toISOString() ?? null,
      expiresAt: booking.expiresAt?.toISOString() ?? null,
      product: {
        id: booking.product.id,
        name: booking.product.name,
        pricingModel: booking.product.pricingModel,
        city: booking.product.city,
        country: booking.product.country,
        category: booking.product.category,
        imageUrl: booking.product.images[0]?.url ?? null,
      },
      vendor: {
        id: booking.vendor.id,
        displayName: booking.vendor.displayName,
      },
      customer: {
        id: booking.customer.id,
        displayName: booking.customer.displayName,
      },
      rental: booking.rental
        ? {
            id: booking.rental.id,
            bookingId: booking.rental.bookingId,
            status: booking.rental.status,
            pickupDate: booking.rental.pickupDate?.toISOString() ?? null,
            expectedReturnDate: booking.rental.expectedReturnDate.toISOString(),
            actualReturnDate:
              booking.rental.actualReturnDate?.toISOString() ?? null,
            isLateReturn: booking.rental.isLateReturn,
            damageNotes: booking.rental.damageNotes,
            additionalCharges: booking.rental.additionalCharges.toString(),
            additionalChargeReason: booking.rental.additionalChargeReason,
            events: booking.rental.events.map((event) => ({
              id: event.id,
              eventType: event.eventType,
              occurredAt: event.occurredAt.toISOString(),
              notes: event.notes,
            })),
            createdAt: booking.rental.createdAt.toISOString(),
            updatedAt: booking.rental.updatedAt.toISOString(),
          }
        : null,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    };
  }
}

export const bookingService = new BookingService(
  prismaBookingRepository,
  checkActiveBookingLimit,
);
