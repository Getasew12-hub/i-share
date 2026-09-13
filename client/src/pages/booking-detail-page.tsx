import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { cancelMyBooking, getMyBooking } from "../services/booking-service";
import { useAuth } from "../hooks/use-auth";
import type { Booking } from "../types/booking";

function statusColor(status: Booking["status"]): string {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "CONFIRMED":
      return "bg-blue-100 text-blue-800";
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "COMPLETED":
      return "bg-gray-100 text-gray-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "CANCELLED":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function BookingDetailPage() {
  const params = useParams();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const bookingId = params.bookingId!;

  const bookingQuery = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getMyBooking(accessToken ?? "", bookingId),
    enabled: Boolean(accessToken && bookingId),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string | undefined) =>
      cancelMyBooking(accessToken ?? "", bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });

  const booking = bookingQuery.data;
  const canCancel =
    booking?.status === "PENDING" || booking?.status === "CONFIRMED";

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <section className="mx-auto w-full max-w-3xl">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground"
          to="/bookings/me"
        >
          <ChevronLeft aria-hidden="true" size={16} />
          My Bookings
        </Link>

        {bookingQuery.isLoading && (
          <div className="mt-6 h-64 animate-pulse rounded-lg border border-border bg-white" />
        )}

        {bookingQuery.isError && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-white p-6 text-sm text-destructive">
            Booking details could not be loaded.
          </div>
        )}

        {booking && (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-border bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-normal">
                    {booking.product.name}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {booking.product.category.name}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor(booking.status)}`}
                >
                  {booking.status}
                </span>
              </div>

              <div className="mt-6 grid gap-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Start date</p>
                    <p className="font-medium">
                      {new Date(booking.startsAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">End date</p>
                    <p className="font-medium">
                      {new Date(booking.endsAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {booking.rentalDuration}{" "}
                      {booking.pricingModelSnapshot.toLowerCase()}
                      {booking.rentalDuration === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vendor</p>
                    <p className="font-medium">{booking.vendor.displayName}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-6">
              <h2 className="text-lg font-semibold">Pricing</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Rental subtotal ({booking.rentalDuration} ×{" "}
                    {booking.unitPriceSnapshot} {booking.currency})
                  </span>
                  <span>
                    {booking.rentalSubtotal} {booking.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>
                    {booking.deliveryCharge} {booking.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Security deposit
                  </span>
                  <span>
                    {booking.securityDeposit} {booking.currency}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-medium">
                  <span>Total</span>
                  <span>
                    {booking.totalAmount} {booking.currency}
                  </span>
                </div>
              </div>
            </div>

            {booking.rental && (
              <div className="rounded-lg border border-border bg-white p-6">
                <h2 className="text-lg font-semibold">Rental</h2>
                <div className="mt-4 grid gap-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{booking.rental.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expected return</p>
                      <p className="font-medium">
                        {new Date(
                          booking.rental.expectedReturnDate,
                        ).toLocaleString()}
                      </p>
                    </div>
                    {booking.rental.pickupDate && (
                      <div>
                        <p className="text-muted-foreground">Pickup date</p>
                        <p className="font-medium">
                          {new Date(booking.rental.pickupDate).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {booking.rental.actualReturnDate && (
                      <div>
                        <p className="text-muted-foreground">Return date</p>
                        <p className="font-medium">
                          {new Date(
                            booking.rental.actualReturnDate,
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {booking.rental.isLateReturn && (
                    <p className="text-sm text-destructive">
                      This rental was returned late.
                    </p>
                  )}
                </div>
              </div>
            )}

            {booking.cancellationReason && (
              <div className="rounded-lg border border-border bg-white p-6">
                <h2 className="text-lg font-semibold">Cancellation</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {booking.cancellationReason}
                </p>
                {booking.cancelledAt && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cancelled at:{" "}
                    {new Date(booking.cancelledAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {booking.rejectedReason && (
              <div className="rounded-lg border border-border bg-white p-6">
                <h2 className="text-lg font-semibold">Rejection</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {booking.rejectedReason}
                </p>
                {booking.rejectedAt && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Rejected at: {new Date(booking.rejectedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {canCancel && (
              <div className="rounded-lg border border-border bg-white p-6">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
                  <XCircle aria-hidden="true" size={20} />
                  Cancel booking
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  You can cancel this booking while it is pending or confirmed.
                </p>
                <button
                  className="mt-4 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white transition hover:bg-destructive/90"
                  disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate(undefined)}
                >
                  {cancelMutation.isPending
                    ? "Cancelling..."
                    : "Cancel booking"}
                </button>
                {cancelMutation.isError && (
                  <p className="mt-2 text-sm text-destructive">
                    {(cancelMutation.error as Error).message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
