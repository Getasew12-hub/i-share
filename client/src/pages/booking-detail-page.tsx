import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CreditCard, FileText, MapPin, MessageSquare, XCircle } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

import { BookingStatusBadge, BookingTimeline, PaymentInvoiceState, PriceBreakdown } from "../components/booking-ui";
import { AsyncState, Button, PageHeader, Surface } from "../components/ui";
import { apiErrorMessage } from "../lib/api-errors";
import { canCancelCustomerBooking } from "../lib/booking-workflow";
import { cancelMyBooking, getMyBooking } from "../services/booking-service";
import { invoiceService } from "../services/invoice-service";
import { paymentService } from "../services/payment-service";
import { useAuth } from "../hooks/use-auth";

export function BookingDetailPage() {
  const params = useParams();
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const bookingId = params.bookingId!;
  const bookingQuery = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getMyBooking(accessToken ?? "", bookingId),
    enabled: Boolean(accessToken && bookingId),
  });
  const paymentsQuery = useQuery({
    queryKey: ["payments-for-booking", bookingId],
    queryFn: () => paymentService.listMyPayments(1, 50),
    enabled: Boolean(accessToken && bookingId),
  });
  const invoicesQuery = useQuery({
    queryKey: ["invoices-for-booking", bookingId],
    queryFn: () => invoiceService.listMyInvoices(1, 50),
    enabled: Boolean(accessToken && bookingId),
  });
  const cancelMutation = useMutation({
    mutationFn: (reason: string | undefined) => cancelMyBooking(accessToken ?? "", bookingId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      void queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });
  const paymentMutation = useMutation({
    mutationFn: () => paymentService.createBookingPayment(bookingId, { provider: "OTHER", methodLabel: "Demo payment record" }),
    onSuccess: () => {
      void paymentsQuery.refetch();
      void invoicesQuery.refetch();
    },
  });

  if (!user || user.role !== "CUSTOMER") return <Navigate replace to="/login" />;
  if (bookingQuery.isLoading) return <main className="page-surface"><section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8"><AsyncState type="loading" title="Loading booking" /></section></main>;
  if (bookingQuery.isError || !bookingQuery.data) return <main className="page-surface"><section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8"><AsyncState type="error" title="Booking unavailable" message={apiErrorMessage(bookingQuery.error, "Booking details could not be loaded.")} /></section></main>;

  const booking = bookingQuery.data;
  const payment = paymentsQuery.data?.payments.find((item) => item.bookingId === booking.id);
  const invoice = invoicesQuery.data?.invoices.find((item) => item.bookingId === booking.id);
  const canCancel = canCancelCustomerBooking(booking.status);
  const canPay = booking.status === "CONFIRMED" && payment?.status !== "SUCCEEDED";
  const reviewEligible = booking.rental?.status === "COMPLETED";

  return (
    <main className="page-surface">
      <section className="mx-auto max-w-[1280px] px-4 py-6 pb-12 sm:px-6 lg:px-8 lg:py-10">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary" to="/bookings/me"><ChevronLeft aria-hidden="true" size={16} /> My bookings</Link>
        <div className="mt-6"><PageHeader eyebrow="Booking workspace" title={booking.product.name} description={`Booked with ${booking.vendor.displayName}`} actions={<BookingStatusBadge status={booking.status} />} /></div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Surface className="overflow-hidden">
              <div className="grid gap-5 p-5 sm:grid-cols-[180px_1fr] sm:p-6">
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:aspect-square">{booking.product.imageUrl ? <img alt={booking.product.name} className="h-full w-full object-cover" src={booking.product.imageUrl} /> : <div className="flex h-full items-center justify-center text-muted-foreground"><CreditCard aria-hidden="true" size={26} /></div>}</div>
                <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{booking.product.category.name}</p><h2 className="mt-2 text-2xl font-black">{booking.product.name}</h2><div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2"><p><span className="block text-xs font-bold uppercase tracking-wide">Start</span>{new Date(booking.startsAt).toLocaleString()}</p><p><span className="block text-xs font-bold uppercase tracking-wide">End</span>{new Date(booking.endsAt).toLocaleString()}</p></div></div>
              </div>
            </Surface>

            <Surface className="p-5 sm:p-7"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-black">Booking timeline</h2><span className="text-sm font-semibold text-muted-foreground">{booking.rental ? booking.rental.status : "Awaiting confirmation"}</span></div><div className="mt-6"><BookingTimeline booking={booking} events={booking.rental?.events} /></div></Surface>

            <Surface className="p-5 sm:p-7"><div className="flex items-center gap-3"><FileText aria-hidden="true" className="text-primary" size={20} /><h2 className="text-xl font-black">Price breakdown</h2></div><div className="mt-5"><PriceBreakdown booking={booking} /></div></Surface>

            {booking.rental && <Surface className="p-5 sm:p-7"><h2 className="text-xl font-black">Rental details</h2><div className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div><p className="text-muted-foreground">Rental status</p><p className="mt-1 font-bold">{booking.rental.status}</p></div><div><p className="text-muted-foreground">Expected return</p><p className="mt-1 font-bold">{new Date(booking.rental.expectedReturnDate).toLocaleString()}</p></div>{booking.rental.actualReturnDate && <div><p className="text-muted-foreground">Returned</p><p className="mt-1 font-bold">{new Date(booking.rental.actualReturnDate).toLocaleString()}</p></div>}{booking.rental.isLateReturn && <p className="text-destructive sm:col-span-2">This rental was returned late.</p>}</div></Surface>}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <Surface className="p-5 sm:p-6"><h2 className="text-xl font-black">Next action</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{booking.status === "PENDING" ? "Your request is waiting for the vendor to confirm." : booking.status === "CONFIRMED" && !payment ? "Your booking is confirmed. Create the payment record when you are ready." : reviewEligible ? "Your rental is complete. Share your experience with a review." : "Your booking is being tracked here."}</p>{canPay && !payment && <Button className="mt-5 w-full" disabled={paymentMutation.isPending} onClick={() => paymentMutation.mutate()}><CreditCard aria-hidden="true" size={17} />{paymentMutation.isPending ? "Creating payment..." : "Create demo payment record"}</Button>}{reviewEligible && <Link className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted" to="/reviews"><MessageSquare aria-hidden="true" size={17} /> Review this rental</Link>}{canCancel && <Button className="mt-3 w-full" variant="danger" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(undefined)}><XCircle aria-hidden="true" size={17} />{cancelMutation.isPending ? "Cancelling..." : "Cancel booking"}</Button>}{(paymentMutation.isError || cancelMutation.isError) && <p className="mt-3 text-sm text-destructive">{apiErrorMessage(paymentMutation.error ?? cancelMutation.error, "The requested action could not be completed.")}</p>}</Surface>
            <Surface className="p-5 sm:p-6"><h2 className="text-lg font-black">Payment and invoice</h2><div className="mt-4"><PaymentInvoiceState paymentStatus={payment?.status} invoiceStatus={invoice?.status} /></div>{paymentMutation.isSuccess && <p className="mt-3 text-sm text-primary">Payment record created. Provider confirmation is not implemented in this phase.</p>}</Surface>
            <Surface className="p-5 sm:p-6"><div className="flex items-center gap-3"><MapPin aria-hidden="true" className="text-primary" size={19} /><div><p className="font-bold">{booking.product.city || booking.product.country || "Location not specified"}</p><p className="mt-1 text-sm text-muted-foreground">{booking.vendor.displayName}</p></div></div></Surface>
          </aside>
        </div>
      </section>
    </main>
  );
}
