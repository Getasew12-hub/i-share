import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { useState } from "react";

import { useAuth } from "../hooks/use-auth";
import { apiErrorMessage } from "../lib/api-errors";
import { paymentService } from "../services/payment-service";
import type { Payment } from "../types/payment";

function paymentStatusColor(status: Payment["status"]): string {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "SUCCEEDED":
      return "bg-green-100 text-green-800";
    case "FAILED":
      return "bg-red-100 text-red-800";
    case "REQUIRES_ACTION":
      return "bg-amber-100 text-amber-800";
    case "CANCELLED":
      return "bg-gray-100 text-gray-600";
    case "REFUNDED":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function PaymentsPage() {
  const { accessToken, user } = useAuth();
  const [page, setPage] = useState(1);

  const isVendor = user?.role === "VENDOR";

  const paymentsQuery = useQuery({
    queryKey: ["payments", page, isVendor],
    queryFn: () =>
      isVendor
        ? paymentService.listVendorPayments(page, 20)
        : paymentService.listMyPayments(page, 20),
    enabled: Boolean(accessToken),
  });

  const formatCurrency = (amount: Payment["amount"], currency: string) => {
    const value =
      typeof amount === "number"
        ? amount
        : typeof amount === "string"
          ? Number(amount)
          : Number(amount.$numberDecimal);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  };

  const formatProvider = (provider: string): string => {
    return provider
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <section className="mx-auto w-full max-w-5xl">
        <h1 className="text-3xl font-semibold tracking-normal">
          {isVendor ? "Payments" : "My Payments"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isVendor
            ? "View payments from your rental bookings."
            : "Track your rental payments and transaction history."}
        </p>

        {paymentsQuery.isLoading && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((index) => (
              <div
                className="h-24 animate-pulse rounded-lg border border-border bg-white"
                key={index}
              />
            ))}
          </div>
        )}

        {paymentsQuery.isError && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-white p-6 text-sm text-destructive">
            {apiErrorMessage(
              paymentsQuery.error,
              "Your payments could not be loaded.",
            )}
          </div>
        )}

        {paymentsQuery.data?.payments &&
          paymentsQuery.data.payments.length === 0 && (
            <div className="mt-8 rounded-lg border border-border bg-white p-12 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-3 font-medium">No payments yet</p>
              <p className="text-sm text-muted-foreground">
                {isVendor
                  ? "You don't have any payments from bookings yet."
                  : "You haven't made any payments yet. Book an item and pay to see your payment history here."}
              </p>
            </div>
          )}

        {paymentsQuery.data?.payments && (
          <>
            <div className="mt-6 overflow-x-auto rounded-lg border border-border">
              <table className="w-full">
                <thead className="border-b border-border bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsQuery.data.payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-border hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatProvider(payment.provider)}
                        {payment.methodLabel && (
                          <span className="ml-2 text-muted-foreground">
                            ({payment.methodLabel})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStatusColor(
                            payment.status,
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of{" "}
                {Math.ceil((paymentsQuery.data.total || 0) / 20) || 1}
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
                      p < Math.ceil((paymentsQuery.data?.total || 0) / 20)
                        ? p + 1
                        : p,
                    )
                  }
                  disabled={
                    page >= Math.ceil((paymentsQuery.data?.total || 0) / 20)
                  }
                  className="rounded-lg border border-border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
