import { Prisma } from "@prisma/client";

import { AppError } from "../errors/app-error.js";
import type { InvoiceRepository } from "../repositories/invoice-repository.js";
import { prismaInvoiceRepository } from "../repositories/invoice-repository.js";
import type { PaymentRepository } from "../repositories/payment-repository.js";
import { prismaPaymentRepository } from "../repositories/payment-repository.js";
import type {
  BookingRepository,
  BookingWithRelations,
} from "../repositories/booking-repository.js";
import { prismaBookingRepository } from "../repositories/booking-repository.js";
import { prisma } from "../config/prisma.js";

function money(value: Prisma.Decimal) {
  return value.toFixed(2);
}

export class InvoiceService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly bookingRepository: BookingRepository,
  ) {}

  async createInvoice(bookingId: string, paymentId: string) {
    const [booking, payment] = await Promise.all([
      this.requireBooking(bookingId),
      this.paymentRepository.findById(paymentId),
    ]);

    if (!payment) {
      throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found.");
    }

    if (payment.bookingId !== bookingId) {
      throw new AppError(
        400,
        "PAYMENT_BOOKING_MISMATCH",
        "Payment does not belong to this booking.",
      );
    }

    const existingInvoice =
      await this.invoiceRepository.findByBookingId(bookingId);
    if (existingInvoice) {
      throw new AppError(
        409,
        "INVOICE_ALREADY_EXISTS",
        "Invoice already exists for this booking.",
      );
    }

    const invoiceNumber = this.generateInvoiceNumber();

    const subtotalAmount = booking.rentalSubtotal
      .add(booking.deliveryCharge)
      .add(booking.securityDeposit);
    const discountAmount = booking.promotionalDiscount;
    const totalAmount = booking.totalAmount;

    const customerSnapshot = {
      id: booking.customer.id,
      displayName: booking.customer.displayName,
      email: booking.customer.email,
    };

    const vendorSnapshot = {
      id: booking.vendor.id,
      displayName: booking.vendor.displayName,
      email: booking.vendor.email,
    };

    const productSnapshot = {
      id: booking.product.id,
      name: booking.product.name,
      slug: booking.product.slug,
    };

    const pricingSnapshot = {
      pricingModel: booking.pricingModelSnapshot,
      unitPrice: money(booking.unitPriceSnapshot),
      rentalDuration: booking.rentalDuration,
      rentalSubtotal: money(booking.rentalSubtotal),
      deliveryCharge: money(booking.deliveryCharge),
      securityDeposit: money(booking.securityDeposit),
      promotionalDiscount: money(booking.promotionalDiscount),
      currency: booking.currency,
    };

    const invoice = await this.invoiceRepository.create({
      booking: { connect: { id: bookingId } },
      payment: { connect: { id: paymentId } },
      invoiceNumber,
      status: "ISSUED",
      issuedAt: new Date(),
      customerSnapshot,
      vendorSnapshot,
      productSnapshot,
      pricingSnapshot,
      subtotalAmount,
      discountAmount,
      totalAmount,
      currency: booking.currency,
    });

    return invoice;
  }

  async getInvoiceDetails(userId: string, invoiceId: string) {
    const invoice = await this.invoiceRepository.findById(invoiceId);

    if (!invoice) {
      throw new AppError(404, "INVOICE_NOT_FOUND", "Invoice not found.");
    }

    const booking = await this.bookingRepository.findCustomerBooking(
      "",
      invoice.bookingId,
    );

    if (!booking) {
      throw new AppError(
        404,
        "BOOKING_NOT_FOUND",
        "Associated booking not found.",
      );
    }

    if (
      booking.customer.userId !== userId &&
      booking.vendor.userId !== userId
    ) {
      throw new AppError(
        403,
        "INVOICE_ACCESS_DENIED",
        "You do not have access to this invoice.",
      );
    }

    return invoice;
  }

  async listMyInvoices(userId: string, page: number, limit: number) {
    const customer = await this.requireCustomer(userId);

    const offset = (page - 1) * limit;
    const { invoices, total } = await this.invoiceRepository.listByCustomer(
      customer.id,
      limit,
      offset,
    );

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listVendorInvoices(userId: string, page: number, limit: number) {
    const vendor = await this.requireVendor(userId);

    const offset = (page - 1) * limit;
    const { invoices, total } = await this.invoiceRepository.listByVendor(
      vendor.id,
      limit,
      offset,
    );

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async requireCustomer(userId: string): Promise<{ id: string }> {
    const customer = await this.bookingRepository.findCustomerByUserId(userId);

    if (!customer) {
      throw new AppError(
        404,
        "CUSTOMER_PROFILE_NOT_FOUND",
        "Customer profile not found.",
      );
    }

    return { id: customer.id };
  }

  private async requireVendor(userId: string): Promise<{ id: string }> {
    const vendor = await this.bookingRepository.findVendorByUserId(userId);

    if (!vendor) {
      throw new AppError(
        404,
        "VENDOR_PROFILE_NOT_FOUND",
        "Vendor profile not found.",
      );
    }

    return { id: vendor.id };
  }

  private async requireBooking(
    bookingId: string,
  ): Promise<BookingWithRelations> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
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
      },
    });

    if (!booking) {
      throw new AppError(404, "BOOKING_NOT_FOUND", "Booking not found.");
    }

    return booking;
  }

  private generateInvoiceNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `INV-${timestamp}-${random}`;
  }
}

export const invoiceService = new InvoiceService(
  prismaInvoiceRepository,
  prismaPaymentRepository,
  prismaBookingRepository,
);
