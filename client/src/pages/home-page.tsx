import { useQuery } from "@tanstack/react-query";
import { Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../hooks/use-auth";
import { getHealth } from "../services/health-service";

export function HomePage() {
  const auth = useAuth();
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    retry: 1,
  });

  const isHealthy = healthQuery.data?.status === "ok";

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Activity aria-hidden="true" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Rental marketplace foundation
            </p>
            <h1 className="text-4xl font-semibold tracking-normal text-foreground">
              i-Share
            </h1>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          {auth.user ? (
            <>
              <span className="text-sm text-muted-foreground">
                Signed in as {auth.user.email} ({auth.user.role})
              </span>
              <button
                className="rounded-md border border-border px-3 py-2 text-sm font-medium"
                onClick={() => void auth.logout()}
                type="button"
              >
                Sign out
              </button>
              {auth.user.role === "VENDOR" && (
                <>
                  <Link
                    className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                    to="/vendor/onboarding"
                  >
                    Vendor onboarding
                  </Link>
                  <Link
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium"
                    to="/vendor/subscription"
                  >
                    Subscription
                  </Link>
                  <Link
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium"
                    to="/vendor/products"
                  >
                    Products
                  </Link>
                </>
              )}
              {auth.user.role === "ADMIN" && (
                <Link
                  className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                  to="/admin/vendors"
                >
                  Vendor review
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                to="/login"
              >
                Sign in
              </Link>
              <Link
                className="rounded-md border border-border px-3 py-2 text-sm font-medium"
                to="/register"
              >
                Create account
              </Link>
            </>
          )}
          <Link
            className="rounded-md border border-border px-3 py-2 text-sm font-medium"
            to="/products"
          >
            Browse products
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-lg border border-border bg-white p-6">
            <h2 className="mb-3 text-2xl font-semibold tracking-normal">
              Project foundation is running
            </h2>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              This first screen only verifies that the React client can reach
              the Express API. Marketplace features will be added in later
              approved phases.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              {isHealthy ? (
                <CheckCircle2 className="text-primary" aria-hidden="true" />
              ) : (
                <AlertCircle className="text-amber-600" aria-hidden="true" />
              )}
              <h2 className="text-lg font-semibold tracking-normal">
                API health
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {healthQuery.isLoading && "Checking backend..."}
              {healthQuery.isError && "Backend health check is unavailable."}
              {isHealthy &&
                `${healthQuery.data?.service} responded successfully.`}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
