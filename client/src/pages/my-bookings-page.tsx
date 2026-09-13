import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import { listMyBookings } from "../services/booking-service";
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

export function MyBookingsPage() {
  const { accessToken } = useAuth();
  const bookingsQuery = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => listMyBookings(accessToken ?? ""),
    enabled: Boolean(accessToken),
  });

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <section className="mx-auto w-full max-w-4xl">
        <h1 className="text-3xl font-semibold tracking-normal">My Bookings</h1>
        <p className="mt-2 text-muted-foreground">
          Track and manage your rental bookings.
        </p>

        {bookingsQuery.isLoading && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((index) => (
              <div
                className="h-24 animate-pulse rounded-lg border border-border bg-white"
                key={index}
              />
            ))}
          </div>
        )}

        {bookingsQuery.isError && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-white p-6 text-sm text-destructive">
            Your bookings could not be loaded.
          </div>
        )}

        {bookingsQuery.data && bookingsQuery.data.length === 0 && (
          <div className="mt-6 rounded-lg border border-border bg-white p-8 text-center text-muted-foreground">
            You have no bookings yet.
          </div>
        )}

        {bookingsQuery.data && bookingsQuery.data.length > 0 && (
          <div className="mt-6 space-y-3">
            {bookingsQuery.data.map((booking) => (
              <Link
                className="flex items-center justify-between rounded-lg border border-border bg-white p-4 transition hover:border-primary"
                key={booking.id}
                to={`/bookings/me/${booking.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                    <CalendarDays aria-hidden="true" size={24} />
                  </div>
                  <div>
                    <p className="font-medium">{booking.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.startsAt).toLocaleDateString()} –{" "}
                      {new Date(booking.endsAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor(booking.status)}`}
                  >
                    {booking.status}
                  </span>
                  <ChevronRight aria-hidden="true" size={16} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
