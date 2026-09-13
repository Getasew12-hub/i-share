import {
  Prisma,
  type SubscriptionPlan,
  type VendorSubscription,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import type {
  AuditInput,
  SubscriptionRepository,
  SubscriptionWithPlan,
} from "../src/repositories/subscription-repository.js";
import { SubscriptionService } from "../src/services/subscription-service.js";

const now = new Date("2026-09-01T10:00:00.000Z");

function decimal(value: string) {
  return new Prisma.Decimal(value);
}

function createPlan(
  overrides: Partial<SubscriptionPlan> = {},
): SubscriptionPlan {
  return {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Starter",
    description: "Starter plan",
    status: "ACTIVE",
    monthlyPriceAmount: decimal("19.00"),
    yearlyPriceAmount: decimal("190.00"),
    currency: "USD",
    maxProducts: 2,
    maxEmployees: 1,
    storageCapacityMb: 512,
    maxActiveBookings: 3,
    hasPremiumFeatures: false,
    hasAnalytics: false,
    metadata: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createSubscription(
  plan = createPlan(),
  overrides: Partial<VendorSubscription> = {},
): SubscriptionWithPlan {
  return {
    id: "20000000-0000-4000-8000-000000000001",
    vendorId: "30000000-0000-4000-8000-000000000001",
    planId: plan.id,
    status: "ACTIVE",
    billingCycle: "MONTHLY",
    startsAt: new Date("2026-09-01T00:00:00.000Z"),
    endsAt: new Date("2026-10-01T00:00:00.000Z"),
    cancelledAt: null,
    previousSubscriptionId: null,
    createdAt: now,
    updatedAt: now,
    plan,
    previousSubscription: null,
    ...overrides,
  };
}

class FakeSubscriptionRepository implements SubscriptionRepository {
  plans = new Map<string, SubscriptionPlan>();
  subscriptions = new Map<string, SubscriptionWithPlan>();
  vendorByUser = new Map<string, string>();
  audits: AuditInput[] = [];
  productCount = 0;
  employeeCount = 0;
  activeBookingCount = 0;

  async listActivePlans() {
    return [...this.plans.values()].filter((plan) => plan.status === "ACTIVE");
  }

  async findPlanById(planId: string) {
    return this.plans.get(planId) ?? null;
  }

  async findVendorByUserId(userId: string) {
    const vendorId = this.vendorByUser.get(userId);

    return vendorId ? { id: vendorId } : null;
  }

  async findCurrentSubscription(vendorId: string, at: Date) {
    return (
      [...this.subscriptions.values()].find(
        (subscription) =>
          subscription.vendorId === vendorId &&
          subscription.status === "ACTIVE" &&
          subscription.startsAt <= at &&
          subscription.endsAt > at,
      ) ?? null
    );
  }

  async listVendorSubscriptionHistory(vendorId: string) {
    return [...this.subscriptions.values()].filter(
      (subscription) => subscription.vendorId === vendorId,
    );
  }

  async createSubscription(
    vendorId: string,
    planId: string,
    billingCycle: "MONTHLY" | "YEARLY",
    startsAt: Date,
    endsAt: Date,
    previousSubscriptionId: string | null,
    audit?: AuditInput,
  ) {
    const plan = this.plans.get(planId)!;
    const subscription = createSubscription(plan, {
      id: `subscription-${this.subscriptions.size + 1}`,
      vendorId,
      planId,
      billingCycle,
      startsAt,
      endsAt,
      previousSubscriptionId,
    });
    this.subscriptions.set(subscription.id, subscription);
    if (audit) {
      this.audits.push({ ...audit, resourceId: subscription.id });
    }

    return subscription;
  }

  async updateSubscriptionStatus(
    subscriptionId: string,
    data: Prisma.VendorSubscriptionUpdateInput,
    audit?: AuditInput,
  ) {
    const subscription = [...this.subscriptions.values()].find(
      (item) => item.id === subscriptionId,
    )!;
    const updated = {
      ...subscription,
      status: String(
        data.status ?? subscription.status,
      ) as VendorSubscription["status"],
      cancelledAt:
        data.cancelledAt instanceof Date
          ? data.cancelledAt
          : subscription.cancelledAt,
      endsAt: data.endsAt instanceof Date ? data.endsAt : subscription.endsAt,
      updatedAt: now,
    };
    this.subscriptions.set(subscriptionId, updated);
    if (audit) {
      this.audits.push(audit);
    }

    return updated;
  }

  async countVendorProducts() {
    return this.productCount;
  }

  async countVendorEmployees() {
    return this.employeeCount;
  }

  async countVendorActiveBookings() {
    return this.activeBookingCount;
  }
}

function createService() {
  const repository = new FakeSubscriptionRepository();
  const vendorId = "30000000-0000-4000-8000-000000000001";
  const userId = "40000000-0000-4000-8000-000000000001";
  repository.vendorByUser.set(userId, vendorId);

  return {
    repository,
    service: new SubscriptionService(repository),
    userId,
    vendorId,
  };
}

describe("SubscriptionService", () => {
  it("detects active and expired subscriptions", async () => {
    const { repository, service, vendorId } = createService();
    const plan = createPlan();
    repository.plans.set(plan.id, plan);
    repository.subscriptions.set(
      "expired",
      createSubscription(plan, {
        id: "expired",
        vendorId,
        startsAt: new Date("2026-07-01T00:00:00.000Z"),
        endsAt: new Date("2026-08-01T00:00:00.000Z"),
      }),
    );

    await expect(service.hasActiveSubscription(vendorId)).resolves.toBe(false);

    repository.subscriptions.set(
      "active",
      createSubscription(plan, { vendorId }),
    );

    await expect(service.hasActiveSubscription(vendorId)).resolves.toBe(true);
  });

  it("selects a plan for the authenticated vendor and records history", async () => {
    const { repository, service, userId } = createService();
    const plan = createPlan();
    repository.plans.set(plan.id, plan);

    const result = await service.selectMySubscription(
      userId,
      { planId: plan.id, billingCycle: "YEARLY" },
      {},
    );

    expect(result.plan.id).toBe(plan.id);
    expect(result.billingCycle).toBe("YEARLY");
    expect(repository.audits[0]).toMatchObject({
      action: "CREATE",
      resourceType: "VendorSubscription",
    });
  });

  it("rejects duplicate active subscription selection", async () => {
    const { repository, service, userId, vendorId } = createService();
    const plan = createPlan();
    repository.plans.set(plan.id, plan);
    repository.subscriptions.set(
      "active",
      createSubscription(plan, { vendorId }),
    );

    await expect(
      service.selectMySubscription(
        userId,
        {
          planId: plan.id,
          billingCycle: "MONTHLY",
        },
        {},
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "ACTIVE_SUBSCRIPTION_EXISTS",
    });
  });

  it("enforces product, employee, and active booking limits", async () => {
    const { repository, service, vendorId } = createService();
    const plan = createPlan({
      maxProducts: 2,
      maxEmployees: 1,
      maxActiveBookings: 1,
    });
    repository.plans.set(plan.id, plan);
    repository.subscriptions.set(
      "active",
      createSubscription(plan, { vendorId }),
    );
    repository.productCount = 2;
    repository.employeeCount = 0;
    repository.activeBookingCount = 1;

    await expect(service.checkProductLimit(vendorId)).resolves.toMatchObject({
      allowed: false,
      used: 2,
      limit: 2,
    });
    await expect(service.checkEmployeeLimit(vendorId)).resolves.toMatchObject({
      allowed: true,
      used: 0,
      limit: 1,
    });
    await expect(
      service.checkActiveBookingLimit(vendorId),
    ).resolves.toMatchObject({
      allowed: false,
      used: 1,
      limit: 1,
    });
  });

  it("checks premium feature and analytics access from the active plan", async () => {
    const { repository, service, vendorId } = createService();
    const plan = createPlan({ hasPremiumFeatures: true, hasAnalytics: true });
    repository.plans.set(plan.id, plan);
    repository.subscriptions.set(
      "active",
      createSubscription(plan, { vendorId }),
    );

    await expect(service.canAccessPremiumFeatures(vendorId)).resolves.toBe(
      true,
    );
    await expect(service.canAccessAnalytics(vendorId)).resolves.toBe(true);
  });

  it("rejects inactive plans and unchanged plan changes", async () => {
    const { repository, service, userId, vendorId } = createService();
    const plan = createPlan();
    const inactivePlan = createPlan({
      id: "10000000-0000-4000-8000-000000000002",
      name: "Paused",
      status: "INACTIVE",
    });
    repository.plans.set(plan.id, plan);
    repository.plans.set(inactivePlan.id, inactivePlan);
    repository.subscriptions.set(
      "active",
      createSubscription(plan, { vendorId }),
    );

    await expect(
      service.changeMyPlan(userId, { planId: inactivePlan.id }, {}),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "SUBSCRIPTION_PLAN_NOT_FOUND",
    });
    await expect(
      service.changeMyPlan(
        userId,
        { planId: plan.id, billingCycle: "MONTHLY" },
        {},
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "SUBSCRIPTION_PLAN_UNCHANGED",
    });
  });

  it("changes plans by creating a new subscription and linking the previous one", async () => {
    const { repository, service, userId, vendorId } = createService();
    const starter = createPlan();
    const growth = createPlan({
      id: "10000000-0000-4000-8000-000000000003",
      name: "Growth",
      monthlyPriceAmount: decimal("49.00"),
      yearlyPriceAmount: decimal("490.00"),
    });
    repository.plans.set(starter.id, starter);
    repository.plans.set(growth.id, growth);
    repository.subscriptions.set(
      "active",
      createSubscription(starter, { id: "active", vendorId }),
    );

    const result = await service.changeMyPlan(
      userId,
      { planId: growth.id },
      {},
    );

    expect(result.previousSubscriptionId).toBe("active");
    expect(repository.subscriptions.get("active")?.status).toBe("UPGRADED");
  });

  it("cancels only an active authenticated vendor subscription", async () => {
    const { repository, service, userId, vendorId } = createService();
    const plan = createPlan();
    repository.plans.set(plan.id, plan);

    await expect(
      service.cancelMySubscription(userId, {}),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "ACTIVE_SUBSCRIPTION_REQUIRED",
    });

    repository.subscriptions.set(
      "active",
      createSubscription(plan, { vendorId }),
    );

    const result = await service.cancelMySubscription(userId, {});

    expect(result.status).toBe("CANCELLED");
    expect(result.cancelledAt).not.toBeNull();
  });

  it("uses the authenticated user to resolve vendor ownership", async () => {
    const { service } = createService();

    await expect(
      service.getMySubscription("missing-user"),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "VENDOR_PROFILE_NOT_FOUND",
    });
  });
});
