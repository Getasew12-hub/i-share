import type { Payment, Prisma } from "@prisma/client";

import { prisma } from "../config/prisma.js";
import type { AuditInput } from "./vendor-repository.js";

export type PaymentRepository = {
  findByBookingId(bookingId: string): Promise<Payment | null>;
  findById(paymentId: string): Promise<Payment | null>;
  listByCustomer(
    customerId: string,
    limit: number,
    offset: number,
  ): Promise<{ payments: Payment[]; total: number }>;
  listByVendor(
    vendorId: string,
    limit: number,
    offset: number,
  ): Promise<{ payments: Payment[]; total: number }>;
  create(data: Prisma.PaymentCreateInput, audit?: AuditInput): Promise<Payment>;
  updateStatus(
    paymentId: string,
    status: string,
    audit?: AuditInput,
  ): Promise<Payment>;
  countByBookingAndStatus(bookingId: string, status: string): Promise<number>;
};

export const prismaPaymentRepository: PaymentRepository = {
  async findByBookingId(bookingId) {
    return prisma.payment.findFirst({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(paymentId) {
    return prisma.payment.findUnique({
      where: { id: paymentId },
    });
  },

  async listByCustomer(customerId, limit, offset) {
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          booking: {
            customerId,
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({
        where: {
          booking: {
            customerId,
          },
        },
      }),
    ]);
    return { payments, total };
  },

  async listByVendor(vendorId, limit, offset) {
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          booking: {
            vendorId,
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({
        where: {
          booking: {
            vendorId,
          },
        },
      }),
    ]);
    return { payments, total };
  },

  async create(data) {
    return prisma.payment.create({
      data,
    });
  },

  async updateStatus(paymentId, status) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: { status: status as any, updatedAt: new Date() },
    });
  },

  async countByBookingAndStatus(bookingId, status) {
    return prisma.payment.count({
      where: {
        bookingId,
        status: status as any,
      },
    });
  },
};
