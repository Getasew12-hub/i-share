import { Prisma } from "@prisma/client";

import { AppError } from "../errors/app-error.js";
import { prismaBookingRepository } from "../repositories/booking-repository.js";
import type { PaymentRepository } from "../repositories/payment-repository.js";
import { prismaPaymentRepository } from "../repositories/payment-repository.js";
import type { CreateBookingPaymentInput } from "../schemas/payment-schemas.js";

type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

function decimal(value: Prisma.Decimal.Value) {
  return new Prisma.Decimal(value);
}

export class PaymentService {
  constructor(private readonly repository: PaymentRepository) {}

  async createBookingPayment(
    userId: string,
    input: CreateBookingPaymentInput,
    context: RequestContext,
  ) {
    // Verify customer exists
    const customer = await prismaBookingRepository.findCustomerByUserId(userId);
    if (!customer) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "You must be a customer to make payments.",
      );
    }

    // Find booking and validate customer ownership
    const booking = await prismaBookingRepository.findCustomerBooking(
      customer.id,
      input.bookingId,
    );
    if (!booking) {
      throw new AppError(404, "BOOKING_NOT_FOUND", "Booking not found.");
    }

    // Verify booking is in a valid state for payment
    if (booking.status !== "CONFIRMED") {
      throw new AppError(
        409,
        "INVALID_BOOKING_STATUS",
        `Only confirmed bookings can be paid. Current status: ${booking.status}`,
      );
    }

    // Check for existing successful payment
    const existingPayment = await this.repository.findByBookingId(booking.id);
    if (existingPayment && existingPayment.status === "SUCCEEDED") {
      throw new AppError(
        409,
        "PAYMENT_ALREADY_SUCCEEDED",
        "This booking has already been paid.",
      );
    }

    // Create payment record with PENDING status
    // Amount is server-calculated from booking, never trusting client
    const payment = await this.repository.create({
      booking: { connect: { id: booking.id } },
      provider: input.provider as any,
      methodLabel: input.methodLabel,
      status: "PENDING",
      amount: booking.totalAmount,
      currency: booking.currency,
    });

    return payment;
  }

  async getPaymentDetails(userId: string, paymentId: string) {
    const payment = await this.repository.findById(paymentId);
    if (!payment) {
      throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
    }

    // Verify user owns this payment (through booking)
    if (payment.bookingId) {
      const customer =
        await prismaBookingRepository.findCustomerByUserId(userId);
      if (!customer) {
        throw new AppError(403, "FORBIDDEN", "Cannot access this payment.");
      }

      const booking = await prismaBookingRepository.findCustomerBooking(
        customer.id,
        payment.bookingId,
      );
      if (!booking) {
        throw new AppError(403, "FORBIDDEN", "Cannot access this payment.");
      }
    } else {
      throw new AppError(403, "FORBIDDEN", "Cannot access this payment.");
    }

    return payment;
  }

  async listMyPayments(userId: string, page: number, limit: number) {
    const customer = await prismaBookingRepository.findCustomerByUserId(userId);
    if (!customer) {
      throw new AppError(403, "FORBIDDEN", "You must be a customer.");
    }

    const offset = (page - 1) * limit;
    const { payments, total } = await this.repository.listByCustomer(
      customer.id,
      limit,
      offset,
    );

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async listVendorPayments(userId: string, page: number, limit: number) {
    const vendor = await prismaBookingRepository.findVendorByUserId(userId);
    if (!vendor) {
      throw new AppError(403, "FORBIDDEN", "You must be a vendor.");
    }

    const offset = (page - 1) * limit;
    const { payments, total } = await this.repository.listByVendor(
      vendor.id,
      limit,
      offset,
    );

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export const paymentService = new PaymentService(prismaPaymentRepository);
