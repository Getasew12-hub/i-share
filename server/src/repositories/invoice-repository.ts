import type { Invoice, Prisma } from "@prisma/client";

import { prisma } from "../config/prisma.js";
import type { AuditInput } from "./vendor-repository.js";

export type InvoiceRepository = {
  findById(invoiceId: string): Promise<Invoice | null>;
  findByBookingId(bookingId: string): Promise<Invoice | null>;
  listByCustomer(
    customerId: string,
    limit: number,
    offset: number,
  ): Promise<{ invoices: Invoice[]; total: number }>;
  listByVendor(
    vendorId: string,
    limit: number,
    offset: number,
  ): Promise<{ invoices: Invoice[]; total: number }>;
  create(data: Prisma.InvoiceCreateInput, audit?: AuditInput): Promise<Invoice>;
};

export const prismaInvoiceRepository: InvoiceRepository = {
  async findById(invoiceId) {
    return prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
  },

  async findByBookingId(bookingId) {
    return prisma.invoice.findUnique({
      where: { bookingId },
    });
  },

  async listByCustomer(customerId, limit, offset) {
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          booking: {
            customerId,
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.invoice.count({
        where: {
          booking: {
            customerId,
          },
        },
      }),
    ]);
    return { invoices, total };
  },

  async listByVendor(vendorId, limit, offset) {
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          booking: {
            vendorId,
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.invoice.count({
        where: {
          booking: {
            vendorId,
          },
        },
      }),
    ]);
    return { invoices, total };
  },

  async create(data) {
    return prisma.invoice.create({
      data,
    });
  },
};
