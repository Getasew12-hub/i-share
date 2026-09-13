import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, CalendarDays } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { createMyBooking } from "../services/booking-service";
import { getPublishedProduct } from "../services/product-service";
import { useAuth } from "../hooks/use-auth";

export function CreateBookingPage() {
  const params = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const productId = params.productId!;

  const productQuery = useQuery({
    queryKey: ["published-product", productId],
    enabled: Boolean(productId),
    queryFn: () => getPublishedProduct(productId),
  });

  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      createMyBooking(accessToken ?? "", {
        productId,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        quantity: 1,
      }),
    onSuccess: (booking) => {
      navigate(`/bookings/me/${booking.id}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const product = productQuery.data;

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <section className="mx-auto w-full max-w-2xl">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground"
          to={`/products/${productId}`}
        >
          <ChevronLeft aria-hidden="true" size={16} />
          Back to product
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-normal">
          Book this product
        </h1>

        {productQuery.isLoading && (
          <div className="mt-6 h-32 animate-pulse rounded-lg border border-border bg-white" />
        )}

        {productQuery.isError && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-white p-6 text-sm text-destructive">
            Product details could not be loaded.
          </div>
        )}

        {product && (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-border bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <CalendarDays aria-hidden="true" size={20} />
                </div>
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.pricingModel} rental
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-6">
              <h2 className="text-lg font-semibold">Select dates</h2>
              <div className="mt-4 grid gap-4">
                <div>
                  <label
                    className="block text-sm font-medium"
                    htmlFor="startsAt"
                  >
                    Start date
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                    id="startsAt"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(event) => setStartsAt(event.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium" htmlFor="endsAt">
                    End date
                  </label>
                  <input
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                    id="endsAt"
                    type="datetime-local"
                    value={endsAt}
                    onChange={(event) => setEndsAt(event.target.value)}
                  />
                </div>
              </div>

              {error && (
                <p className="mt-4 text-sm text-destructive">{error}</p>
              )}

              <button
                className="mt-6 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
                disabled={!startsAt || !endsAt || createMutation.isPending}
                onClick={() => {
                  setError(null);
                  createMutation.mutate();
                }}
              >
                {createMutation.isPending
                  ? "Creating booking..."
                  : "Request booking"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
