import { FormEvent, useState } from "react";
import {
  Archive,
  CalendarPlus,
  Check,
  Eye,
  PackagePlus,
  Pencil,
  RefreshCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../hooks/use-auth";
import {
  changeMyProductStatus,
  createMyAvailability,
  createMyProduct,
  deactivateMyProduct,
  listCategories,
  listMyProducts,
  updateMyProduct,
} from "../services/product-service";
import type {
  AvailabilityPayload,
  PricingModel,
  Product,
  ProductPayload,
} from "../types/product";

const emptyProduct: ProductPayload = {
  categoryId: "",
  name: "",
  description: "",
  pricingModel: "DAILY",
  dailyRate: "",
  currency: "USD",
  securityDeposit: "0",
  deliveryAvailable: false,
  deliveryCharge: "0",
  city: "",
  country: "",
  status: "DRAFT",
};

const emptyAvailability: AvailabilityPayload = {
  type: "AVAILABLE",
  startsAt: "",
  endsAt: "",
  reason: "",
};

function productToPayload(product: Product): ProductPayload {
  return {
    categoryId: product.categoryId,
    name: product.name,
    description: product.description,
    pricingModel: product.pricingModel,
    hourlyRate: product.hourlyRate ?? "",
    dailyRate: product.dailyRate ?? "",
    weeklyRate: product.weeklyRate ?? "",
    monthlyRate: product.monthlyRate ?? "",
    currency: product.currency,
    securityDeposit: product.securityDeposit,
    deliveryAvailable: product.deliveryAvailable,
    deliveryCharge: product.deliveryCharge,
    city: product.city ?? "",
    country: product.country ?? "",
    status:
      product.status === "PUBLISHED" || product.status === "UNPUBLISHED"
        ? product.status
        : "DRAFT",
  };
}

function localToIso(value: string) {
  return new Date(value).toISOString();
}

function activeRateField(pricingModel: PricingModel) {
  return `${pricingModel.toLowerCase()}Rate` as keyof ProductPayload;
}

export function VendorProductsPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductPayload>(emptyProduct);
  const [availabilityForm, setAvailabilityForm] =
    useState<AvailabilityPayload>(emptyAvailability);
  const [message, setMessage] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });
  const productsQuery = useQuery({
    queryKey: ["my-products"],
    enabled: Boolean(auth.accessToken && auth.user?.role === "VENDOR"),
    queryFn: () => listMyProducts(auth.accessToken!),
  });

  const refreshProducts = () =>
    queryClient.invalidateQueries({ queryKey: ["my-products"] });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (selectedProduct) {
        return updateMyProduct(auth.accessToken!, selectedProduct.id, form);
      }

      return createMyProduct(auth.accessToken!, form);
    },
    onSuccess: (product) => {
      setMessage(selectedProduct ? "Product updated." : "Product created.");
      setSelectedProduct(product);
      setForm(productToPayload(product));
      void refreshProducts();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      product,
      status,
    }: {
      product: Product;
      status: Product["status"];
    }) => changeMyProductStatus(auth.accessToken!, product.id, status),
    onSuccess: (product) => {
      setMessage(`Product moved to ${product.status.toLowerCase()}.`);
      setSelectedProduct(product);
      setForm(productToPayload(product));
      void refreshProducts();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (product: Product) =>
      deactivateMyProduct(auth.accessToken!, product.id),
    onSuccess: (product) => {
      setMessage("Product archived.");
      setSelectedProduct(product);
      setForm(productToPayload(product));
      void refreshProducts();
    },
  });

  const availabilityMutation = useMutation({
    mutationFn: () =>
      createMyAvailability(auth.accessToken!, selectedProduct!.id, {
        ...availabilityForm,
        startsAt: localToIso(availabilityForm.startsAt),
        endsAt: localToIso(availabilityForm.endsAt),
      }),
    onSuccess: () => {
      setAvailabilityForm(emptyAvailability);
      setMessage("Availability period added.");
      void refreshProducts();
    },
  });

  function selectProduct(product: Product | null) {
    setSelectedProduct(product);
    setForm(product ? productToPayload(product) : emptyProduct);
    setMessage(null);
  }

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveMutation.mutate();
  }

  function submitAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    availabilityMutation.mutate();
  }

  if (!auth.user) {
    return (
      <main className="min-h-screen bg-background px-6 py-10">
        <Link className="text-sm text-muted-foreground" to="/">
          i-Share
        </Link>
        <section className="mx-auto mt-10 max-w-xl rounded-lg border border-border bg-white p-6">
          <h1 className="text-2xl font-semibold tracking-normal">
            Sign in required
          </h1>
        </section>
      </main>
    );
  }

  if (auth.user.role !== "VENDOR") {
    return (
      <main className="min-h-screen bg-background px-6 py-10">
        <Link className="text-sm text-muted-foreground" to="/">
          i-Share
        </Link>
        <section className="mx-auto mt-10 max-w-xl rounded-lg border border-border bg-white p-6">
          <h1 className="text-2xl font-semibold tracking-normal">
            Vendor account required
          </h1>
        </section>
      </main>
    );
  }

  const products = productsQuery.data ?? [];
  const rateField = activeRateField(form.pricingModel);

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link className="text-sm text-muted-foreground" to="/">
            i-Share
          </Link>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => selectProduct(null)}
            type="button"
          >
            <PackagePlus aria-hidden="true" size={18} />
            New product
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <PackagePlus aria-hidden="true" size={21} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              My products
            </h1>
            <p className="text-sm text-muted-foreground">
              Create listings, publish eligible products, and manage
              availability.
            </p>
          </div>
        </div>

        {message && <p className="mb-4 text-sm text-primary">{message}</p>}
        {(saveMutation.isError ||
          statusMutation.isError ||
          archiveMutation.isError ||
          availabilityMutation.isError) && (
          <p className="mb-4 text-sm text-red-700">
            The request was rejected by the server.
          </p>
        )}

        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-lg border border-border bg-white p-5">
            <h2 className="mb-4 text-xl font-semibold tracking-normal">
              Product list
            </h2>
            <div className="space-y-3">
              {products.map((product) => (
                <button
                  className="w-full rounded-md border border-border p-3 text-left hover:border-primary"
                  key={product.id}
                  onClick={() => selectProduct(product)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.category.name} · {product.status}
                      </p>
                    </div>
                    <Eye aria-hidden="true" size={18} />
                  </div>
                </button>
              ))}
              {!products.length && (
                <p className="text-sm text-muted-foreground">
                  No products yet.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-white p-5">
            <h2 className="mb-4 text-xl font-semibold tracking-normal">
              {selectedProduct ? "Edit product" : "Create product"}
            </h2>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={submitProduct}
            >
              <label className="text-sm">
                Category
                <select
                  className="mt-1 w-full rounded-md border border-border px-3 py-2"
                  required
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm({ ...form, categoryId: event.target.value })
                  }
                >
                  <option value="">Select category</option>
                  {(categoriesQuery.data ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Name
                <input
                  className="mt-1 w-full rounded-md border border-border px-3 py-2"
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </label>
              <label className="text-sm md:col-span-2">
                Description
                <textarea
                  className="mt-1 min-h-24 w-full rounded-md border border-border px-3 py-2"
                  required
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>
              <label className="text-sm">
                Pricing
                <select
                  className="mt-1 w-full rounded-md border border-border px-3 py-2"
                  value={form.pricingModel}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      pricingModel: event.target.value as PricingModel,
                    })
                  }
                >
                  <option value="HOURLY">Hourly</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </label>
              <label className="text-sm">
                Active rate
                <input
                  className="mt-1 w-full rounded-md border border-border px-3 py-2"
                  min="0"
                  required
                  type="number"
                  value={String(form[rateField] ?? "")}
                  onChange={(event) =>
                    setForm({ ...form, [rateField]: event.target.value })
                  }
                />
              </label>
              <label className="text-sm">
                Currency
                <input
                  className="mt-1 w-full rounded-md border border-border px-3 py-2"
                  maxLength={3}
                  required
                  value={form.currency}
                  onChange={(event) =>
                    setForm({ ...form, currency: event.target.value })
                  }
                />
              </label>
              <label className="text-sm">
                Deposit
                <input
                  className="mt-1 w-full rounded-md border border-border px-3 py-2"
                  min="0"
                  type="number"
                  value={form.securityDeposit}
                  onChange={(event) =>
                    setForm({ ...form, securityDeposit: event.target.value })
                  }
                />
              </label>
              <label className="text-sm">
                City
                <input
                  className="mt-1 w-full rounded-md border border-border px-3 py-2"
                  value={form.city}
                  onChange={(event) =>
                    setForm({ ...form, city: event.target.value })
                  }
                />
              </label>
              <label className="text-sm">
                Country
                <input
                  className="mt-1 w-full rounded-md border border-border px-3 py-2"
                  value={form.country}
                  onChange={(event) =>
                    setForm({ ...form, country: event.target.value })
                  }
                />
              </label>
              {!selectedProduct && (
                <label className="text-sm">
                  Initial status
                  <select
                    className="mt-1 w-full rounded-md border border-border px-3 py-2"
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as ProductPayload["status"],
                      })
                    }
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </label>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={form.deliveryAvailable}
                  type="checkbox"
                  onChange={(event) =>
                    setForm({
                      ...form,
                      deliveryAvailable: event.target.checked,
                    })
                  }
                />
                Delivery available
              </label>
              <div className="md:col-span-2 flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                  disabled={saveMutation.isPending}
                  type="submit"
                >
                  {selectedProduct ? (
                    <Pencil aria-hidden="true" size={18} />
                  ) : (
                    <Check aria-hidden="true" size={18} />
                  )}
                  {selectedProduct ? "Update" : "Create"}
                </button>
                {selectedProduct && selectedProduct.status !== "PUBLISHED" && (
                  <button
                    className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium"
                    onClick={() =>
                      statusMutation.mutate({
                        product: selectedProduct,
                        status: "PUBLISHED",
                      })
                    }
                    type="button"
                  >
                    <RefreshCcw aria-hidden="true" size={18} />
                    Publish
                  </button>
                )}
                {selectedProduct && selectedProduct.status === "PUBLISHED" && (
                  <button
                    className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium"
                    onClick={() =>
                      statusMutation.mutate({
                        product: selectedProduct,
                        status: "UNPUBLISHED",
                      })
                    }
                    type="button"
                  >
                    <RefreshCcw aria-hidden="true" size={18} />
                    Unpublish
                  </button>
                )}
                {selectedProduct && selectedProduct.status !== "ARCHIVED" && (
                  <button
                    className="inline-flex items-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700"
                    onClick={() => archiveMutation.mutate(selectedProduct)}
                    type="button"
                  >
                    <Archive aria-hidden="true" size={18} />
                    Archive
                  </button>
                )}
              </div>
            </form>

            {selectedProduct && (
              <form
                className="mt-6 grid gap-3 border-t border-border pt-5 md:grid-cols-2"
                onSubmit={submitAvailability}
              >
                <h3 className="text-lg font-semibold tracking-normal md:col-span-2">
                  Availability
                </h3>
                <label className="text-sm">
                  Type
                  <select
                    className="mt-1 w-full rounded-md border border-border px-3 py-2"
                    value={availabilityForm.type}
                    onChange={(event) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        type: event.target.value as AvailabilityPayload["type"],
                      })
                    }
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </label>
                <label className="text-sm">
                  Reason
                  <input
                    className="mt-1 w-full rounded-md border border-border px-3 py-2"
                    value={availabilityForm.reason}
                    onChange={(event) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        reason: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="text-sm">
                  Starts
                  <input
                    className="mt-1 w-full rounded-md border border-border px-3 py-2"
                    required
                    type="datetime-local"
                    value={availabilityForm.startsAt}
                    onChange={(event) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        startsAt: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="text-sm">
                  Ends
                  <input
                    className="mt-1 w-full rounded-md border border-border px-3 py-2"
                    required
                    type="datetime-local"
                    value={availabilityForm.endsAt}
                    onChange={(event) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        endsAt: event.target.value,
                      })
                    }
                  />
                </label>
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                  disabled={availabilityMutation.isPending}
                  type="submit"
                >
                  <CalendarPlus aria-hidden="true" size={18} />
                  Add period
                </button>
                <div className="md:col-span-2 space-y-2">
                  {selectedProduct.availabilityPeriods.map((period) => (
                    <p
                      className="rounded-md border border-border px-3 py-2 text-sm"
                      key={period.id}
                    >
                      {period.type}:{" "}
                      {new Date(period.startsAt).toLocaleString()} to{" "}
                      {new Date(period.endsAt).toLocaleString()}
                    </p>
                  ))}
                </div>
              </form>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
