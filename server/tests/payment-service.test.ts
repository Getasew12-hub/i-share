import { Prisma, type Payment } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../src/errors/app-error.js";
import { prismaBookingRepository } from "../src/repositories/booking-repository.js";
import { PaymentService } from "../src/services/payment-service.js";

const customerUserId = "20000000-0000-4000-8000-000000000001";
const otherCustomerUserId = "20000000-0000-4000-8000-000000000002";
const customerId = "40000000-0000-4000-8000-000000000001";
const otherCustomerId = "40000000-0000-4000-8000-000000000002";
const vendorId = "30000000-0000-4000-8000-000000000001";
const vendorUserId = "10000000-0000-4000-8000-000000000001";
const bookingId = "80000000-0000-4000-8000-000000000001";
const otherBookingId = "80000000-0000-4000-8000-000000000002";

const decimal = (value: string) => new Prisma.Decimal(value);

function createBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: bookingId,
    customerId,
    vendorId,
    status: "CONFIRMED",
    totalAmount: decimal("80.00"),
    currency: "USD",
    ...overrides,
  };
}

function createPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay_001",
    bookingId,
    provider: "STRIPE",
    methodLabel: "Card",
    status: "PENDING",
    amount: decimal("80.00"),
    currency: "USD",
    createdAt: new Date("2026-09-02T00:00:00.000Z"),
    updatedAt: new Date("2026-09-02T00:00:00.000Z"),
    ...overrides,
  };
}

class FakePaymentRepository {
  payments: Payment[] = [];
  bookingToCustomer = new Map<string, string>();
  bookingToVendor = new Map<string, string>();

  async findByBookingId(bookingId: string) {
    return (
      [...this.payments]
        .filter((payment) => payment.bookingId === bookingId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ??
      null
    );
  }

  async findById(paymentId: string) {
    return this.payments.find((payment) => payment.id === paymentId) ?? null;
  }

  async listByCustomer(customerId: string, limit: number, offset: number) {
    const filtered = [...this.payments].filter((payment) => {
      const bookingCustomerId = this.bookingToCustomer.get(payment.bookingId);
      return bookingCustomerId === customerId;
    });

    return {
      payments: filtered.slice(offset, offset + limit),
      total: filtered.length,
    };
  }

  async listByVendor(vendorId: string, limit: number, offset: number) {
    const filtered = [...this.payments].filter((payment) => {
      const bookingVendorId = this.bookingToVendor.get(payment.bookingId);
      return bookingVendorId === vendorId;
    });

    return {
      payments: filtered.slice(offset, offset + limit),
      total: filtered.length,
    };
  }

  async create(data: any) {
    const record = {
      id: `pay_${String(this.payments.length + 1).padStart(3, "0")}`,
      bookingId: data.booking.connect.id,
      provider: data.provider,
      methodLabel: data.methodLabel ?? null,
      status: data.status,
      amount:
        data.amount instanceof Prisma.Decimal
          ? data.amount
          : new Prisma.Decimal(data.amount),
      currency: data.currency,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Payment;

    this.payments.push(record);
    return record;
  }

  async countByBookingAndStatus(
    bookingId: string,
    status: string,
  ): Promise<number> {
    return this.payments.filter(
      (p) => p.bookingId === bookingId && p.status === status,
    ).length;
  }
}

describe("PaymentService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a booking payment using the booking amount and validates ownership", async () => {
    const repository = new FakePaymentRepository();
    const service = new PaymentService(repository as any);

    vi.spyOn(prismaBookingRepository, "findCustomerByUserId").mockResolvedValue(
      {
        id: customerId,
      },
    );
    vi.spyOn(prismaBookingRepository, "findCustomerBooking").mockResolvedValue(
      createBooking() as any,
    );

    const result = await service.createBookingPayment(
      customerUserId,
      {
        bookingId,
        provider: "STRIPE",
        methodLabel: "Card",
      } as any,
      {},
    );

    expect(result.bookingId).toBe(bookingId);
    expect(result.amount.equals(new Prisma.Decimal("80.00"))).toBe(true);
    expect(result.amount.toNumber()).toBe(80);
    expect(result.status).toBe("PENDING");
  });

  it("rejects payments when the customer does not own the booking", async () => {
    const repository = new FakePaymentRepository();
    const service = new PaymentService(repository as any);

    vi.spyOn(prismaBookingRepository, "findCustomerByUserId").mockResolvedValue(
      {
        id: otherCustomerId,
      },
    );
    vi.spyOn(prismaBookingRepository, "findCustomerBooking").mockResolvedValue(
      null,
    );

    await expect(
      service.createBookingPayment(
        customerUserId,
        {
          bookingId,
          provider: "STRIPE",
          methodLabel: "Card",
        } as any,
        {},
      ),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "BOOKING_NOT_FOUND",
    });
  });

  it("rejects payments when the booking is not confirmed", async () => {
    const repository = new FakePaymentRepository();
    const service = new PaymentService(repository as any);

    vi.spyOn(prismaBookingRepository, "findCustomerByUserId").mockResolvedValue(
      {
        id: customerId,
      },
    );
    vi.spyOn(prismaBookingRepository, "findCustomerBooking").mockResolvedValue(
      createBooking({ status: "PENDING" }) as any,
    );

    await expect(
      service.createBookingPayment(
        customerUserId,
        {
          bookingId,
          provider: "STRIPE",
          methodLabel: "Card",
        } as any,
        {},
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "INVALID_BOOKING_STATUS",
    });
  });

  it("prevents duplicate successful payments for the same booking", async () => {
    const repository = new FakePaymentRepository();
    repository.payments.push(
      createPayment({
        id: "pay_success_001",
        bookingId,
        status: "SUCCEEDED",
      }),
    );
    const service = new PaymentService(repository as any);

    vi.spyOn(prismaBookingRepository, "findCustomerByUserId").mockResolvedValue(
      {
        id: customerId,
      },
    );
    vi.spyOn(prismaBookingRepository, "findCustomerBooking").mockResolvedValue(
      createBooking() as any,
    );

    await expect(
      service.createBookingPayment(
        customerUserId,
        {
          bookingId,
          provider: "STRIPE",
          methodLabel: "Card",
        } as any,
        {},
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "PAYMENT_ALREADY_SUCCEEDED",
    });
  });

  it("returns payment details only for customers who own the booking", async () => {
    const repository = new FakePaymentRepository();
    const payment = createPayment();
    repository.payments.push(payment);
    const service = new PaymentService(repository as any);

    vi.spyOn(prismaBookingRepository, "findCustomerByUserId").mockResolvedValue(
      {
        id: customerId,
      },
    );
    vi.spyOn(prismaBookingRepository, "findCustomerBooking").mockResolvedValue(
      createBooking() as any,
    );

    await expect(
      service.getPaymentDetails(customerUserId, payment.id),
    ).resolves.toMatchObject({
      id: payment.id,
      bookingId,
    });

    vi.spyOn(prismaBookingRepository, "findCustomerByUserId").mockResolvedValue(
      {
        id: otherCustomerId,
      },
    );
    vi.spyOn(prismaBookingRepository, "findCustomerBooking").mockResolvedValue(
      null,
    );

    await expect(
      service.getPaymentDetails(customerUserId, payment.id),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("returns a 404 when the payment is missing", async () => {
    const repository = new FakePaymentRepository();
    const service = new PaymentService(repository as any);

    vi.spyOn(prismaBookingRepository, "findCustomerByUserId").mockResolvedValue(
      {
        id: customerId,
      },
    );

    await expect(
      service.getPaymentDetails(customerUserId, "missing_payment"),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "PAYMENT_NOT_FOUND",
    });
  });

  it("lists a customer's payments with pagination metadata", async () => {
    const repository = new FakePaymentRepository();
    repository.bookingToCustomer.set(bookingId, customerId);
    repository.bookingToCustomer.set(otherBookingId, customerId);
    repository.payments.push(
      createPayment({ id: "pay_1", bookingId }),
      createPayment({ id: "pay_2", bookingId: otherBookingId }),
      createPayment({
        id: "pay_3",
        bookingId: otherBookingId,
        status: "SUCCEEDED",
      }),
    );
    const service = new PaymentService(repository as any);

    vi.spyOn(prismaBookingRepository, "findCustomerByUserId").mockResolvedValue(
      {
        id: customerId,
      },
    );

    await expect(
      service.listMyPayments(customerUserId, 1, 2),
    ).resolves.toMatchObject({
      pagination: {
        page: 1,
        limit: 2,
        total: 3,
        pages: 2,
      },
    });
  });

  it("lists a vendor's payments with pagination metadata", async () => {
    const repository = new FakePaymentRepository();
    repository.bookingToVendor.set(bookingId, vendorId);
    repository.bookingToVendor.set(otherBookingId, vendorId);
    repository.payments.push(
      createPayment({ id: "pay_1", bookingId }),
      createPayment({ id: "pay_2", bookingId: otherBookingId }),
    );
    const service = new PaymentService(repository as any);

    vi.spyOn(prismaBookingRepository, "findVendorByUserId").mockResolvedValue({
      id: vendorId,
    });

    await expect(
      service.listVendorPayments(vendorUserId, 1, 1),
    ).resolves.toMatchObject({
      pagination: {
        page: 1,
        limit: 1,
        total: 2,
        pages: 2,
      },
    });
  });
});
