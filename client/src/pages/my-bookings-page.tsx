import { useQuery } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";

import { BookingCard } from "../components/booking-ui";
import { AsyncState, Button, PageHeader } from "../components/ui";
import { apiErrorMessage } from "../lib/api-errors";
import { listMyBookings } from "../services/booking-service";
import { paymentService } from "../services/payment-service";
import { useAuth } from "../hooks/use-auth";

export function MyBookingsPage() {
  const { accessToken, user } = useAuth();
  const bookingsQuery = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => listMyBookings(accessToken ?? ""),
    enabled: Boolean(accessToken && user?.role === "CUSTOMER"),
  });
  const paymentsQuery = useQuery({
    queryKey: ["my-booking-payments"],
    queryFn: () => paymentService.listMyPayments(1, 50),
    enabled: Boolean(accessToken && user?.role === "CUSTOMER"),
  });

  if (!user || user.role !== "CUSTOMER") return <Navigate replace to="/login" />;

  return (
    <main className="page-surface">
      <section className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <PageHeader eyebrow="Your rentals" title="My bookings" description="Keep track of requests, confirmed rentals, and completed experiences in one place." actions={<Link to="/products"><Button>Browse marketplace</Button></Link>} />

        <div className="mt-8">
          {bookingsQuery.isLoading && <AsyncState type="loading" title="Loading your bookings" />}
          {bookingsQuery.isError && <AsyncState type="error" title="Bookings could not be loaded" message={apiErrorMessage(bookingsQuery.error, "Try again in a moment.")} />}
          {bookingsQuery.data?.length === 0 && <AsyncState type="empty" title="No bookings yet" message="Find something useful in the marketplace and your rental requests will appear here." />}
          {bookingsQuery.data && bookingsQuery.data.length > 0 && <div className="grid gap-4">{bookingsQuery.data.map((booking) => <BookingCard booking={booking} key={booking.id} paymentStatus={paymentsQuery.data?.payments.find((payment) => payment.bookingId === booking.id)?.status} />)}</div>}
        </div>
      </section>
    </main>
  );
}
