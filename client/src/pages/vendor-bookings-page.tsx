import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Filter, MapPin, Search } from "lucide-react";
import { Link, Navigate } from "react-router-dom";

import { WorkspaceShell } from "../components/business-ui";
import { AsyncState, Button, StatusBadge, Surface } from "../components/ui";
import { apiErrorMessage } from "../lib/api-errors";
import { listVendorBookings } from "../services/booking-service";
import { useAuth } from "../hooks/use-auth";
import type { Booking } from "../types/booking";

function tone(status: Booking["status"]) { return status === "PENDING" ? "warning" as const : status === "CONFIRMED" || status === "ACTIVE" || status === "COMPLETED" ? "success" as const : "danger" as const; }

export function VendorBookingsPage() {
  const { accessToken, user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Booking["status"] | "ALL">("ALL");
  const bookingsQuery = useQuery({ queryKey: ["vendor-bookings"], queryFn: () => listVendorBookings(accessToken ?? ""), enabled: Boolean(accessToken && user?.role === "VENDOR") });
  const bookings = useMemo(() => (bookingsQuery.data ?? []).filter((booking) => (status === "ALL" || booking.status === status) && `${booking.product.name} ${booking.customer.displayName}`.toLowerCase().includes(search.toLowerCase())), [bookingsQuery.data, search, status]);
  if (!user || user.role !== "VENDOR") return <Navigate replace to="/login" />;

  return <WorkspaceShell eyebrow="Vendor workspace" title="Booking management" description="Review incoming requests, understand rental context, and move each booking through its next valid action." actions={<Link to="/vendor/products"><Button>Manage inventory</Button></Link>}>
    <Surface className="p-5 sm:p-6"><div className="flex flex-col gap-3 md:flex-row"><label className="relative flex-1"><Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><input aria-label="Search bookings" className="control-base w-full pl-10" placeholder="Search product or customer" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="relative md:w-52"><Filter aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><select aria-label="Filter bookings by status" className="control-base w-full pl-9" value={status} onChange={(event) => setStatus(event.target.value as Booking["status"] | "ALL")}><option value="ALL">All statuses</option><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="REJECTED">Rejected</option><option value="CANCELLED">Cancelled</option></select></label></div></Surface>
    <div className="mt-5">{bookingsQuery.isLoading ? <AsyncState type="loading" title="Loading bookings" /> : bookingsQuery.isError ? <AsyncState type="error" title="Bookings unavailable" message={apiErrorMessage(bookingsQuery.error, "Try again in a moment.")} /> : bookings.length === 0 ? <AsyncState type="empty" title="No matching bookings" message="New customer requests will appear here." /> : <div className="grid gap-3">{bookings.map((booking) => <Link className="group rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-5" key={booking.id} to={`/vendor/bookings/${booking.id}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">{booking.product.imageUrl ? <img alt={booking.product.name} className="h-full w-full object-cover" src={booking.product.imageUrl} /> : <CalendarDays aria-hidden="true" className="text-muted-foreground" size={24} />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{booking.customer.displayName}</p><h2 className="mt-1 truncate text-lg font-black group-hover:text-primary">{booking.product.name}</h2></div><StatusBadge tone={tone(booking.status)}>{booking.status}</StatusBadge></div><div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3"><span className="inline-flex items-center gap-2"><CalendarDays aria-hidden="true" size={15} />{new Date(booking.startsAt).toLocaleDateString()} - {new Date(booking.endsAt).toLocaleDateString()}</span><span className="inline-flex items-center gap-2"><MapPin aria-hidden="true" size={15} />{booking.product.city || booking.product.country || "Location not specified"}</span><span className="font-bold text-foreground">{booking.totalAmount} {booking.currency}</span></div></div></div></Link>)}</div>}</div>
  </WorkspaceShell>;
}
