import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CheckCircle, PlayCircle, XCircle } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

import { BookingStatusBadge, BookingTimeline, PriceBreakdown } from "../components/booking-ui";
import { WorkspaceShell } from "../components/business-ui";
import { AsyncState, Button, Surface } from "../components/ui";
import { apiErrorMessage } from "../lib/api-errors";
import { canCancelVendorBooking, canCompleteVendorRental, canConfirmVendorBooking, canRejectVendorBooking, canStartVendorRental } from "../lib/booking-workflow";
import { cancelVendorBooking, completeVendorRental, confirmVendorBooking, getVendorBooking, rejectVendorBooking, startVendorRental } from "../services/booking-service";
import { useAuth } from "../hooks/use-auth";

export function VendorBookingDetailPage() {
  const params = useParams();
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const bookingId = params.bookingId!;
  const bookingQuery = useQuery({ queryKey: ["vendor-booking", bookingId], queryFn: () => getVendorBooking(accessToken ?? "", bookingId), enabled: Boolean(accessToken && bookingId) });
  const invalidate = () => { void queryClient.invalidateQueries({ queryKey: ["vendor-booking", bookingId] }); void queryClient.invalidateQueries({ queryKey: ["vendor-bookings"] }); };
  const confirmMutation = useMutation({ mutationFn: () => confirmVendorBooking(accessToken ?? "", bookingId), onSuccess: invalidate });
  const rejectMutation = useMutation({ mutationFn: (reason: string) => rejectVendorBooking(accessToken ?? "", bookingId, reason), onSuccess: invalidate });
  const cancelMutation = useMutation({ mutationFn: (reason: string | undefined) => cancelVendorBooking(accessToken ?? "", bookingId, reason), onSuccess: invalidate });
  const startMutation = useMutation({ mutationFn: () => startVendorRental(accessToken ?? "", bookingId), onSuccess: invalidate });
  const completeMutation = useMutation({ mutationFn: () => completeVendorRental(accessToken ?? "", bookingId, {}), onSuccess: invalidate });

  if (!user || user.role !== "VENDOR") return <Navigate replace to="/login" />;
  if (bookingQuery.isLoading) return <WorkspaceShell eyebrow="Vendor workspace" title="Booking detail" description="Loading booking context."><AsyncState type="loading" title="Loading booking" /></WorkspaceShell>;
  if (bookingQuery.isError || !bookingQuery.data) return <WorkspaceShell eyebrow="Vendor workspace" title="Booking detail" description="Review and manage this rental."><AsyncState type="error" title="Booking unavailable" message={apiErrorMessage(bookingQuery.error, "Booking details could not be loaded.")} /></WorkspaceShell>;

  const booking = bookingQuery.data;
  const canConfirm = canConfirmVendorBooking(booking.status);
  const canReject = canRejectVendorBooking(booking.status);
  const canCancel = canCancelVendorBooking(booking.status);
  const canStart = canStartVendorRental(booking);
  const canComplete = canCompleteVendorRental(booking);
  const mutationError = confirmMutation.error ?? rejectMutation.error ?? cancelMutation.error ?? startMutation.error ?? completeMutation.error;

  return <WorkspaceShell eyebrow="Vendor workspace" title={booking.product.name} description={`Booking for ${booking.customer.displayName}`} actions={<Link to="/vendor/bookings"><Button variant="quiet"><ChevronLeft aria-hidden="true" size={16} /> Back to bookings</Button></Link>}>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-6"><Surface className="p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Customer rental</p><h2 className="mt-2 text-2xl font-black">{booking.product.name}</h2><p className="mt-2 text-sm text-muted-foreground">{booking.customer.displayName} · {booking.customerId}</p></div><BookingStatusBadge status={booking.status} /></div><div className="mt-6 grid gap-4 text-sm sm:grid-cols-3"><div><p className="text-muted-foreground">Starts</p><p className="mt-1 font-bold">{new Date(booking.startsAt).toLocaleString()}</p></div><div><p className="text-muted-foreground">Ends</p><p className="mt-1 font-bold">{new Date(booking.endsAt).toLocaleString()}</p></div><div><p className="text-muted-foreground">Total</p><p className="mt-1 text-lg font-black">{booking.totalAmount} {booking.currency}</p></div></div></Surface><Surface className="p-5 sm:p-7"><h2 className="text-xl font-black">Rental timeline</h2><div className="mt-6"><BookingTimeline booking={booking} events={booking.rental?.events} /></div></Surface><Surface className="p-5 sm:p-7"><h2 className="text-xl font-black">Price breakdown</h2><div className="mt-5"><PriceBreakdown booking={booking} /></div></Surface></div><aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit"><Surface className="p-5 sm:p-6"><h2 className="text-xl font-black">Next actions</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Only actions valid for the current booking and rental state are enabled.</p><div className="mt-5 grid gap-3">{canConfirm && <Button disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}><CheckCircle aria-hidden="true" size={17} /> Confirm booking</Button>}{canReject && <Button variant="danger" disabled={rejectMutation.isPending} onClick={() => { const reason = window.prompt("Reason for rejection:"); if (reason) rejectMutation.mutate(reason); }}><XCircle aria-hidden="true" size={17} /> Reject booking</Button>}{canCancel && <Button variant="quiet" disabled={cancelMutation.isPending} onClick={() => { const reason = window.prompt("Reason for cancellation (optional):"); cancelMutation.mutate(reason ?? undefined); }}><XCircle aria-hidden="true" size={17} /> Cancel booking</Button>}{canStart && <Button disabled={startMutation.isPending} onClick={() => startMutation.mutate()}><PlayCircle aria-hidden="true" size={17} /> Start rental</Button>}{canComplete && <Button disabled={completeMutation.isPending} onClick={() => completeMutation.mutate()}><CheckCircle aria-hidden="true" size={17} /> Complete rental</Button>}{!canConfirm && !canReject && !canCancel && !canStart && !canComplete && <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">No actions are available for this state.</p>}</div>{mutationError && <p className="mt-4 text-sm text-destructive">{apiErrorMessage(mutationError, "The requested action could not be completed.")}</p>}</Surface>{booking.rental && <Surface className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Rental state</p><p className="mt-2 text-xl font-black">{booking.rental.status}</p><p className="mt-2 text-sm text-muted-foreground">Expected return {new Date(booking.rental.expectedReturnDate).toLocaleString()}</p></Surface>}</aside></div>
  </WorkspaceShell>;
}
