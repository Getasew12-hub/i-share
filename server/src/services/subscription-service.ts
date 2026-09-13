import type { SubscriptionPlan } from "@prisma/client";

import { AppError } from "../errors/app-error.js";
import type {
  SubscriptionRepository,
  SubscriptionWithPlan,
} from "../repositories/subscription-repository.js";
import { prismaSubscriptionRepository } from "../repositories/subscription-repository.js";
import type {
  ChangeSubscriptionPlanInput,
  SelectSubscriptionInput,
} from "../schemas/subscription-schemas.js";

type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

function addBillingCycle(start: Date, billingCycle: "MONTHLY" | "YEARLY") {
  const end = new Date(start);

  if (billingCycle === "YEARLY") {
    end.setUTCFullYear(end.getUTCFullYear() + 1);
    return end;
  }

  end.setUTCMonth(end.getUTCMonth() + 1);
  return end;
}

export class SubscriptionService {
  constructor(private readonly repository: SubscriptionRepository) {}

  listPlans() {
    return this.repository
      .listActivePlans()
      .then((plans) => plans.map((plan) => this.toPlanResponse(plan)));
  }

  async getMySubscription(userId: string) {
    const vendorId = await this.requireVendorIdForUser(userId);
    const current = await this.repository.findCurrentSubscription(
      vendorId,
      new Date(),
    );
    const history =
      await this.repository.listVendorSubscriptionHistory(vendorId);

    return {
      current: current ? this.toSubscriptionResponse(current) : null,
      history: history.map((subscription) =>
        this.toSubscriptionResponse(subscription),
      ),
    };
  }

  async selectMySubscription(
    userId: string,
    input: SelectSubscriptionInput,
    context: RequestContext,
  ) {
    const vendorId = await this.requireVendorIdForUser(userId);
    const existing = await this.repository.findCurrentSubscription(
      vendorId,
      new Date(),
    );

    if (existing) {
      throw new AppError(
        409,
        "ACTIVE_SUBSCRIPTION_EXISTS",
        "Use plan change to modify an active subscription.",
      );
    }

    return this.createSubscriptionForVendor(vendorId, userId, input, null, {
      event: "vendor_subscription_selected",
      ...context,
    });
  }

  async changeMyPlan(
    userId: string,
    input: ChangeSubscriptionPlanInput,
    context: RequestContext,
  ) {
    const vendorId = await this.requireVendorIdForUser(userId);
    const current = await this.repository.findCurrentSubscription(
      vendorId,
      new Date(),
    );

    if (!current) {
      throw new AppError(
        409,
        "ACTIVE_SUBSCRIPTION_REQUIRED",
        "An active subscription is required before changing plans.",
      );
    }

    if (
      current.planId === input.planId &&
      (!input.billingCycle || current.billingCycle === input.billingCycle)
    ) {
      throw new AppError(
        409,
        "SUBSCRIPTION_PLAN_UNCHANGED",
        "Select a different plan or billing cycle.",
      );
    }

    const billingCycle = input.billingCycle ?? current.billingCycle;
    const changed = await this.createSubscriptionForVendor(
      vendorId,
      userId,
      { planId: input.planId, billingCycle },
      current.id,
      {
        event: "vendor_subscription_plan_changed",
        previousSubscriptionId: current.id,
        ...context,
      },
    );

    await this.repository.updateSubscriptionStatus(
      current.id,
      {
        status: this.classifyPlanChange(current.plan, changed.plan),
        endsAt: new Date(),
      },
      {
        actorUserId: userId,
        action: "STATUS_CHANGE",
        resourceType: "VendorSubscription",
        resourceId: current.id,
        metadata: {
          event: "vendor_subscription_replaced",
          nextSubscriptionId: changed.id,
        },
        ...context,
      },
    );

    return this.toSubscriptionResponse(changed);
  }

  async cancelMySubscription(userId: string, context: RequestContext) {
    const vendorId = await this.requireVendorIdForUser(userId);
    const current = await this.repository.findCurrentSubscription(
      vendorId,
      new Date(),
    );

    if (!current) {
      throw new AppError(
        409,
        "ACTIVE_SUBSCRIPTION_REQUIRED",
        "An active subscription is required before cancellation.",
      );
    }

    const cancelled = await this.repository.updateSubscriptionStatus(
      current.id,
      {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
      {
        actorUserId: userId,
        action: "STATUS_CHANGE",
        resourceType: "VendorSubscription",
        resourceId: current.id,
        metadata: {
          event: "vendor_subscription_cancelled",
        },
        ...context,
      },
    );

    return this.toSubscriptionResponse(cancelled);
  }

  async hasActiveSubscription(vendorId: string) {
    const subscription = await this.repository.findCurrentSubscription(
      vendorId,
      new Date(),
    );

    return Boolean(subscription);
  }

  async checkProductLimit(vendorId: string) {
    const subscription = await this.requireActiveSubscription(vendorId);
    const count = await this.repository.countVendorProducts(vendorId);

    return {
      allowed: count < subscription.plan.maxProducts,
      used: count,
      limit: subscription.plan.maxProducts,
    };
  }

  async checkEmployeeLimit(vendorId: string) {
    const subscription = await this.requireActiveSubscription(vendorId);
    const count = await this.repository.countVendorEmployees(vendorId);

    return {
      allowed: count < subscription.plan.maxEmployees,
      used: count,
      limit: subscription.plan.maxEmployees,
    };
  }

  async checkActiveBookingLimit(vendorId: string) {
    const subscription = await this.requireActiveSubscription(vendorId);
    const count = await this.repository.countVendorActiveBookings(vendorId);

    return {
      allowed: count < subscription.plan.maxActiveBookings,
      used: count,
      limit: subscription.plan.maxActiveBookings,
    };
  }

  async canAccessPremiumFeatures(vendorId: string) {
    const subscription = await this.repository.findCurrentSubscription(
      vendorId,
      new Date(),
    );

    return Boolean(subscription?.plan.hasPremiumFeatures);
  }

  async canAccessAnalytics(vendorId: string) {
    const subscription = await this.repository.findCurrentSubscription(
      vendorId,
      new Date(),
    );

    return Boolean(subscription?.plan.hasAnalytics);
  }

  private async createSubscriptionForVendor(
    vendorId: string,
    actorUserId: string,
    input: SelectSubscriptionInput,
    previousSubscriptionId: string | null,
    context: RequestContext & Record<string, unknown>,
  ) {
    const plan = await this.repository.findPlanById(input.planId);

    if (!plan || plan.status !== "ACTIVE") {
      throw new AppError(
        404,
        "SUBSCRIPTION_PLAN_NOT_FOUND",
        "Active subscription plan not found.",
      );
    }

    const startsAt = new Date();
    const endsAt = addBillingCycle(startsAt, input.billingCycle);
    const subscription = await this.repository.createSubscription(
      vendorId,
      plan.id,
      input.billingCycle,
      startsAt,
      endsAt,
      previousSubscriptionId,
      {
        actorUserId,
        action: "CREATE",
        resourceType: "VendorSubscription",
        metadata: {
          planId: plan.id,
          billingCycle: input.billingCycle,
          ...context,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    );

    return subscription;
  }

  private async requireVendorIdForUser(userId: string) {
    const vendor = await this.repository.findVendorByUserId(userId);

    if (!vendor) {
      throw new AppError(
        404,
        "VENDOR_PROFILE_NOT_FOUND",
        "Vendor profile not found.",
      );
    }

    return vendor.id;
  }

  private async requireActiveSubscription(vendorId: string) {
    const subscription = await this.repository.findCurrentSubscription(
      vendorId,
      new Date(),
    );

    if (!subscription) {
      throw new AppError(
        403,
        "ACTIVE_SUBSCRIPTION_REQUIRED",
        "An active subscription is required.",
      );
    }

    return subscription;
  }

  private classifyPlanChange(
    previousPlan: SubscriptionPlan,
    nextPlan: SubscriptionPlan,
  ) {
    return nextPlan.monthlyPriceAmount.greaterThan(
      previousPlan.monthlyPriceAmount,
    )
      ? "UPGRADED"
      : "DOWNGRADED";
  }

  private toPlanResponse(plan: SubscriptionPlan) {
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      status: plan.status,
      monthlyPriceAmount: plan.monthlyPriceAmount.toString(),
      yearlyPriceAmount: plan.yearlyPriceAmount.toString(),
      currency: plan.currency,
      maxProducts: plan.maxProducts,
      maxEmployees: plan.maxEmployees,
      storageCapacityMb: plan.storageCapacityMb,
      maxActiveBookings: plan.maxActiveBookings,
      hasPremiumFeatures: plan.hasPremiumFeatures,
      hasAnalytics: plan.hasAnalytics,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    };
  }

  private toSubscriptionResponse(subscription: SubscriptionWithPlan) {
    return {
      id: subscription.id,
      vendorId: subscription.vendorId,
      planId: subscription.planId,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      startsAt: subscription.startsAt.toISOString(),
      endsAt: subscription.endsAt.toISOString(),
      cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
      previousSubscriptionId: subscription.previousSubscriptionId,
      plan: this.toPlanResponse(subscription.plan),
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    };
  }
}

export const subscriptionService = new SubscriptionService(
  prismaSubscriptionRepository,
);

export function hasActiveSubscription(vendorId: string) {
  return subscriptionService.hasActiveSubscription(vendorId);
}

export function checkProductLimit(vendorId: string) {
  return subscriptionService.checkProductLimit(vendorId);
}

export function checkEmployeeLimit(vendorId: string) {
  return subscriptionService.checkEmployeeLimit(vendorId);
}

export function checkActiveBookingLimit(vendorId: string) {
  return subscriptionService.checkActiveBookingLimit(vendorId);
}

export function canAccessPremiumFeatures(vendorId: string) {
  return subscriptionService.canAccessPremiumFeatures(vendorId);
}

export function canAccessAnalytics(vendorId: string) {
  return subscriptionService.canAccessAnalytics(vendorId);
}
