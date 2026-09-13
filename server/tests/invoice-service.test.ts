import { Prisma, type Invoice, type Payment } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../src/config/prisma.js";
import { AppError } from "../src/errors/app-error.js";
import { InvoiceService } from "../src/services/invoice-service.js";

const customerUserId = "20000000-0000-4000-8000-000000000001";
const vendorUserId = "10000000-0000-4000-8000-000000000001";
const customerId = "40000000-0000-4000-8000-000000000001";
const vendorId = "30000000-0000-4000-8000-000000000001";
const productId = "60000000-0000-4000-8000-000000000001";
const bookingId = "80000000-0000-4000-8000-000000000001";
const paymentId = "pay_001";
const invoiceId = "inv_001";
const now = new Date("2026-09-02T00:00:00.000Z");

const decimal = (value: string) => new Prisma.Decimal(value);

function createBooking() {
  return {
    id: bookingId,
    customer: {
      id: customerId,
      userId: customerUserId,
      displayName: "Test Customer",
      email: "customer@example.com",
    },
    vendor: {
      id: vendorId,
      userId: vendorUserId,
      displayName: "Test Vendor",
      email: "vendor@example.com",
    },
    product: {
      id: productId,
      name: "Cordless Drill",
      slug: "cordless-drill",
    },
    rentalSubtotal: decimal("60.00"),
    deliveryCharge: decimal("5.00"),
    securityDeposit: decimal("15.00"),
    promotionalDiscount: decimal("0.00"),
    totalAmount: decimal("80.00"),
    currency: "USD",
    pricingModelSnapshot: "DAILY",
    unitPriceSnapshot: decimal("15.00"),
    rentalDuration: 4,
    customerId,
    vendorId,
    productId,
  } as any;
}

function createPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: paymentId,
    bookingId,
    provider: "STRIPE",
    methodLabel: "Card",
    status: "SUCCEEDED",
    amount: decimal("80.00"),
    currency: "USD",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: invoiceId,
    bookingId,
    paymentId,
    invoiceNumber: "INV-1",
    status: "ISSUED",
    issuedAt: now,
    customerSnapshot: {
      id: customerId,
      displayName: "Test Customer",
      email: "customer@example.com",
    },
    vendorSnapshot: {
      id: vendorId,
      displayName: "Test Vendor",
      email: "vendor@example.com",
    },
    productSnapshot: {
      id: productId,
      name: "Cordless Drill",
      slug: "cordless-drill",
    },
    pricingSnapshot: {
      pricingModel: "DAILY",
      unitPrice: "15.00",
      rentalDuration: 4,
      rentalSubtotal: "60.00",
      deliveryCharge: "5.00",
      securityDeposit: "15.00",
      promotionalDiscount: "0.00",
      currency: "USD",
    },
    subtotalAmount: decimal("80.00"),
    discountAmount: decimal("0.00"),
    totalAmount: decimal("80.00"),
    currency: "USD",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Invoice;
}

class FakeInvoiceRepository {
  invoices: Invoice[] = [];

  async findById(invoiceId: string) {
    return this.invoices.find((invoice) => invoice.id === invoiceId) ?? null;
  }

  async findByBookingId(bookingId: string) {
    return (
      this.invoices.find((invoice) => invoice.bookingId === bookingId) ?? null
    );
  }

  async listByCustomer(customerId: string, limit: number, offset: number) {
    const filtered = this.invoices.filter((invoice) => {
      const snapshot = invoice.customerSnapshot as any;
      return snapshot?.id === customerId;
    });

    return {
      invoices: filtered.slice(offset, offset + limit),
      total: filtered.length,
    };
  }

  async listByVendor(vendorId: string, limit: number, offset: number) {
    const filtered = this.invoices.filter((invoice) => {
      const snapshot = invoice.vendorSnapshot as any;
      return snapshot?.id === vendorId;
    });

    return {
      invoices: filtered.slice(offset, offset + limit),
      total: filtered.length,
    };
  }

  async create(data: any) {
    const record = {
      id: `inv_${String(this.invoices.length + 1).padStart(3, "0")}`,
      bookingId: data.booking.connect.id,
      paymentId: data.payment.connect.id,
      invoiceNumber: data.invoiceNumber,
      status: data.status,
      issuedAt: data.issuedAt,
      dueAt: null,
      paidAt: null,
      customerSnapshot: data.customerSnapshot,
      vendorSnapshot: data.vendorSnapshot,
      productSnapshot: data.productSnapshot,
      pricingSnapshot: data.pricingSnapshot,
      subtotalAmount:
        data.subtotalAmount instanceof Prisma.Decimal
          ? data.subtotalAmount
          : new Prisma.Decimal(data.subtotalAmount ?? 0),
      discountAmount:
        data.discountAmount instanceof Prisma.Decimal
          ? data.discountAmount
          : new Prisma.Decimal(data.discountAmount ?? 0),
      totalAmount:
        data.totalAmount instanceof Prisma.Decimal
          ? data.totalAmount
          : new Prisma.Decimal(data.totalAmount ?? 0),
      currency: data.currency,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Invoice;

    this.invoices.push(record);
    return record;
  }
}

class FakePaymentRepository {
  payments: Payment[] = [];

  async findById(paymentId: string) {
    return this.payments.find((payment) => payment.id === paymentId) ?? null;
  }
}

class FakeBookingRepository {
  async findCustomerByUserId(userId: string) {
    return userId === customerUserId ? { id: customerId } : null;
  }

  async findVendorByUserId(userId: string) {
    return userId === vendorUserId ? { id: vendorId } : null;
  }

  async findCustomerBooking(_customerId: string, bookingIdValue: string) {
    return bookingIdValue === bookingId ? createBooking() : null;
  }
}

describe("InvoiceService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates an invoice from booking snapshots and validates the payment belongs to the booking", async () => {
    const invoiceRepository = new FakeInvoiceRepository();
    const paymentRepository = new FakePaymentRepository();
    const bookingRepository = new FakeBookingRepository();
    const service = new InvoiceService(
      invoiceRepository as any,
      paymentRepository as any,
      bookingRepository as any,
    );

    paymentRepository.payments.push(createPayment());
    vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(
      createBooking() as any,
    );

    const result = await service.createInvoice(bookingId, paymentId);

    expect(result.customerSnapshot).toMatchObject({
      id: customerId,
      displayName: "Test Customer",
    });
    expect(result.vendorSnapshot).toMatchObject({
      id: vendorId,
      displayName: "Test Vendor",
    });
    expect(result.productSnapshot).toMatchObject({
      id: productId,
      name: "Cordless Drill",
    });
    expect(result.pricingSnapshot).toMatchObject({
      pricingModel: "DAILY",
      unitPrice: "15.00",
      rentalDuration: 4,
      rentalSubtotal: "60.00",
      deliveryCharge: "5.00",
      securityDeposit: "15.00",
      promotionalDiscount: "0.00",
      currency: "USD",
    });
    expect(result.pricingSnapshot).not.toHaveProperty("totalAmount");
    expect(result.totalAmount.toString()).toBe("80");

    await expect(
      service.createInvoice(bookingId, paymentId),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "INVOICE_ALREADY_EXISTS",
    });
  });

  it("rejects invoice creation when the payment is missing or belongs to another booking", async () => {
    const invoiceRepository = new FakeInvoiceRepository();
    const paymentRepository = new FakePaymentRepository();
    const bookingRepository = new FakeBookingRepository();
    const service = new InvoiceService(
      invoiceRepository as any,
      paymentRepository as any,
      bookingRepository as any,
    );

    vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(
      createBooking() as any,
    );

    await expect(
      service.createInvoice(bookingId, "missing_payment"),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "PAYMENT_NOT_FOUND",
    });

    paymentRepository.payments.push(
      createPayment({ bookingId: "other_booking" }),
    );
    await expect(
      service.createInvoice(bookingId, paymentId),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "PAYMENT_BOOKING_MISMATCH",
    });
  });

  it("returns invoice details to either the customer or the vendor only", async () => {
    const invoiceRepository = new FakeInvoiceRepository();
    const paymentRepository = new FakePaymentRepository();
    const bookingRepository = new FakeBookingRepository();
    const service = new InvoiceService(
      invoiceRepository as any,
      paymentRepository as any,
      bookingRepository as any,
    );

    const invoice = createInvoice();
    invoiceRepository.invoices.push(invoice);
    vi.spyOn(prisma.booking, "findUnique").mockResolvedValue(
      createBooking() as any,
    );

    await expect(
      service.getInvoiceDetails(customerUserId, invoice.id),
    ).resolves.toMatchObject({
      id: invoice.id,
    });

    await expect(
      service.getInvoiceDetails("unauthorized-user", invoice.id),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "INVOICE_ACCESS_DENIED",
    });
  });

  it("lists customer invoices with pagination metadata", async () => {
    const invoiceRepository = new FakeInvoiceRepository();
    const paymentRepository = new FakePaymentRepository();
    const bookingRepository = new FakeBookingRepository();
    const service = new InvoiceService(
      invoiceRepository as any,
      paymentRepository as any,
      bookingRepository as any,
    );

    invoiceRepository.invoices.push(
      createInvoice({
        id: "inv_1",
        customerSnapshot: {
          id: customerId,
          displayName: "Test Customer",
          email: "customer@example.com",
        } as any,
      }),
      createInvoice({
        id: "inv_2",
        customerSnapshot: {
          id: customerId,
          displayName: "Test Customer",
          email: "customer@example.com",
        } as any,
      }),
      createInvoice({
        id: "inv_3",
        customerSnapshot: {
          id: customerId,
          displayName: "Test Customer",
          email: "customer@example.com",
        } as any,
      }),
    );

    vi.spyOn(prisma.customerProfile, "findUnique").mockResolvedValue({
      id: customerId,
      email: "customer@example.com",
      displayName: "Test Customer",
      userId: customerUserId,
    });

    await expect(
      service.listMyInvoices(customerUserId, 1, 2),
    ).resolves.toMatchObject({
      pagination: {
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      },
    });
  });

  it("lists vendor invoices with pagination metadata", async () => {
    const invoiceRepository = new FakeInvoiceRepository();
    const paymentRepository = new FakePaymentRepository();
    const bookingRepository = new FakeBookingRepository();
    const service = new InvoiceService(
      invoiceRepository as any,
      paymentRepository as any,
      bookingRepository as any,
    );

    invoiceRepository.invoices.push(
      createInvoice({
        id: "inv_1",
        vendorSnapshot: {
          id: vendorId,
          displayName: "Test Vendor",
          email: "vendor@example.com",
        } as any,
      }),
      createInvoice({
        id: "inv_2",
        vendorSnapshot: {
          id: vendorId,
          displayName: "Test Vendor",
          email: "vendor@example.com",
        } as any,
      }),
    );

    vi.spyOn(prisma.vendorProfile, "findUnique").mockResolvedValue({
      id: vendorId,
      email: "vendor@example.com",
      displayName: "Test Vendor",
      userId: vendorUserId,
    });

    await expect(
      service.listVendorInvoices(vendorUserId, 1, 1),
    ).resolves.toMatchObject({
      pagination: {
        page: 1,
        limit: 1,
        total: 2,
        totalPages: 2,
      },
    });
  });
});
