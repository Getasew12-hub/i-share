import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ImageIcon,
  MapPin,
  Package,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";

import { Surface, AsyncState, Button, StatusBadge } from "../components/ui";
import { getPublishedProduct } from "../services/product-service";
import { reviewService } from "../services/review-service";
import { useAuth } from "../hooks/use-auth";
import type { Product } from "../types/product";

function firstRate(product: Product) {
  return product.hourlyRate ?? product.dailyRate ?? product.weeklyRate ?? product.monthlyRate ?? "0";
}

function rateLabel(product: Product) {
  return `${firstRate(product)} ${product.currency} / ${product.pricingModel.toLowerCase()}`;
}

export function PublicProductDetailPage() {
  const params = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const productQuery = useQuery({
    queryKey: ["published-product", params.productId],
    enabled: Boolean(params.productId),
    queryFn: () => getPublishedProduct(params.productId!),
  });
  const reviewsQuery = useQuery({
    queryKey: ["product-reviews", params.productId],
    enabled: Boolean(params.productId),
    queryFn: () => reviewService.listProductReviews(params.productId!),
  });
  const ratingQuery = useQuery({
    queryKey: ["product-rating", params.productId],
    enabled: Boolean(params.productId),
    queryFn: () => reviewService.getProductRating(params.productId!),
  });
  const product = productQuery.data;
  const heroImage = product?.images[selectedImage] ?? product?.images[0];
  const bookPath = product ? `/products/${product.id}/book` : "/products";

  if (productQuery.isLoading) {
    return <main className="page-surface"><section className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8"><AsyncState type="loading" title="Loading product" /></section></main>;
  }

  if (productQuery.isError || !product) {
    return <main className="page-surface"><section className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8"><AsyncState type="error" title="Product unavailable" message="This listing could not be loaded. Return to the marketplace to keep browsing." /></section></main>;
  }

  return (
    <main className="page-surface">
      <section className="mx-auto max-w-[1320px] px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-10 lg:pb-12">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary" to="/products">
          <ChevronLeft aria-hidden="true" size={16} /> Marketplace
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(400px,440px)]">
          <div className="min-w-0">
            <div className="aspect-[4/3] max-h-[520px] overflow-hidden rounded-2xl bg-muted shadow-xl shadow-foreground/5 sm:aspect-[16/10] lg:aspect-[4/3]">
              {heroImage ? (
                <img alt={heroImage.altText ?? product.name} className="h-full w-full object-cover" src={heroImage.url} />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground"><ImageIcon aria-hidden="true" size={48} /></div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
                {product.images.slice(0, 6).map((image, index) => (
                  <button
                    aria-label={`View product image ${index + 1}`}
                    className={`aspect-square overflow-hidden rounded-xl border-2 bg-muted ${index === selectedImage ? "border-primary" : "border-transparent"}`}
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    type="button"
                  >
                    <img alt="" className="h-full w-full object-cover" src={image.url} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <Surface className="p-5 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={product.availabilitySummary.hasAvailability ? "success" : "neutral"}>
                  {product.availabilitySummary.hasAvailability ? "Available to request" : "Check availability"}
                </StatusBadge>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{product.category.name}</span>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">{product.name}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {ratingQuery.data && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold"><Star aria-hidden="true" className="fill-secondary text-secondary" size={17} /> {ratingQuery.data.rating.average.toFixed(1)} ({ratingQuery.data.rating.count})</span>
                )}
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><MapPin aria-hidden="true" size={15} />{[product.city, product.country].filter(Boolean).join(", ") || "Location not specified"}</span>
              </div>
              <div className="mt-7 border-y border-border py-5">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Rental rate</p>
                <p className="mt-1 text-3xl font-black">{rateLabel(product)}</p>
                <p className="mt-2 text-sm text-muted-foreground">Pricing is calculated from the selected rental period.</p>
              </div>
              <div className="mt-5 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Security deposit</span><span className="font-bold">{product.securityDeposit} {product.currency}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="inline-flex items-center gap-2 text-muted-foreground"><Truck aria-hidden="true" size={15} /> Delivery</span><span className="font-bold">{product.deliveryAvailable ? `${product.deliveryCharge} ${product.currency}` : "Not offered"}</span></div>
              </div>
              <Link
                className="mt-7 hidden min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 transition hover:bg-primary/90 sm:inline-flex"
                state={user ? undefined : { from: `${location.pathname}/book` }}
                to={user ? bookPath : "/login"}
              >
                {user ? "Book this rental" : "Sign in to book"}
              </Link>
            </Surface>

            <Surface className="mt-4 p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"><ShieldCheck aria-hidden="true" size={19} /></span>
                <div><p className="font-bold">{product.vendor.displayName}</p><p className="mt-1 text-sm text-muted-foreground">Published vendor listing · {[product.vendor.city, product.vendor.country].filter(Boolean).join(", ") || "Location not specified"}</p></div>
              </div>
            </Surface>
          </aside>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
          <div className="space-y-6">
            <Surface className="p-5 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">About this rental</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">Everything you need to know</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-8 text-muted-foreground">{product.description}</p>
            </Surface>

            <Surface className="p-5 sm:p-7">
              <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Reviews</p><h2 className="mt-2 text-2xl font-black">What renters say</h2></div>{ratingQuery.data && <span className="text-sm font-bold">{ratingQuery.data.rating.average.toFixed(1)} / 5</span>}</div>
              {reviewsQuery.isLoading && <p className="mt-5 text-sm text-muted-foreground">Loading published reviews...</p>}
              {reviewsQuery.isError && <p className="mt-5 text-sm text-destructive">Reviews could not be loaded.</p>}
              {reviewsQuery.data?.reviews.length === 0 && <p className="mt-5 text-sm text-muted-foreground">No published reviews yet.</p>}
              <div className="mt-5 divide-y divide-border">
                {reviewsQuery.data?.reviews.map((review) => (
                  <article className="py-4 first:pt-0 last:pb-0" key={review.id}><div className="flex items-center justify-between gap-4"><p className="font-bold">{review.customer?.displayName ?? "Renter"}</p><span className="inline-flex items-center gap-1 text-sm font-bold"><Star aria-hidden="true" className="fill-secondary text-secondary" size={15} /> {review.rating}/5</span></div>{review.comment && <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.comment}</p>}</article>
                ))}
              </div>
            </Surface>
          </div>

          <div className="space-y-6">
            <Surface className="p-5 sm:p-6">
              <div className="flex items-center gap-3"><CalendarDays aria-hidden="true" className="text-primary" size={20} /><h2 className="text-lg font-black">Availability</h2></div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{product.availabilitySummary.hasAvailability ? `${product.availabilitySummary.availablePeriods} available period${product.availabilitySummary.availablePeriods === 1 ? "" : "s"} listed.` : "No available periods are currently listed."}</p>
              <div className="mt-4 grid gap-2">{product.availabilityPeriods.map((period) => <div className="rounded-xl bg-muted p-3 text-sm" key={period.id}><p className="font-bold">{period.type}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(period.startsAt).toLocaleString()} to {new Date(period.endsAt).toLocaleString()}</p></div>)}</div>
            </Surface>
            <Surface className="p-5 sm:p-6"><h2 className="text-lg font-black">Rental details</h2><div className="mt-4 grid gap-3 text-sm"><div className="flex justify-between gap-4"><span className="text-muted-foreground">Rental unit</span><span className="font-bold">{product.pricingModel.toLowerCase()}</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Location</span><span className="text-right font-bold">{[product.city, product.country].filter(Boolean).join(", ") || "Not specified"}</span></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Delivery</span><span className="font-bold">{product.deliveryAvailable ? "Available" : "Pickup"}</span></div></div></Surface>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 p-3 shadow-2xl backdrop-blur sm:hidden">
        <Link className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground" state={user ? undefined : { from: `${location.pathname}/book` }} to={user ? bookPath : "/login"}>{user ? "Book this rental" : "Sign in to book"}</Link>
      </div>
    </main>
  );
}
