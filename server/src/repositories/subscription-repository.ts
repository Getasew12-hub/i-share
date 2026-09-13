import type {
  AuditAction,
  Prisma,
  SubscriptionPlan,
  VendorSubscription,
} from "@prisma/client";

import { prisma } from "../config/prisma.js";

export type SubscriptionWithPlan = VendorSubscription & {
  plan: SubscriptionPlan;
  previousSubscription:
    | (VendorSubscription & {
        plan: SubscriptionPlan;
      })
    | null;
};

const subscriptionInclude = {
  plan: true,
  previousSubscription: {
    include: {
      plan: true,
    },
  },
} satisfies Prisma.VendorSubscriptionInclude;

export type AuditInput = {
  actorUserId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

export type SubscriptionRepository = {
  listActivePlans(): Promise<SubscriptionPlan[]>;
  findPlanById(planId: string): Promise<SubscriptionPlan | null>;
  findVendorByUserId(userId: string): Promise<{ id: string } | null>;
  findCurrentSubscription(
    vendorId: string,
    now: Date,
  ): Promise<SubscriptionWithPlan | null>;
  listVendorSubscriptionHistory(
    vendorId: string,
  ): Promise<SubscriptionWithPlan[]>;
  createSubscription(
    vendorId: string,
    planId: string,
    billingCycle: "MONTHLY" | "YEARLY",
    startsAt: Date,
    endsAt: Date,
    previousSubscriptionId: string | null,
    audit?: AuditInput,
  ): Promise<SubscriptionWithPlan>;
  updateSubscriptionStatus(
    subscriptionId: string,
    data: Prisma.VendorSubscriptionUpdateInput,
    audit?: AuditInput,
  ): Promise<SubscriptionWithPlan>;
  countVendorProducts(vendorId: string): Promise<number>;
  countVendorEmployees(vendorId: string): Promise<number>;
  countVendorActiveBookings(vendorId: string): Promise<number>;
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

export const prismaSubscriptionRepository: SubscriptionRepository = {
  listActivePlans() {
    return prisma.subscriptionPlan.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ monthlyPriceAmount: "asc" }, { name: "asc" }],
    });
  },

  findPlanById(planId) {
    return prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
  },

  findVendorByUserId(userId) {
    return prisma.vendorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
  },

  findCurrentSubscription(vendorId, now) {
    return prisma.vendorSubscription.findFirst({
      where: {
        vendorId,
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      include: subscriptionInclude,
      orderBy: { startsAt: "desc" },
    });
  },

  listVendorSubscriptionHistory(vendorId) {
    return prisma.vendorSubscription.findMany({
      where: { vendorId },
      include: subscriptionInclude,
      orderBy: { startsAt: "desc" },
    });
  },

  async createSubscription(
    vendorId,
    planId,
    billingCycle,
    startsAt,
    endsAt,
    previousSubscriptionId,
    audit,
  ) {
    return prisma.$transaction(async (tx) => {
      const subscription = await tx.vendorSubscription.create({
        data: {
          vendorId,
          planId,
          billingCycle,
          status: "ACTIVE",
          startsAt,
          endsAt,
          previousSubscriptionId,
        },
        include: subscriptionInclude,
      });

      await createAudit(
        tx,
        audit
          ? {
              ...audit,
              resourceId: subscription.id,
            }
          : undefined,
      );

      return subscription;
    });
  },

  async updateSubscriptionStatus(subscriptionId, data, audit) {
    return prisma.$transaction(async (tx) => {
      const subscription = await tx.vendorSubscription.update({
        where: { id: subscriptionId },
        data,
        include: subscriptionInclude,
      });

      await createAudit(tx, audit);

      return subscription;
    });
  },

  countVendorProducts(vendorId) {
    return prisma.product.count({
      where: {
        vendorId,
        status: {
          not: "ARCHIVED",
        },
      },
    });
  },

  countVendorEmployees() {
    return Promise.resolve(0);
  },

  countVendorActiveBookings(vendorId) {
    return prisma.booking.count({
      where: {
        vendorId,
        status: {
          in: ["CONFIRMED", "ACTIVE"],
        },
      },
    });
  },
};
