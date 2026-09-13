import { FormEvent, useState } from "react";
import { BarChart3, Check, Crown, RefreshCcw, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../hooks/use-auth";
import {
  cancelMySubscription,
  changeMySubscriptionPlan,
  getMySubscription,
  listSubscriptionPlans,
  selectMySubscription,
} from "../services/subscription-service";
import type { BillingCycle, SubscriptionPlan } from "../types/subscription";

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(amount));
}

function limitRows(plan: SubscriptionPlan) {
  return [
    ["Products", plan.maxProducts],
    ["Employees", plan.maxEmployees],
    ["Storage MB", plan.storageCapacityMb],
    ["Active bookings", plan.maxActiveBookings],
  ] as const;
}

export function VendorSubscriptionPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [message, setMessage] = useState<string | null>(null);

  const plansQuery = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: listSubscriptionPlans,
  });

  const subscriptionQuery = useQuery({
    queryKey: ["my-subscription"],
    enabled: Boolean(auth.accessToken && auth.user?.role === "VENDOR"),
    queryFn: () => getMySubscription(auth.accessToken!),
  });

  const refreshSubscription = () =>
    queryClient.invalidateQueries({ queryKey: ["my-subscription"] });

  const selectMutation = useMutation({
    mutationFn: (planId: string) =>
      selectMySubscription(auth.accessToken!, { planId, billingCycle }),
    onSuccess: () => {
      setMessage("Subscription selected.");
      void refreshSubscription();
    },
  });

  const changeMutation = useMutation({
    mutationFn: (planId: string) =>
      changeMySubscriptionPlan(auth.accessToken!, { planId, billingCycle }),
    onSuccess: () => {
      setMessage("Subscription plan changed.");
      void refreshSubscription();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelMySubscription(auth.accessToken!),
    onSuccess: () => {
      setMessage("Subscription cancelled.");
      void refreshSubscription();
    },
  });

  function handlePlanSubmit(event: FormEvent<HTMLFormElement>, planId: string) {
    event.preventDefault();

    if (subscriptionQuery.data?.current) {
      changeMutation.mutate(planId);
      return;
    }

    selectMutation.mutate(planId);
  }

  if (!auth.user) {
    return (
      <main className="min-h-screen bg-background px-6 py-10">
        <Link className="text-sm text-muted-foreground" to="/">
          i-Share
        </Link>
        <section className="mx-auto mt-10 max-w-xl rounded-lg border border-border bg-white p-6">
          <h1 className="text-2xl font-semibold tracking-normal">
            Sign in required
          </h1>
        </section>
      </main>
    );
  }

  if (auth.user.role !== "VENDOR") {
    return (
      <main className="min-h-screen bg-background px-6 py-10">
        <Link className="text-sm text-muted-foreground" to="/">
          i-Share
        </Link>
        <section className="mx-auto mt-10 max-w-xl rounded-lg border border-border bg-white p-6">
          <h1 className="text-2xl font-semibold tracking-normal">
            Vendor account required
          </h1>
        </section>
      </main>
    );
  }

  const current = subscriptionQuery.data?.current;

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link className="text-sm text-muted-foreground" to="/">
            i-Share
          </Link>
          <div className="flex rounded-md border border-border bg-white p-1">
            {(["MONTHLY", "YEARLY"] as const).map((cycle) => (
              <button
                className={`rounded px-3 py-2 text-sm font-medium ${
                  billingCycle === cycle
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                type="button"
              >
                {cycle === "MONTHLY" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Crown aria-hidden="true" size={21} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              Vendor subscription
            </h1>
            <p className="text-sm text-muted-foreground">
              {current ? current.status : "No active subscription"}
            </p>
          </div>
        </div>

        {message && <p className="mb-4 text-sm text-primary">{message}</p>}

        <section className="mb-5 rounded-lg border border-border bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">
                Current subscription
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {current
                  ? `${current.plan.name} until ${new Date(
                      current.endsAt,
                    ).toLocaleDateString()}`
                  : "Select an active plan to unlock vendor listing eligibility."}
              </p>
            </div>
            {current && (
              <button
                className="inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-60"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
                type="button"
              >
                <XCircle aria-hidden="true" size={18} />
                Cancel
              </button>
            )}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          {(plansQuery.data ?? []).map((plan) => {
            const amount =
              billingCycle === "MONTHLY"
                ? plan.monthlyPriceAmount
                : plan.yearlyPriceAmount;
            const isCurrent = current?.planId === plan.id;

            return (
              <form
                className="rounded-lg border border-border bg-white p-5"
                key={plan.id}
                onSubmit={(event) => handlePlanSubmit(event, plan.id)}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold tracking-normal">
                      {plan.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  {isCurrent && (
                    <span className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-700">
                      Current
                    </span>
                  )}
                </div>

                <p className="mb-5 text-3xl font-semibold tracking-normal">
                  {formatMoney(amount, plan.currency)}
                </p>

                <dl className="mb-5 space-y-2 text-sm">
                  {limitRows(plan).map(([label, value]) => (
                    <div className="flex justify-between gap-4" key={label}>
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mb-5 space-y-2 text-sm">
                  <p className="inline-flex items-center gap-2">
                    <Crown aria-hidden="true" size={16} />
                    Premium features: {plan.hasPremiumFeatures ? "Yes" : "No"}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <BarChart3 aria-hidden="true" size={16} />
                    Analytics access: {plan.hasAnalytics ? "Yes" : "No"}
                  </p>
                </div>

                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60"
                  disabled={
                    isCurrent ||
                    selectMutation.isPending ||
                    changeMutation.isPending
                  }
                  type="submit"
                >
                  {current ? (
                    <RefreshCcw aria-hidden="true" size={18} />
                  ) : (
                    <Check aria-hidden="true" size={18} />
                  )}
                  {current ? "Change plan" : "Select plan"}
                </button>
              </form>
            );
          })}
        </div>
      </section>
    </main>
  );
}
