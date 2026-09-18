import { FormEvent, useState } from "react";
import { FilePlus2, Send, Store, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../hooks/use-auth";
import { StepRail, WorkspaceShell } from "../components/business-ui";
import { AsyncState, Button, StatusBadge, Surface } from "../components/ui";
import {
  addMyVendorDocument,
  getMyVendorVerification,
  submitMyVendorVerification,
  updateMyVendorProfile,
} from "../services/vendor-service";
import type { VendorDocumentType, VendorProfilePayload } from "../types/vendor";

export function VendorOnboardingPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);

  const vendorQuery = useQuery({
    queryKey: ["vendor-onboarding"],
    enabled: Boolean(auth.accessToken && auth.user?.role === "VENDOR"),
    queryFn: () => getMyVendorVerification(auth.accessToken!),
  });

  const profileMutation = useMutation({
    mutationFn: (payload: VendorProfilePayload) =>
      updateMyVendorProfile(auth.accessToken!, payload),
    onSuccess: () => {
      setMessage("Profile saved.");
      void queryClient.invalidateQueries({ queryKey: ["vendor-onboarding"] });
    },
  });

  const documentMutation = useMutation({
    mutationFn: (payload: {
      documentType: VendorDocumentType;
      fileName: string;
      storageKey: string;
      url?: string;
      mimeType: string;
      fileSize: number;
    }) => addMyVendorDocument(auth.accessToken!, payload),
    onSuccess: () => {
      setMessage("Document metadata added.");
      void queryClient.invalidateQueries({ queryKey: ["vendor-onboarding"] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => submitMyVendorVerification(auth.accessToken!),
    onSuccess: () => {
      setMessage("Verification submitted.");
      void queryClient.invalidateQueries({ queryKey: ["vendor-onboarding"] });
    },
  });

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

  const vendor = vendorQuery.data;
  const canEdit = vendor?.verificationStatus !== "APPROVED";
  const canSubmit =
    vendor?.emailVerifiedAt &&
    vendor.profileComplete &&
    vendor.verificationStatus !== "PENDING" &&
    vendor.verificationStatus !== "APPROVED";

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    profileMutation.mutate({
      displayName: String(formData.get("displayName")),
      businessName: String(formData.get("businessName")),
      businessEmail: String(formData.get("businessEmail")),
      businessPhone: String(formData.get("businessPhone")),
      taxIdentifier: String(formData.get("taxIdentifier") ?? ""),
      description: String(formData.get("description") ?? ""),
      websiteUrl: String(formData.get("websiteUrl") ?? "") || undefined,
      country: String(formData.get("country")),
      city: String(formData.get("city")),
      addressLine1: String(formData.get("addressLine1")),
      addressLine2: String(formData.get("addressLine2") ?? ""),
    });
  }

  function handleDocumentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    documentMutation.mutate({
      documentType: String(formData.get("documentType")) as VendorDocumentType,
      fileName: String(formData.get("fileName")),
      storageKey: String(formData.get("storageKey")),
      url: String(formData.get("url") ?? "") || undefined,
      mimeType: String(formData.get("mimeType")),
      fileSize: Number(formData.get("fileSize")),
    });
    event.currentTarget.reset();
  }

  if (!vendor) {
    return (
      <WorkspaceShell eyebrow="Vendor workspace" title="Verification onboarding" description="Loading your business verification progress.">
        <AsyncState type="loading" title="Loading onboarding" />
      </WorkspaceShell>
    );
  }

  const currentStep = vendor.verificationStatus === "APPROVED" ? 3 : vendor.verificationStatus === "PENDING" ? 2 : vendor.profileComplete ? 1 : 0;

  return (
    <WorkspaceShell eyebrow="Vendor workspace" title="Verification onboarding" description="Complete your business profile and submit the information needed to become an approved rental vendor.">
      <>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Current status</p>
          <StatusBadge tone={vendor.verificationStatus === "APPROVED" ? "success" : vendor.verificationStatus === "REJECTED" ? "danger" : "warning"}>{vendor.verificationStatus}</StatusBadge>
        </div>

        <StepRail current={currentStep} steps={[{ label: "Business profile", description: "Tell us about your business.", complete: Boolean(vendor.emailVerifiedAt && vendor.profileComplete) }, { label: "Documents", description: "Record your verification documents.", complete: vendor.documents.length > 0 }, { label: "Review", description: "Submit for administrator review.", complete: vendor.verificationStatus === "PENDING" }, { label: "Approved", description: "Publish and grow your catalog.", complete: vendor.verificationStatus === "APPROVED" }]} />

        {vendor?.verificationStatus === "REJECTED" && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {vendor.rejectionReason}
          </div>
        )}
        {vendor?.verificationStatus === "PENDING" && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Verification is pending administrator review.
          </div>
        )}
        {vendor?.verificationStatus === "APPROVED" && (
          <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Verification approved.
          </div>
        )}
        {message && <p className="mb-4 text-sm text-primary">{message}</p>}

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <form
            className="surface-card p-5 sm:p-7"
            onSubmit={handleProfileSubmit}
          >
            <h2 className="mb-4 text-xl font-semibold tracking-normal">
              Business profile
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["displayName", "Display name"],
                ["businessName", "Business name"],
                ["businessEmail", "Business email"],
                ["businessPhone", "Business phone"],
                ["country", "Country"],
                ["city", "City"],
                ["addressLine1", "Address line 1"],
                ["addressLine2", "Address line 2"],
                ["taxIdentifier", "Tax identifier"],
                ["websiteUrl", "Website URL"],
              ].map(([name, label]) => (
                <label className="block text-sm font-medium" key={name}>
                  {label}
                  <input
                    className="mt-2 w-full rounded-md border border-border px-3 py-2 text-base disabled:bg-muted"
                    defaultValue={String(
                      vendor?.[name as keyof typeof vendor] ?? "",
                    )}
                    disabled={!canEdit}
                    name={name}
                    required={[
                      "displayName",
                      "businessName",
                      "businessEmail",
                      "businessPhone",
                      "country",
                      "city",
                      "addressLine1",
                    ].includes(name)}
                  />
                </label>
              ))}
              <label className="block text-sm font-medium md:col-span-2">
                Description
                <textarea
                  className="mt-2 min-h-28 w-full rounded-md border border-border px-3 py-2 text-base disabled:bg-muted"
                  defaultValue={vendor?.description ?? ""}
                  disabled={!canEdit}
                  name="description"
                />
              </label>
            </div>
            <button
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60"
              disabled={!canEdit || profileMutation.isPending}
              type="submit"
            >
              <Upload aria-hidden="true" size={18} />
              Save profile
            </button>
          </form>

          <div className="space-y-5">
            <form
              className="surface-card p-5 sm:p-7"
              onSubmit={handleDocumentSubmit}
            >
              <h2 className="mb-4 text-xl font-semibold tracking-normal">
                Verification documents
              </h2>
              <div className="grid gap-4">
                <select
                  className="rounded-md border border-border px-3 py-2"
                  disabled={!canEdit}
                  name="documentType"
                >
                  <option value="BUSINESS_LICENSE">Business license</option>
                  <option value="TAX_CERTIFICATE">Tax certificate</option>
                  <option value="OWNER_ID">Owner ID</option>
                  <option value="ADDRESS_PROOF">Address proof</option>
                  <option value="OTHER">Other</option>
                </select>
                <input
                  className="rounded-md border border-border px-3 py-2"
                  disabled={!canEdit}
                  name="fileName"
                  placeholder="File name"
                  required
                />
                <input
                  className="rounded-md border border-border px-3 py-2"
                  disabled={!canEdit}
                  name="storageKey"
                  placeholder="Storage key"
                  required
                />
                <input
                  className="rounded-md border border-border px-3 py-2"
                  disabled={!canEdit}
                  name="url"
                  placeholder="Private file URL"
                />
                <input
                  className="rounded-md border border-border px-3 py-2"
                  disabled={!canEdit}
                  name="mimeType"
                  placeholder="application/pdf"
                  required
                />
                <input
                  className="rounded-md border border-border px-3 py-2"
                  disabled={!canEdit}
                  name="fileSize"
                  placeholder="File size in bytes"
                  type="number"
                  min={1}
                  required
                />
              </div>
              <button
                className="mt-5 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 font-medium disabled:opacity-60"
                disabled={!canEdit || documentMutation.isPending}
                type="submit"
              >
                <FilePlus2 aria-hidden="true" size={18} />
                Add metadata
              </button>
            </form>

            <section className="surface-card p-5 sm:p-7">
              <h2 className="mb-4 text-xl font-semibold tracking-normal">
                Submit for review
              </h2>
              <ul className="mb-5 space-y-2 text-sm text-muted-foreground">
                <li>
                  Email verified: {vendor?.emailVerifiedAt ? "Yes" : "No"}
                </li>
                <li>
                  Profile complete: {vendor?.profileComplete ? "Yes" : "No"}
                </li>
                <li>Documents recorded: {vendor?.documents.length ?? 0}</li>
              </ul>
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60"
                disabled={!canSubmit || submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
                type="button"
              >
                <Send aria-hidden="true" size={18} />
                Submit verification
              </button>
            </section>
          </div>
        </div>
      </>
    </WorkspaceShell>
  );
}
