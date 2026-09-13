export type BillingCycle = "MONTHLY" | "YEARLY";

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  monthlyPriceAmount: string;
  yearlyPriceAmount: string;
  currency: string;
  maxProducts: number;
  maxEmployees: number;
  storageCapacityMb: number;
  maxActiveBookings: number;
  hasPremiumFeatures: boolean;
  hasAnalytics: boolean;
  createdAt: string;
  updatedAt: string;
};

export type VendorSubscription = {
  id: string;
  vendorId: string;
  planId: string;
  status:
    "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELLED" | "UPGRADED" | "DOWNGRADED";
  billingCycle: BillingCycle;
  startsAt: string;
  endsAt: string;
  cancelledAt: string | null;
  previousSubscriptionId: string | null;
  plan: SubscriptionPlan;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionPayload = {
  planId: string;
  billingCycle: BillingCycle;
};
