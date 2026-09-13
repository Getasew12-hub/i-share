import { FormEvent, useState } from "react";
import { UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/use-auth";
import type { UserRole } from "../types/auth";

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [role, setRole] =
    useState<Extract<UserRole, "CUSTOMER" | "VENDOR">>("CUSTOMER");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      displayName: String(formData.get("displayName")),
    };

    try {
      if (role === "VENDOR") {
        await auth.registerVendor({
          ...payload,
          businessName: String(formData.get("businessName") ?? "") || undefined,
        });
      } else {
        await auth.registerCustomer(payload);
      }

      navigate("/");
    } catch {
      setError("Unable to create that account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <section className="mx-auto w-full max-w-md">
        <Link
          className="mb-8 inline-block text-sm text-muted-foreground"
          to="/"
        >
          i-Share
        </Link>
        <form
          className="rounded-lg border border-border bg-white p-6"
          onSubmit={handleSubmit}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <UserPlus aria-hidden="true" size={21} />
            </div>
            <h1 className="text-2xl font-semibold tracking-normal">
              Create account
            </h1>
          </div>
          <div className="mb-5 grid grid-cols-2 rounded-md border border-border p-1">
            <button
              className={`rounded px-3 py-2 text-sm font-medium ${
                role === "CUSTOMER" ? "bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => setRole("CUSTOMER")}
              type="button"
            >
              Customer
            </button>
            <button
              className={`rounded px-3 py-2 text-sm font-medium ${
                role === "VENDOR" ? "bg-primary text-primary-foreground" : ""
              }`}
              onClick={() => setRole("VENDOR")}
              type="button"
            >
              Vendor
            </button>
          </div>
          <label className="mb-4 block text-sm font-medium">
            Display name
            <input
              className="mt-2 w-full rounded-md border border-border px-3 py-2 text-base"
              name="displayName"
              required
            />
          </label>
          {role === "VENDOR" && (
            <label className="mb-4 block text-sm font-medium">
              Business name
              <input
                className="mt-2 w-full rounded-md border border-border px-3 py-2 text-base"
                name="businessName"
              />
            </label>
          )}
          <label className="mb-4 block text-sm font-medium">
            Email
            <input
              className="mt-2 w-full rounded-md border border-border px-3 py-2 text-base"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="mb-5 block text-sm font-medium">
            Password
            <input
              className="mt-2 w-full rounded-md border border-border px-3 py-2 text-base"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              required
            />
          </label>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            <UserPlus aria-hidden="true" size={18} />
            {isSubmitting ? "Creating..." : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}
