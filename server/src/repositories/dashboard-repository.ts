import type { Prisma } from "@prisma/client";

import { prisma } from "../config/prisma.js";
import type {
  AdminDashboard,
  BookingStatusCounts,
  CurrencyTotal,
  CustomerDashboard,
  DashboardRepository,
  VendorDashboard,
} from "../types/dashboard.js";

function statusCounts(rows: { status: keyof BookingStatusCounts; _count: { _all: number } }[]) {
  return Object.fromEntries(rows.map((row) => [row.status, row._count._all])) as BookingStatusCounts;
}

function currencyTotals(
  rows: { currency: string; _sum: { amount: Prisma.Decimal | null }; _count: { _all: number } }[],
): CurrencyTotal[] {
  return rows.map((row) => ({
    currency: row.currency,
    amount: (row._sum.amount ?? 0).toString(),
    count: row._count._all,
  }));
}

async function bookingMetrics(owner: { customerId?: string; vendorId?: string }, now: Date) {
  const where = owner.customerId ? { customerId: owner.customerId } : { vendorId: owner.vendorId };
  const [total, pending, upcoming, byStatus, activeRentals, completedRentals] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.count({ where: { ...where, status: "PENDING" } }),
    prisma.booking.count({
      where: { ...where, status: "CONFIRMED", startsAt: { gt: now } },
    }),
    prisma.booking.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.rental.count({
      where: {
        status: { in: ["CONFIRMED", "PAID", "ACTIVE", "IN_PROGRESS"] },
        booking: where,
      },
    }),
    prisma.rental.count({ where: { status: "COMPLETED", booking: where } }),
  ]);

  return {
    bookings: { total, pending, upcoming, byStatus: statusCounts(byStatus) },
    rentals: { active: activeRentals, completed: completedRentals },
  };
}

async function moneyMetrics(owner: { customerId?: string; vendorId?: string }) {
  const bookingWhere = owner.customerId ? { customerId: owner.customerId } : { vendorId: owner.vendorId };
  const [payments, invoices] = await Promise.all([
    prisma.payment.groupBy({
      by: ["currency"],
      where: { status: "SUCCEEDED", booking: bookingWhere },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.invoice.groupBy({
      by: ["currency"],
      where: { status: { not: "VOID" }, booking: bookingWhere },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
  ]);

  return {
    successfulPayments: currencyTotals(payments),
    invoices: invoices.map((row) => ({
      currency: row.currency,
      amount: (row._sum.totalAmount ?? 0).toString(),
      count: row._count._all,
    })),
  };
}

export const prismaDashboardRepository: DashboardRepository = {
  async getCustomerMetrics(customerId, userId, now) {
    const [booking, money, submittedReviewCount, unreadNotificationCount] = await Promise.all([
      bookingMetrics({ customerId }, now),
      moneyMetrics({ customerId }),
      prisma.review.count({ where: { customerId, customer: { userId } } }),
      prisma.notification.count({ where: { userId, status: "UNREAD" } }),
    ]);

    return {
      ...booking,
      ...money,
      submittedReviewCount,
      unreadNotificationCount,
    };
  },

  async getVendorMetrics(vendorId, userId, now) {
    const [booking, money, products, reviews, unreadNotificationCount, subscription] = await Promise.all([
      bookingMetrics({ vendorId }, now),
      moneyMetrics({ vendorId }),
      Promise.all([
        prisma.product.count({ where: { vendorId, status: { not: "ARCHIVED" } } }),
        prisma.product.count({ where: { vendorId, status: "PUBLISHED" } }),
      ]),
      prisma.review.aggregate({
        where: { vendorId, status: "PUBLISHED", vendor: { userId } },
        _count: { _all: true },
        _avg: { rating: true },
      }),
      prisma.notification.count({ where: { userId, status: "UNREAD" } }),
      prisma.vendorSubscription.findFirst({
        where: {
          vendorId,
          status: "ACTIVE",
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
        orderBy: { startsAt: "desc" },
        select: {
          id: true,
          status: true,
          startsAt: true,
          endsAt: true,
          plan: { select: { id: true, name: true, hasAnalytics: true } },
        },
      }),
    ]);

    return {
      ...booking,
      ...money,
      products: { total: products[0], published: products[1] },
      reviews: {
        publishedCount: reviews._count._all,
        averageRating: reviews._avg.rating,
      },
      unreadNotificationCount,
      subscription,
    };
  },

  async getAdminMetrics() {
    const [users, vendors, products, bookings, rentals] = await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.vendorProfile.groupBy({ by: ["verificationStatus"], _count: { _all: true } }),
      prisma.product.count(),
      prisma.booking.count(),
      prisma.rental.count(),
    ]);

    const byRole = { ADMIN: 0, VENDOR: 0, CUSTOMER: 0 };
    for (const row of users) byRole[row.role] = row._count._all;

    return {
      users: { total: users.reduce((sum, row) => sum + row._count._all, 0), byRole },
      vendors: {
        total: vendors.reduce((sum, row) => sum + row._count._all, 0),
        byVerificationStatus: Object.fromEntries(
          vendors.map((row) => [row.verificationStatus, row._count._all]),
        ),
      },
      products,
      bookings,
      rentals,
    } satisfies AdminDashboard;
  },
};