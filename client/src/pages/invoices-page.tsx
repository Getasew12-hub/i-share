import { useQuery } from "@tanstack/react-query";
import { Eye, FileText } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../hooks/use-auth";
import { apiErrorMessage } from "../lib/api-errors";
import { invoiceService } from "../services/invoice-service";
import type { Invoice } from "../types/invoice";

function invoiceStatusColor(status: Invoice["status"]): string {
  switch (status) {
    case "DRAFT":
      return "bg-yellow-100 text-yellow-800";
    case "PAID":
      return "bg-green-100 text-green-800";
    case "VOID":
      return "bg-red-100 text-red-800";
    case "ISSUED":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function InvoicesPage() {
  const { accessToken, user } = useAuth();
  const [page, setPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const isVendor = user?.role === "VENDOR";

  const invoicesQuery = useQuery({
    queryKey: ["invoices", page, isVendor],
    queryFn: () =>
      isVendor
        ? invoiceService.listVendorInvoices(page, 20)
        : invoiceService.listMyInvoices(page, 20),
    enabled: Boolean(accessToken),
  });

  const formatCurrency = (amount: string, currency: string): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(Number(amount));
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <section className="mx-auto w-full max-w-5xl">
        <h1 className="text-3xl font-semibold tracking-normal">
          {isVendor ? "Invoices" : "My Invoices"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isVendor
            ? "View invoices for your rental bookings."
            : "Track your rental invoices and receipts."}
        </p>

        {invoicesQuery.isLoading && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((index) => (
              <div
                className="h-24 animate-pulse rounded-lg border border-border bg-white"
                key={index}
              />
            ))}
          </div>
        )}

        {invoicesQuery.isError && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-white p-6 text-sm text-destructive">
            {apiErrorMessage(
              invoicesQuery.error,
              "Your invoices could not be loaded.",
            )}
          </div>
        )}

        {invoicesQuery.data?.invoices &&
          invoicesQuery.data.invoices.length === 0 && (
            <div className="mt-8 rounded-lg border border-border bg-white p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-3 font-medium">No invoices yet</p>
              <p className="text-sm text-muted-foreground">
                You don't have any invoices yet. When you make a payment, an
                invoice will be generated here.
              </p>
            </div>
          )}

        {invoicesQuery.data?.invoices && (
          <>
            <div className="mt-6 overflow-x-auto rounded-lg border border-border">
              <table className="w-full">
                <thead className="border-b border-border bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesQuery.data.invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-mono text-sm">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${invoiceStatusColor(
                            invoice.status,
                          )}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of{" "}
                {Math.ceil((invoicesQuery.data.total || 0) / 20) || 1}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) =>
                      p < Math.ceil((invoicesQuery.data?.total || 0) / 20)
                        ? p + 1
                        : p,
                    )
                  }
                  disabled={
                    page >= Math.ceil((invoicesQuery.data?.total || 0) / 20)
                  }
                  className="rounded-lg border border-border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">
                  {selectedInvoice.invoiceNumber}
                </h2>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="font-medium">Status</h3>
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${invoiceStatusColor(
                      selectedInvoice.status,
                    )}`}
                  >
                    {selectedInvoice.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Customer</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedInvoice.snapshots.customerName}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Vendor</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedInvoice.snapshots.vendorName}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium">Product</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedInvoice.snapshots.productName}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Pricing Details</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unit Price</span>
                      <span className="font-medium">
                        {formatCurrency(
                          selectedInvoice.snapshots.unitPrice,
                          selectedInvoice.currency,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">
                        {selectedInvoice.snapshots.rentalDuration}{" "}
                        {selectedInvoice.snapshots.pricingModel.toLowerCase()}
                        (s)
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium">Date</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(selectedInvoice.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-lg border border-border px-4 py-2 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
