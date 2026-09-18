import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Compass, Search, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { ProductGrid } from "../components/product-card";
import { AsyncState, Button, Surface } from "../components/ui";
import { useAuth } from "../hooks/use-auth";
import { listCategories, listPublishedProducts } from "../services/product-service";

export function HomePage() {
  const { user } = useAuth();
  const categoriesQuery = useQuery({
    queryKey: ["home-categories"],
    queryFn: listCategories,
  });
  const productsQuery = useQuery({
    queryKey: ["home-featured-products"],
    queryFn: () => listPublishedProducts({ limit: 4, page: 1, sort: "newest" }),
  });

  return (
    <main className="page-surface">
      <section className="mx-auto max-w-[1600px] px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-primary px-6 py-12 text-primary-foreground shadow-2xl shadow-primary/15 sm:px-10 lg:px-16 lg:py-20">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground/70">
              <Compass aria-hidden="true" size={16} /> Rent better, live lighter
            </p>
            <h1 className="max-w-xl text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-7xl">
              The things you need, when you need them.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-primary-foreground/78 sm:text-lg">
              Discover trusted rental products from local vendors for work,
              weekends, celebrations, and everything between.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products">
                <Button variant="secondary">
                  Explore the marketplace <ArrowRight aria-hidden="true" size={17} />
                </Button>
              </Link>
              {!user && (
                <Link to="/register">
                  <Button className="border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20" variant="quiet">
                    Join i-Share
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full border-[32px] border-secondary/25 sm:size-[28rem]" />
          <div className="pointer-events-none absolute -bottom-40 right-24 size-72 rounded-full border-[20px] border-primary-foreground/10" />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            [ShieldCheck, "Trusted listings", "Clear details from verified vendors"],
            [CheckCircle2, "Simple booking", "Check availability before you request"],
            [Compass, "Made local", "Find useful things close to you"],
          ].map(([Icon, title, description]) => (
            <Surface className="flex items-start gap-4 p-5" key={title as string}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                <Icon aria-hidden="true" size={19} />
              </span>
              <div>
                <p className="font-bold">{title as string}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {description as string}
                </p>
              </div>
            </Surface>
          ))}
        </div>

        <section className="mt-16">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Start exploring
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
                Browse by category
              </h2>
            </div>
            <Link className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline" to="/products">
              View all products <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          {categoriesQuery.isLoading ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => <div className="h-20 animate-pulse rounded-xl bg-muted" key={item} />)}
            </div>
          ) : categoriesQuery.isError ? (
            <p className="mt-6 text-sm text-destructive">Categories could not be loaded.</p>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(categoriesQuery.data ?? []).slice(0, 8).map((category) => (
                <Link
                  className="group flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  key={category.id}
                  to={`/products?category=${category.slug}`}
                >
                  <span className="font-bold">{category.name}</span>
                  <ArrowRight aria-hidden="true" className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" size={17} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-16">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Fresh on the marketplace
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
                Find your next rental
              </h2>
            </div>
            <Link className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline" to="/products">
              See the full collection <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="mt-6">
            {productsQuery.isLoading && <AsyncState type="loading" title="Loading products" />}
            {productsQuery.isError && <AsyncState type="error" title="Products are unavailable" message="Try the marketplace again in a moment." />}
            {productsQuery.data && productsQuery.data.products.length > 0 && <ProductGrid products={productsQuery.data.products} />}
            {productsQuery.data && productsQuery.data.products.length === 0 && <AsyncState type="empty" title="No products yet" message="New rental listings will appear here soon." />}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-border bg-secondary/20 p-6 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Ready when you are</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] sm:text-3xl">Search for something useful today.</h2>
            </div>
            <Link to="/products">
              <Button><Search aria-hidden="true" size={17} /> Search rentals</Button>
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
