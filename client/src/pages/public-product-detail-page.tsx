import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ImageIcon,
  MapPin,
  Package,
  ShieldCheck,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { getPublishedProduct } from "../services/product-service";
import type { Product } from "../types/product";

function firstRate(product: Product) {
  return (
    product.hourlyRate ??
    product.dailyRate ??
    product.weeklyRate ??
    product.monthlyRate ??
    "0"
  );
}

function rateLabel(product: Product) {
  return `${firstRate(product)} ${product.currency} / ${product.pricingModel.toLowerCase()}`;
}

export function PublicProductDetailPage() {
  const params = useParams();
  const productQuery = useQuery({
    queryKey: ["published-product", params.productId],
    enabled: Boolean(params.productId),
    queryFn: () => getPublishedProduct(params.productId!),
  });
  const product = productQuery.data;
  const heroImage = product?.images[0];

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <section className="mx-auto grid w-full max-w-6xl gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground"
          to="/products"
        >
          <ChevronLeft aria-hidden="true" size={16} />
          Marketplace
        </Link>

        {productQuery.isLoading && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="aspect-[4/3] animate-pulse rounded-lg border border-border bg-white" />
            <div className="h-96 animate-pulse rounded-lg border border-border bg-white" />
          </div>
        )}

        {productQuery.isError && (
          <div className="rounded-lg border border-destructive/40 bg-white p-6 text-sm text-destructive">
            Product details could not be loaded.
          </div>
        )}

        {product && (
          <article className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="grid gap-4">
              <div className="overflow-hidden rounded-lg border border-border bg-white">
                <div className="aspect-[4/3] bg-muted">
                  {heroImage ? (
                    <img
                      alt={heroImage.altText ?? product.name}
                      className="h-full w-full object-cover"
                      src={heroImage.url}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImageIcon aria-hidden="true" size={42} />
                    </div>
                  )}
                </div>
              </div>

              {product.images.length > 1 && (
                <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
                  {product.images.slice(1, 6).map((image) => (
                    <img
                      alt={image.altText ?? product.name}
                      className="aspect-square rounded-md border border-border object-cover"
                      key={image.id}
                      src={image.url}
                    />
                  ))}
                </div>
              )}

              <section className="rounded-lg border border-border bg-white p-5">
                <p className="text-sm font-medium text-muted-foreground">
                  {product.category.name}
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                  {product.name}
                </h1>
                <p className="mt-4 leading-7 text-muted-foreground">
                  {product.description}
                </p>
              </section>
            </section>

            <aside className="grid h-fit gap-4">
              <section className="rounded-lg border border-border bg-white p-5">
                <p className="text-sm text-muted-foreground">Rental rate</p>
                <p className="mt-1 text-2xl font-semibold tracking-normal">
                  {rateLabel(product)}
                </p>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  <p>
                    Security deposit: {product.securityDeposit}{" "}
                    {product.currency}
                  </p>
                  <p>
                    Delivery:{" "}
                    {product.deliveryAvailable
                      ? `${product.deliveryCharge} ${product.currency}`
                      : "Not listed"}
                  </p>
                </div>
                {product.availabilitySummary.hasAvailability && (
                  <Link
                    className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                    to={`/products/${product.id}/book`}
                  >
                    Book now
                  </Link>
                )}
              </section>

              <section className="rounded-lg border border-border bg-white p-5">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-normal">
                  <Package aria-hidden="true" size={20} />
                  Vendor
                </h2>
                <p className="mt-3 font-medium">{product.vendor.displayName}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin aria-hidden="true" size={16} />
                  {[product.vendor.city, product.vendor.country]
                    .filter(Boolean)
                    .join(", ") || "Location not specified"}
                </p>
              </section>

              <section className="rounded-lg border border-border bg-white p-5">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-normal">
                  <CalendarDays aria-hidden="true" size={20} />
                  Availability
                </h2>
                <div className="mt-4 grid gap-2 text-sm">
                  <p className="inline-flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck aria-hidden="true" size={16} />
                    {product.availabilitySummary.hasAvailability
                      ? `${product.availabilitySummary.availablePeriods} available period${
                          product.availabilitySummary.availablePeriods === 1
                            ? ""
                            : "s"
                        } listed`
                      : "No available periods listed"}
                  </p>
                  {product.availabilityPeriods.map((period) => (
                    <p
                      className="rounded-md border border-border px-3 py-2"
                      key={period.id}
                    >
                      {period.type}:{" "}
                      {new Date(period.startsAt).toLocaleString()} to{" "}
                      {new Date(period.endsAt).toLocaleString()}
                    </p>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-white p-5">
                <h2 className="text-lg font-semibold tracking-normal">
                  Location
                </h2>
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin aria-hidden="true" size={16} />
                  {[product.city, product.country].filter(Boolean).join(", ") ||
                    "Location not specified"}
                </p>
              </section>
            </aside>
          </article>
        )}
      </section>
    </main>
  );
}
