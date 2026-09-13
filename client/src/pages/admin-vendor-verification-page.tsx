import { FormEvent, useState } from "react";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../hooks/use-auth";
import {
  approveVendor,
  listPendingVendors,
  rejectVendor,
} from "../services/vendor-service";

export function AdminVendorVerificationPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const pendingQuery = useQuery({
    queryKey: ["admin-vendors-pending"],
    enabled: Boolean(auth.accessToken && auth.user?.role === "ADMIN"),
    queryFn: () => listPendingVendors(auth.accessToken!),
  });

  const approveMutation = useMutation({
    mutationFn: (vendorId: string) =>
      approveVendor(auth.accessToken!, vendorId),
    onSuccess: () => {
      setMessage("Vendor approved.");
      setSelectedVendorId(null);
      void queryClient.invalidateQueries({
        queryKey: ["admin-vendors-pending"],
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { vendorId: string; reason: string }) =>
      rejectVendor(auth.accessToken!, payload.vendorId, payload.reason),
    onSuccess: () => {
      setMessage("Vendor rejected.");
      setSelectedVendorId(null);
      void queryClient.invalidateQueries({
        queryKey: ["admin-vendors-pending"],
      });
    },
  });

  if (!auth.user || auth.user.role !== "ADMIN") {
    return (
      <main className="min-h-screen bg-background px-6 py-10">
        <Link className="text-sm text-muted-foreground" to="/">
          i-Share
        </Link>
        <section className="mx-auto mt-10 max-w-xl rounded-lg border border-border bg-white p-6">
          <h1 className="text-2xl font-semibold tracking-normal">
            Admin access required
          </h1>
        </section>
      </main>
    );
  }

  const vendors = pendingQuery.data ?? [];
  const selectedVendor =
    vendors.find((vendor) => vendor.id === selectedVendorId) ?? vendors[0];

  function handleReject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedVendor) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    rejectMutation.mutate({
      vendorId: selectedVendor.id,
      reason: String(formData.get("reason")),
    });
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link className="text-sm text-muted-foreground" to="/">
            i-Share
          </Link>
          <span className="rounded-md border border-border px-3 py-2 text-sm">
            {vendors.length} pending
          </span>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck aria-hidden="true" size={21} />
          </div>
          <h1 className="text-3xl font-semibold tracking-normal">
            Vendor verification
          </h1>
        </div>

        {message && <p className="mb-4 text-sm text-primary">{message}</p>}

        <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <section className="rounded-lg border border-border bg-white p-5">
            <h2 className="mb-4 text-xl font-semibold tracking-normal">
              Pending vendors
            </h2>
            <div className="space-y-2">
              {vendors.map((vendor) => (
                <button
                  className={`block w-full rounded-md border px-3 py-3 text-left text-sm ${
                    selectedVendor?.id === vendor.id
                      ? "border-primary"
                      : "border-border"
                  }`}
                  key={vendor.id}
                  onClick={() => setSelectedVendorId(vendor.id)}
                  type="button"
                >
                  <span className="block font-medium">
                    {vendor.businessName ?? vendor.displayName}
                  </span>
                  <span className="text-muted-foreground">
                    {vendor.city}, {vendor.country}
                  </span>
                </button>
              ))}
              {!vendors.length && (
                <p className="text-sm text-muted-foreground">
                  No vendors are pending review.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-white p-5">
            <h2 className="mb-4 text-xl font-semibold tracking-normal">
              Review details
            </h2>
            {selectedVendor ? (
              <>
                <dl className="grid gap-3 text-sm md:grid-cols-2">
                  {[
                    ["Business", selectedVendor.businessName],
                    ["Display", selectedVendor.displayName],
                    ["Email", selectedVendor.businessEmail],
                    ["Phone", selectedVendor.businessPhone],
                    [
                      "Location",
                      `${selectedVendor.city}, ${selectedVendor.country}`,
                    ],
                    ["Address", selectedVendor.addressLine1],
                    ["Submitted", selectedVendor.submittedAt],
                    ["Documents", String(selectedVendor.documents.length)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="font-medium">{label}</dt>
                      <dd className="text-muted-foreground">{value ?? "-"}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate(selectedVendor.id)}
                    type="button"
                  >
                    <CheckCircle2 aria-hidden="true" size={18} />
                    Approve
                  </button>
                </div>

                <form className="mt-5" onSubmit={handleReject}>
                  <label className="block text-sm font-medium">
                    Rejection reason
                    <textarea
                      className="mt-2 min-h-24 w-full rounded-md border border-border px-3 py-2 text-base"
                      minLength={10}
                      name="reason"
                      required
                    />
                  </label>
                  <button
                    className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 font-medium disabled:opacity-60"
                    disabled={rejectMutation.isPending}
                    type="submit"
                  >
                    <XCircle aria-hidden="true" size={18} />
                    Reject
                  </button>
                </form>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a pending vendor to review.
              </p>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
