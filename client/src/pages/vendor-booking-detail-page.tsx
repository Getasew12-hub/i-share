import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, ChevronLeft, PlayCircle, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import {
  cancelVendorBooking,
  completeVendorRental,
  confirmVendorBooking,
  getVendorBooking,
  rejectVendorBooking,
  startVendorRental,
} from "../services/booking-service";
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

export function VendorBookingDetailPage() {
  const params = useParams();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const bookingId = params.bookingId!;

  const bookingQuery = useQuery({
    queryKey: ["vendor-booking", bookingId],
    queryFn: () => getVendorBooking(accessToken ?? "", bookingId),
    enabled: Boolean(accessToken && bookingId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["vendor-booking", bookingId] });
    queryClient.invalidateQueries({ queryKey: ["vendor-bookings"] });
  };

  const confirmMutation = useMutation({
    mutationFn: () => confirmVendorBooking(accessToken ?? "", bookingId),
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) =>
      rejectVendorBooking(accessToken ?? "", bookingId, reason),
    onSuccess: invalidate,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string | undefined) =>
      cancelVendorBooking(accessToken ?? "", bookingId, reason),
    onSuccess: invalidate,
  });

  const startRentalMutation = useMutation({
    mutationFn: () => startVendorRental(accessToken ?? "", bookingId),
    onSuccess: invalidate,
  });

  const completeRentalMutation = useMutation({
    mutationFn: () => completeVendorRental(accessToken ?? "", bookingId, {}),
    onSuccess: invalidate,
  });

  const booking = bookingQuery.data;
  const canConfirm = booking?.status === "PENDING";
  const canReject = booking?.status === "PENDING";
  const canCancel =
    booking?.status === "PENDING" || booking?.status === "CONFIRMED";
  const canStartRental =
    booking?.status === "CONFIRMED" && booking?.rental?.status === "CONFIRMED";
  const canCompleteRental =
    booking?.status === "ACTIVE" &&
    ["ACTIVE", "IN_PROGRESS"].includes(booking?.rental?.status ?? "");

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <section className="mx-auto w-full max-w-3xl">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground"
          to="/vendor/bookings"
        >
          <ChevronLeft aria-hidden="true" size={16} />
          Product Bookings
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
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">
                      {booking.customer.displayName}
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
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-white p-6">
              <h2 className="text-lg font-semibold">Pricing</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
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
                  {booking.rental.damageNotes && (
                    <div>
                      <p className="text-muted-foreground">Damage notes</p>
                      <p className="font-medium">
                        {booking.rental.damageNotes}
                      </p>
                    </div>
                  )}
                  {booking.rental.additionalCharges &&
                    booking.rental.additionalCharges !== "0" && (
                      <div>
                        <p className="text-muted-foreground">
                          Additional charges
                        </p>
                        <p className="font-medium">
                          {booking.rental.additionalCharges}{" "}
                          {booking.rental.additionalChargeReason
                            ? `(${booking.rental.additionalChargeReason})`
                            : ""}
                        </p>
                      </div>
                    )}
                  {booking.rental.events.length > 0 && (
                    <div>
                      <p className="text-muted-foreground">Events</p>
                      <ul className="mt-1 space-y-1">
                        {booking.rental.events.map((event) => (
                          <li
                            className="text-sm text-muted-foreground"
                            key={event.id}
                          >
                            {event.eventType}:{" "}
                            {new Date(event.occurredAt).toLocaleString()}
                            {event.notes ? ` — ${event.notes}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(canConfirm || canReject || canCancel) && (
              <div className="rounded-lg border border-border bg-white p-6">
                <h2 className="text-lg font-semibold">Actions</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {canConfirm && (
                    <button
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                      disabled={confirmMutation.isPending}
                      onClick={() => confirmMutation.mutate()}
                    >
                      <CheckCircle aria-hidden="true" size={16} />
                      {confirmMutation.isPending
                        ? "Confirming..."
                        : "Confirm booking"}
                    </button>
                  )}
                  {canReject && (
                    <button
                      className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white transition hover:bg-destructive/90"
                      disabled={rejectMutation.isPending}
                      onClick={() => {
                        const reason = window.prompt("Reason for rejection:");
                        if (reason) {
                          rejectMutation.mutate(reason);
                        }
                      }}
                    >
                      <XCircle aria-hidden="true" size={16} />
                      Reject booking
                    </button>
                  )}
                  {canCancel && (
                    <button
                      className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                      disabled={cancelMutation.isPending}
                      onClick={() => {
                        const reason = window.prompt(
                          "Reason for cancellation (optional):",
                        );
                        cancelMutation.mutate(reason ?? undefined);
                      }}
                    >
                      <XCircle aria-hidden="true" size={16} />
                      Cancel booking
                    </button>
                  )}
                </div>
                {confirmMutation.isError && (
                  <p className="mt-2 text-sm text-destructive">
                    {(confirmMutation.error as Error).message}
                  </p>
                )}
                {rejectMutation.isError && (
                  <p className="mt-2 text-sm text-destructive">
                    {(rejectMutation.error as Error).message}
                  </p>
                )}
                {cancelMutation.isError && (
                  <p className="mt-2 text-sm text-destructive">
                    {(cancelMutation.error as Error).message}
                  </p>
                )}
              </div>
            )}

            {(canStartRental || canCompleteRental) && (
              <div className="rounded-lg border border-border bg-white p-6">
                <h2 className="text-lg font-semibold">Rental management</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  {canStartRental && (
                    <button
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                      disabled={startRentalMutation.isPending}
                      onClick={() => startRentalMutation.mutate()}
                    >
                      <PlayCircle aria-hidden="true" size={16} />
                      {startRentalMutation.isPending
                        ? "Starting..."
                        : "Start rental"}
                    </button>
                  )}
                  {canCompleteRental && (
                    <button
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                      disabled={completeRentalMutation.isPending}
                      onClick={() => completeRentalMutation.mutate()}
                    >
                      <CheckCircle aria-hidden="true" size={16} />
                      {completeRentalMutation.isPending
                        ? "Completing..."
                        : "Complete rental"}
                    </button>
                  )}
                </div>
                {startRentalMutation.isError && (
                  <p className="mt-2 text-sm text-destructive">
                    {(startRentalMutation.error as Error).message}
                  </p>
                )}
                {completeRentalMutation.isError && (
                  <p className="mt-2 text-sm text-destructive">
                    {(completeRentalMutation.error as Error).message}
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
