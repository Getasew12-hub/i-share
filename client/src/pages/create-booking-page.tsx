import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, Clock3, ShieldCheck } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

import { AsyncState, Button, PageHeader, StatusBadge, Surface } from "../components/ui";
import { PriceBreakdown } from "../components/booking-ui";
import { apiErrorMessage } from "../lib/api-errors";
import { availabilityMessage, validateBookingDates } from "../lib/booking-validation";
import { checkAvailability, getAvailabilitySchedule } from "../services/availability-service";
import { createMyBooking } from "../services/booking-service";
import { getPublishedProduct } from "../services/product-service";
import { useAuth } from "../hooks/use-auth";
import type { Product } from "../types/product";

function durationUnits(start: string, end: string, model: Product["pricingModel"]) {
  const hours = (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000;
  const days = hours / 24;
  if (model === "HOURLY") return Math.max(1, Math.ceil(hours));
  if (model === "WEEKLY") return Math.max(1, Math.ceil(days / 7));
  if (model === "MONTHLY") return Math.max(1, Math.ceil(days / 30));
  return Math.max(1, Math.ceil(days));
}

function rateFor(product: Product) {
  return product.hourlyRate ?? product.dailyRate ?? product.weeklyRate ?? product.monthlyRate ?? "0";
}

export function CreateBookingPage() {
  const params = useParams();
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const productId = params.productId!;
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const productQuery = useQuery({
    queryKey: ["published-product", productId],
    enabled: Boolean(productId),
    queryFn: () => getPublishedProduct(productId),
  });
  const scheduleQuery = useQuery({
    queryKey: ["availability-schedule", productId],
    enabled: Boolean(productId),
    queryFn: () => getAvailabilitySchedule(productId),
  });
  const product = productQuery.data;

  const estimate = useMemo(() => {
    if (!product || !startsAt || !endsAt) return null;
    const dates = validateBookingDates(startsAt, endsAt);
    if (dates.error || !dates.startsAt || !dates.endsAt) return null;
    const units = durationUnits(startsAt, endsAt, product.pricingModel);
    const subtotal = Number(rateFor(product)) * units;
    const delivery = product.deliveryAvailable ? Number(product.deliveryCharge) : 0;
    const deposit = Number(product.securityDeposit);
    return {
      rentalDuration: units,
      unitPriceSnapshot: rateFor(product),
      rentalSubtotal: subtotal.toFixed(2),
      deliveryCharge: delivery.toFixed(2),
      securityDeposit: deposit.toFixed(2),
      totalAmount: (subtotal + delivery + deposit).toFixed(2),
      currency: product.currency,
    };
  }, [endsAt, product, startsAt]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const dates = validateBookingDates(startsAt, endsAt);
      if (dates.error || !dates.startsAt || !dates.endsAt) {
        throw new Error(dates.error ?? "Enter a valid booking period.");
      }
      const start = dates.startsAt.toISOString();
      const end = dates.endsAt.toISOString();
      const availability = await checkAvailability(productId, start, end);
      if (!availability.available) throw new Error(availabilityMessage(availability.conflicts));
      return createMyBooking(accessToken ?? "", { productId, startsAt: start, endsAt: end, quantity: 1 });
    },
    onSuccess: (booking) => navigate(`/bookings/me/${booking.id}`),
    onError: (requestError: unknown) => setError(apiErrorMessage(requestError, "The booking request could not be created.")),
  });

  if (!user || user.role !== "CUSTOMER") {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  function submitBooking() {
    setError(null);
    const dates = validateBookingDates(startsAt, endsAt);
    if (dates.error) {
      setError(dates.error);
      return;
    }
    if (!accessToken) {
      setError("Your session has expired. Please sign in again.");
      return;
    }
    createMutation.mutate();
  }

  return (
    <main className="page-surface">
      <section className="mx-auto max-w-[1280px] px-4 py-6 pb-12 sm:px-6 lg:px-8 lg:py-10">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary" to={`/products/${productId}`}><ChevronLeft aria-hidden="true" size={16} /> Back to product</Link>
        <div className="mt-6"><PageHeader eyebrow="Booking request" title="Reserve your rental" description="Choose your dates, review the estimate, and send the request to the vendor." /></div>

        {productQuery.isLoading && <div className="mt-8"><AsyncState type="loading" title="Loading booking details" /></div>}
        {productQuery.isError && <div className="mt-8"><AsyncState type="error" title="Product details unavailable" message="Return to the product page and try again." /></div>}

        {product && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <Surface className="overflow-hidden">
                <div className="grid gap-5 p-5 sm:grid-cols-[180px_1fr] sm:p-6">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:aspect-square">
                    {product.images[0] ? <img alt={product.name} className="h-full w-full object-cover" src={product.images[0].url} /> : <div className="flex h-full items-center justify-center text-muted-foreground"><CalendarDays aria-hidden="true" size={28} /></div>}
                  </div>
                  <div className="flex flex-col justify-center"><StatusBadge tone="success">Published listing</StatusBadge><h2 className="mt-3 text-2xl font-black tracking-[-0.03em]">{product.name}</h2><p className="mt-2 text-sm text-muted-foreground">{product.category.name} · {product.pricingModel.toLowerCase()} rental</p><p className="mt-4 text-sm text-muted-foreground">Vendor: <span className="font-semibold text-foreground">{product.vendor.displayName}</span></p></div>
                </div>
              </Surface>

              <Surface className="p-5 sm:p-7">
                <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"><CalendarDays aria-hidden="true" size={19} /></span><div><h2 className="text-xl font-black">Select your dates</h2><p className="mt-1 text-sm text-muted-foreground">Your dates will be checked against the vendor's availability before the request is sent.</p></div></div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold" htmlFor="startsAt">Start date and time<input className="control-base" id="startsAt" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label>
                  <label className="grid gap-2 text-sm font-bold" htmlFor="endsAt">End date and time<input className="control-base" id="endsAt" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label>
                </div>
                <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground"><span className="inline-flex items-center gap-2"><Clock3 aria-hidden="true" size={16} /> Charged per {product.pricingModel.toLowerCase()} unit</span><span className="inline-flex items-center gap-2"><ShieldCheck aria-hidden="true" size={16} /> Availability checked before submit</span></div>
                {scheduleQuery.isError && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-destructive">Availability could not be checked. Try again before requesting this booking.</p>}
                {scheduleQuery.data && !scheduleQuery.data.isRentable && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-destructive">This product is not currently rentable.</p>}
                {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-destructive" role="alert">{error}</p>}
              </Surface>
            </div>

            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <Surface className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">Booking summary</h2><StatusBadge tone={estimate ? "success" : "neutral"}>{estimate ? "Ready to review" : "Choose dates"}</StatusBadge></div>
                {estimate ? <div className="mt-6"><PriceBreakdown booking={estimate} estimated /><p className="mt-4 text-xs leading-5 text-muted-foreground">This is an estimate. The server calculates the final booking amount when your request is submitted.</p></div> : <div className="mt-6 rounded-xl bg-muted p-5 text-sm text-muted-foreground">Select a valid start and end time to see your estimated rental total.</div>}
                <Button className="mt-6 w-full" disabled={!estimate || createMutation.isPending || scheduleQuery.isError || scheduleQuery.data?.isRentable === false} onClick={submitBooking}>{createMutation.isPending ? "Sending request..." : "Request this rental"}</Button>
              </Surface>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
