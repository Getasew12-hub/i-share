import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { apiErrorMessage } from "../lib/api-errors";
import { useAuth } from "../hooks/use-auth";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      await auth.login({
        email: String(formData.get("email")),
        password: String(formData.get("password")),
      });
      const from = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(from, { replace: true });
    } catch (requestError) {
      setError(
        apiErrorMessage(requestError, "Unable to sign in with those credentials."),
      );
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
              <LogIn aria-hidden="true" size={21} />
            </div>
            <h1 className="text-2xl font-semibold tracking-normal">Sign in</h1>
          </div>
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
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            <LogIn aria-hidden="true" size={18} />
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            New to i-Share?{" "}
            <Link className="font-semibold text-primary hover:underline" to="/register">
              Create account
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
