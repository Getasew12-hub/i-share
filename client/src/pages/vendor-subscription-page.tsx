import { FormEvent, useState } from "react";
import { BarChart3, Check, Crown, RefreshCcw, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../hooks/use-auth";
import { WorkspaceShell } from "../components/business-ui";
import { AsyncState, Button, StatusBadge, Surface } from "../components/ui";
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
    <WorkspaceShell eyebrow="Vendor workspace" title="Subscription" description="Choose the plan that gives your rental business the room to grow.">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-lg border border-border bg-surface p-1">
            {(["MONTHLY", "YEARLY"] as const).map((cycle) => (
              <button
                className={`rounded-md px-3 py-2 text-sm font-bold ${
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

        <div className="mb-6 flex items-center gap-3"><Crown aria-hidden="true" className="text-primary" size={22} /><StatusBadge tone={current ? "success" : "warning"}>{current ? current.status : "No active subscription"}</StatusBadge></div>

        {message && <p className="mb-4 text-sm text-primary">{message}</p>}

        <Surface className="mb-6 p-5 sm:p-7">
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
        </Surface>

        {plansQuery.isLoading ? <AsyncState type="loading" title="Loading subscription plans" /> : <div className="grid gap-5 lg:grid-cols-3">
          {(plansQuery.data ?? []).map((plan) => {
            const amount =
              billingCycle === "MONTHLY"
                ? plan.monthlyPriceAmount
                : plan.yearlyPriceAmount;
            const isCurrent = current?.planId === plan.id;

            return (
              <form
                className={`surface-card p-5 sm:p-6 ${isCurrent ? "ring-2 ring-primary/30" : ""}`}
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
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
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

                <Button
                  className="w-full"
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
                </Button>
              </form>
            );
          })}
        </div>}
    </WorkspaceShell>
  );
}
