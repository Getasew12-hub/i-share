import { CalendarDays, MapPin, ArrowUpRight, ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

import type { Product } from "../types/product";
import { StatusBadge } from "./ui";

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

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];

  return (
    <Link
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl focus-visible:-translate-y-1"
      to={`/products/${product.id}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {image ? (
          <img
            alt={image.altText ?? product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            src={image.url}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageIcon aria-hidden="true" size={34} />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge tone={product.availabilitySummary.hasAvailability ? "success" : "neutral"}>
            {product.availabilitySummary.hasAvailability ? "Available" : "Check dates"}
          </StatusBadge>
        </div>
        <span className="absolute bottom-3 right-3 inline-flex size-10 items-center justify-center rounded-full bg-surface/95 text-foreground shadow-sm transition group-hover:bg-primary group-hover:text-primary-foreground">
          <ArrowUpRight aria-hidden="true" size={18} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
          {product.category.name}
        </p>
        <h2 className="mt-2 line-clamp-2 text-lg font-bold leading-tight text-foreground">
          {product.name}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {product.description}
        </p>

        <div className="mt-auto pt-5">
          <p className="text-lg font-bold text-foreground">{rateLabel(product)}</p>
          <div className="mt-3 grid gap-2 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <MapPin aria-hidden="true" size={14} />
              {[product.city, product.country].filter(Boolean).join(", ") || "Location not specified"}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays aria-hidden="true" size={14} />
              {product.availabilitySummary.hasAvailability
                ? `${product.availabilitySummary.availablePeriods} period${product.availabilitySummary.availablePeriods === 1 ? "" : "s"} listed`
                : "Availability not listed"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
