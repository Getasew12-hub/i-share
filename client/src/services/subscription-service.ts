import { apiClient } from "./api-client";
import type {
  BillingCycle,
  SubscriptionPayload,
  SubscriptionPlan,
  VendorSubscription,
} from "../types/subscription";

type Envelope<T> = {
  data: T;
};

function authorization(accessToken: string) {
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

export async function listSubscriptionPlans() {
  const response = await apiClient.get<Envelope<{ plans: SubscriptionPlan[] }>>(
    "/subscriptions/plans",
  );

  return response.data.data.plans;
}

export async function getMySubscription(accessToken: string) {
  const response = await apiClient.get<
    Envelope<{
      current: VendorSubscription | null;
      history: VendorSubscription[];
    }>
  >("/subscriptions/me", authorization(accessToken));

  return response.data.data;
}

export async function selectMySubscription(
  accessToken: string,
  payload: SubscriptionPayload,
) {
  const response = await apiClient.post<
    Envelope<{ subscription: VendorSubscription }>
  >("/subscriptions/me", payload, authorization(accessToken));

  return response.data.data.subscription;
}

export async function changeMySubscriptionPlan(
  accessToken: string,
  payload: { planId: string; billingCycle?: BillingCycle },
) {
  const response = await apiClient.patch<
    Envelope<{ subscription: VendorSubscription }>
  >("/subscriptions/me/plan", payload, authorization(accessToken));

  return response.data.data.subscription;
}

export async function cancelMySubscription(accessToken: string) {
  const response = await apiClient.post<
    Envelope<{ subscription: VendorSubscription }>
  >("/subscriptions/me/cancel", undefined, authorization(accessToken));

  return response.data.data.subscription;
}
