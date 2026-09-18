import { FormEvent, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  ImageIcon,
  MapPin,
  PackageSearch,
  Search,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import {
  listCategories,
  listPublishedProducts,
} from "../services/product-service";
import type {
  MarketplaceFilters,
  MarketplaceSort,
  Product,
} from "../types/product";

const sortOptions: { value: MarketplaceSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
];

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

function formValue(data: FormData, key: string) {
  const value = data.get(key)?.toString().trim();

  return value || undefined;
}

function filtersFromParams(params: URLSearchParams): MarketplaceFilters {
  const page = Number(params.get("page") ?? "1");

  return {
    query: params.get("query") ?? undefined,
    category: params.get("category") ?? undefined,
    minPrice: params.get("minPrice") ?? undefined,
    maxPrice: params.get("maxPrice") ?? undefined,
    location: params.get("location") ?? undefined,
    availableOn: params.get("availableOn") ?? undefined,
    sort: (params.get("sort") as MarketplaceSort | null) ?? "newest",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: 12,
  };
}

function ProductCard({ product }: { product: Product }) {
  const image = product.images[0];

  return (
    <Link
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
      to={`/products/${product.id}`}
    >
      <div className="aspect-[4/3] bg-muted">
        {image ? (
          <img
            alt={image.altText ?? product.name}
            className="h-full w-full object-cover"
            src={image.url}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageIcon aria-hidden="true" size={32} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {product.category.name}
          </p>
          <h2 className="mt-1 line-clamp-2 text-lg font-bold leading-tight group-hover:text-primary">
            {product.name}
          </h2>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>
        <div className="grid gap-2 text-sm">
          <p className="text-lg font-bold">{rateLabel(product)}</p>
          <p className="inline-flex items-center gap-2 text-muted-foreground">
            <MapPin aria-hidden="true" size={16} />
            {[product.city, product.country].filter(Boolean).join(", ") ||
              "Location not specified"}
          </p>
          <p className="inline-flex items-center gap-2 text-muted-foreground">
            <CalendarDays aria-hidden="true" size={16} />
            {product.availabilitySummary.hasAvailability
              ? `${product.availabilitySummary.availablePeriods} availability period${
                  product.availabilitySummary.availablePeriods === 1 ? "" : "s"
                }`
              : "Availability not listed"}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function PublicProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(
    () => filtersFromParams(searchParams),
    [searchParams],
  );
  const [formError, setFormError] = useState<string | null>(null);
  const categoriesQuery = useQuery({
    queryKey: ["product-categories"],
    queryFn: listCategories,
  });
  const productsQuery = useQuery({
    queryKey: ["published-products", filters],
    queryFn: () => listPublishedProducts(filters),
  });
  const products = productsQuery.data?.products ?? [];
  const pagination = productsQuery.data?.pagination;

  function updateParams(nextFilters: MarketplaceFilters) {
    const next = new URLSearchParams();

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && key !== "limit") {
        next.set(key, String(value));
      }
    });

    setSearchParams(next);
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const minPrice = formValue(data, "minPrice");
    const maxPrice = formValue(data, "maxPrice");

    if (
      minPrice &&
      maxPrice &&
      Number.isFinite(Number(minPrice)) &&
      Number.isFinite(Number(maxPrice)) &&
      Number(minPrice) > Number(maxPrice)
    ) {
      setFormError("Maximum price must be at least the minimum price.");
      return;
    }

    setFormError(null);
    updateParams({
      query: formValue(data, "query"),
      category: formValue(data, "category"),
      minPrice,
      maxPrice,
      location: formValue(data, "location"),
      availableOn: formValue(data, "availableOn"),
      sort: (formValue(data, "sort") as MarketplaceSort) ?? "newest",
      page: 1,
    });
  }

  function changePage(page: number) {
    updateParams({ ...filters, page });
  }

  return (
    <main className="page-surface">
      <section className="mx-auto grid w-full max-w-[1600px] gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="flex items-center justify-between gap-3">
          <Link className="text-sm text-muted-foreground" to="/">
            i-Share
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <PackageSearch aria-hidden="true" size={21} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-[-0.03em]">
                Marketplace
              </h1>
              <p className="text-sm text-muted-foreground">
                Search published rental listings.
              </p>
            </div>
          </div>
          {pagination && (
            <p className="text-sm text-muted-foreground">
              {pagination.total} published product
              {pagination.total === 1 ? "" : "s"}
            </p>
          )}
        </div>

        <form
          className="surface-card grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]"
          onSubmit={submitFilters}
        >
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Search</span>
            <span className="relative">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                className="control-base h-11 w-full pl-9 pr-3 text-sm"
                defaultValue={filters.query}
                name="query"
                placeholder="Product or category"
              />
            </span>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Category</span>
            <select
              className="control-base h-11 rounded-lg px-3 text-sm"
              defaultValue={filters.category}
              name="category"
            >
              <option value="">All categories</option>
              {(categoriesQuery.data ?? []).map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Price</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="control-base h-11 rounded-lg px-3 text-sm"
                defaultValue={filters.minPrice}
                min="0"
                name="minPrice"
                placeholder="Min"
                type="number"
              />
              <input
                className="control-base h-11 rounded-lg px-3 text-sm"
                defaultValue={filters.maxPrice}
                min="0"
                name="maxPrice"
                placeholder="Max"
                type="number"
              />
            </div>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Location</span>
            <input
              className="control-base h-11 rounded-lg px-3 text-sm"
              defaultValue={filters.location}
              name="location"
              placeholder="City or country"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Date</span>
            <input
              className="control-base h-11 rounded-lg px-3 text-sm"
              defaultValue={filters.availableOn}
              name="availableOn"
              type="date"
            />
          </label>

          <div className="grid gap-1 text-sm">
            <span className="font-medium">Sort</span>
            <div className="flex gap-2">
              <select
                className="control-base h-11 rounded-lg px-3 text-sm"
                defaultValue={filters.sort}
                name="sort"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                className="inline-flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary/90"
                title="Apply filters"
                type="submit"
              >
                <Filter aria-hidden="true" size={18} />
              </button>
            </div>
          </div>
        </form>

        {formError && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        )}

        {productsQuery.isLoading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                className="h-96 animate-pulse rounded-2xl bg-muted"
                key={index}
              />
            ))}
          </div>
        )}

        {productsQuery.isError && (
          <div className="rounded-lg border border-destructive/40 bg-white p-6 text-sm text-destructive">
            Marketplace products could not be loaded.
          </div>
        )}

        {!productsQuery.isLoading && !productsQuery.isError && (
          <>
            {products.length ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="surface-card p-10 text-center">
                <PackageSearch
                  aria-hidden="true"
                  className="mx-auto text-muted-foreground"
                  size={34}
                />
                <h2 className="mt-3 text-lg font-semibold tracking-normal">
                  No products found
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different search term, category, price, location, or
                  date.
                </p>
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between gap-3">
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm disabled:opacity-50"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => changePage(pagination.page - 1)}
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" size={16} />
                  Previous
                </button>
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm disabled:opacity-50"
                  disabled={!pagination.hasNextPage}
                  onClick={() => changePage(pagination.page + 1)}
                  type="button"
                >
                  Next
                  <ChevronRight aria-hidden="true" size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
