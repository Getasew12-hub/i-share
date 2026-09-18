import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Bell, CalendarDays, CheckCircle2, CreditCard, FileText, LayoutDashboard, Package, ShieldCheck, Star, Store } from "lucide-react";
import { Link, Navigate } from "react-router-dom";

import { BookingCard } from "../components/booking-ui";
import { ActionTile, MetricCard, WorkspaceShell } from "../components/business-ui";
import { AsyncState, Button, StatusBadge, Surface } from "../components/ui";
import { useAuth } from "../hooks/use-auth";
import { listMyBookings, listVendorBookings } from "../services/booking-service";
import { getAdminDashboard, getCustomerDashboard, getVendorDashboard } from "../services/dashboard-service";
import type { Booking } from "../types/booking";
import type { AdminDashboard, CurrencyTotal, CustomerDashboard, VendorDashboard } from "../types/dashboard";

function money(amount: string, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(amount));
}

function CurrencyTotals({ title, totals }: { title: string; totals: CurrencyTotal[] }) {
  return <Surface className="p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-black">{title}</h2><CreditCard aria-hidden="true" className="text-primary" size={18} /></div>{totals.length === 0 ? <p className="mt-5 text-sm text-muted-foreground">No totals recorded yet.</p> : <div className="mt-5 space-y-3">{totals.map((total) => <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0" key={total.currency}><span className="text-sm text-muted-foreground">{total.currency}</span><span className="font-bold">{money(total.amount, total.currency)}</span></div>)}</div>}</Surface>;
}

function useBookings(role: "CUSTOMER" | "VENDOR", accessToken: string | null) {
  return useQuery({
    queryKey: [role === "CUSTOMER" ? "my-bookings" : "vendor-bookings", accessToken],
    queryFn: () => role === "CUSTOMER" ? listMyBookings(accessToken ?? "") : listVendorBookings(accessToken ?? ""),
    enabled: Boolean(accessToken),
  });
}

export function CustomerDashboardPage() {
  const { user, accessToken } = useAuth();
  const query = useQuery({ queryKey: ["customer-dashboard"], queryFn: () => getCustomerDashboard(accessToken ?? ""), enabled: user?.role === "CUSTOMER" && Boolean(accessToken) });
  const bookingsQuery = useBookings("CUSTOMER", accessToken);
  if (!user) return <Navigate replace to="/login" />;
  if (user.role !== "CUSTOMER") return <Navigate replace to={user.role === "VENDOR" ? "/dashboard/vendor" : "/dashboard/admin"} />;
  if (query.isLoading) return <WorkspaceShell eyebrow="Customer workspace" title="Your dashboard" description="Loading your rental activity."><AsyncState type="loading" title="Loading dashboard" /></WorkspaceShell>;
  if (query.isError || !query.data) return <WorkspaceShell eyebrow="Customer workspace" title="Your dashboard" description="Your rental activity at a glance."><AsyncState type="error" title="Dashboard unavailable" message="We could not load your dashboard right now." /></WorkspaceShell>;
  const data = query.data;
  return <WorkspaceShell eyebrow="Customer workspace" title="Your dashboard" description="A clear view of the rentals, payments, and follow-up tasks that matter now." actions={<Link to="/products"><Button>Browse marketplace <ArrowUpRight aria-hidden="true" size={16} /></Button></Link>}>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><MetricCard label="Total bookings" value={data.bookings.total} icon={CalendarDays} /><MetricCard label="Pending bookings" value={data.bookings.pending} detail="Awaiting confirmation" icon={CalendarDays} tone="warning" /><MetricCard label="Upcoming bookings" value={data.bookings.upcoming} icon={CalendarDays} /><MetricCard label="Unread notifications" value={data.unreadNotificationCount} icon={Bell} tone="secondary" /><MetricCard label="Active rentals" value={data.rentals.active} icon={Package} tone="success" /><MetricCard label="Completed rentals" value={data.rentals.completed} icon={CheckCircle2} tone="success" /><MetricCard label="Reviews submitted" value={data.submittedReviewCount} icon={Star} /></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2"><CurrencyTotals title="Successful payments" totals={data.successfulPayments} /><CurrencyTotals title="Invoices" totals={data.invoices} /></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]"><Surface className="p-5"><div className="flex items-center justify-between"><h2 className="font-black">Upcoming and recent bookings</h2><Link className="text-sm font-bold text-primary" to="/bookings/me">View all</Link></div><div className="mt-5 grid gap-3">{(bookingsQuery.data ?? []).slice(0, 4).map((booking) => <BookingCard booking={booking} key={booking.id} />)}{bookingsQuery.data?.length === 0 && <p className="text-sm text-muted-foreground">No bookings to show yet.</p>}</div></Surface><Surface className="p-5"><h2 className="font-black">Rental follow-up</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Completed rentals can be reviewed when they become eligible.</p><Link className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary" to="/reviews">Open reviews <ArrowUpRight aria-hidden="true" size={15} /></Link></Surface></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><ActionTile to="/products" label="Marketplace" description="Find your next rental" icon={Store} /><ActionTile to="/bookings/me" label="Bookings" description="Track requests and rentals" icon={CalendarDays} /><ActionTile to="/notifications" label="Notifications" description="Review account updates" icon={Bell} /></div>
  </WorkspaceShell>;
}

export function VendorDashboardPage() {
  const { user, accessToken } = useAuth();
  const query = useQuery({ queryKey: ["vendor-dashboard"], queryFn: () => getVendorDashboard(accessToken ?? ""), enabled: user?.role === "VENDOR" && Boolean(accessToken) });
  const bookingsQuery = useBookings("VENDOR", accessToken);
  if (!user) return <Navigate replace to="/login" />;
  if (user.role !== "VENDOR") return <Navigate replace to={user.role === "CUSTOMER" ? "/dashboard/customer" : "/dashboard/admin"} />;
  if (query.isLoading) return <WorkspaceShell eyebrow="Vendor workspace" title="Business dashboard" description="Loading your marketplace operations."><AsyncState type="loading" title="Loading business dashboard" /></WorkspaceShell>;
  if (query.isError || !query.data) return <WorkspaceShell eyebrow="Vendor workspace" title="Business dashboard" description="Your marketplace operations at a glance."><AsyncState type="error" title="Dashboard unavailable" message="We could not load your business dashboard right now." /></WorkspaceShell>;
  const data = query.data;
  return <WorkspaceShell eyebrow="Vendor workspace" title="Run your rental business" description="Monitor inventory, demand, rentals, and the actions that need your attention." actions={<Link to="/vendor/products"><Button>Manage inventory <ArrowUpRight aria-hidden="true" size={16} /></Button></Link>}>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><MetricCard label="Published products" value={`${data.products.published}/${data.products.total}`} icon={Package} tone="success" /><MetricCard label="Pending bookings" value={data.bookings.pending} icon={CalendarDays} tone="warning" /><MetricCard label="Active rentals" value={data.rentals.active} icon={CheckCircle2} tone="success" /><MetricCard label="Published reviews" value={data.reviews.publishedCount} detail={data.reviews.averageRating === null ? "No rating yet" : `${data.reviews.averageRating.toFixed(1)} average rating`} icon={Star} /></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]"><Surface className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Attention needed</p><h2 className="mt-2 text-xl font-black">Booking activity</h2></div><Link className="text-sm font-bold text-primary" to="/vendor/bookings">View all</Link></div><div className="mt-5 grid gap-3">{(bookingsQuery.data ?? []).slice(0, 4).map((booking) => <Link className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 hover:border-primary/40" key={booking.id} to={`/vendor/bookings/${booking.id}`}><div className="min-w-0"><p className="truncate font-bold">{booking.product.name}</p><p className="mt-1 text-sm text-muted-foreground">{booking.customer.displayName} · {new Date(booking.startsAt).toLocaleDateString()}</p></div><StatusBadge tone={booking.status === "PENDING" ? "warning" : booking.status === "CONFIRMED" ? "info" : "neutral"}>{booking.status}</StatusBadge></Link>)}{bookingsQuery.data?.length === 0 && <p className="text-sm text-muted-foreground">No booking activity yet.</p>}</div></Surface><Surface className="p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Subscription</p><h2 className="mt-2 text-xl font-black">{data.subscription?.plan.name ?? "No active plan"}</h2></div><CreditCard aria-hidden="true" className="text-primary" size={21} /></div><p className="mt-4 text-sm leading-6 text-muted-foreground">{data.subscription ? `Active through ${new Date(data.subscription.endsAt).toLocaleDateString()}.` : "Select a plan to unlock listing eligibility."}</p><Link className="mt-5 inline-flex text-sm font-bold text-primary" to="/vendor/subscription">Manage subscription <ArrowUpRight aria-hidden="true" size={15} /></Link></Surface></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><ActionTile to="/vendor/products" label="Inventory" description="Create, edit, publish, and schedule products" icon={Package} /><ActionTile to="/vendor/bookings" label="Bookings" description="Review requests and manage rentals" icon={CalendarDays} /><ActionTile to="/vendor/onboarding" label="Verification" description="Complete your business profile" icon={ShieldCheck} /></div>
  </WorkspaceShell>;
}

export function AdminDashboardPage() {
  const { user, accessToken } = useAuth();
  const query = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => getAdminDashboard(accessToken ?? ""), enabled: user?.role === "ADMIN" && Boolean(accessToken) });
  if (!user) return <Navigate replace to="/login" />;
  if (user.role !== "ADMIN") return <Navigate replace to={user.role === "CUSTOMER" ? "/dashboard/customer" : "/dashboard/vendor"} />;
  if (query.isLoading) return <WorkspaceShell eyebrow="Administration" title="Operations dashboard" description="Loading supported marketplace metrics."><AsyncState type="loading" title="Loading operations" /></WorkspaceShell>;
  if (query.isError || !query.data) return <WorkspaceShell eyebrow="Administration" title="Operations dashboard" description="The marketplace at a glance."><AsyncState type="error" title="Dashboard unavailable" message="We could not load operational metrics right now." /></WorkspaceShell>;
  const data = query.data;
  return <WorkspaceShell eyebrow="Administration" title="Marketplace operations" description="Prioritize verification work and monitor the marketplace using the metrics currently supported by the API." actions={<Link to="/admin/vendors"><Button>Open verification queue <ArrowUpRight aria-hidden="true" size={16} /></Button></Link>}>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><MetricCard label="Total users" value={data.users.total} icon={LayoutDashboard} /><MetricCard label="Vendors" value={data.users.byRole.VENDOR} icon={Store} tone="secondary" /><MetricCard label="Products" value={data.products} icon={Package} /><MetricCard label="Bookings" value={data.bookings} icon={CalendarDays} tone="warning" /><MetricCard label="Rentals" value={data.rentals} icon={CheckCircle2} tone="success" /><MetricCard label="Customers" value={data.users.byRole.CUSTOMER} icon={LayoutDashboard} /></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><Surface className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Priority queue</p><h2 className="mt-2 text-xl font-black">Vendor verification</h2></div><ShieldCheck aria-hidden="true" className="text-primary" size={22} /></div><div className="mt-5 space-y-3">{Object.entries(data.vendors.byVerificationStatus).map(([status, count]) => <div className="flex items-center justify-between rounded-xl bg-muted p-3" key={status}><span className="text-sm font-semibold capitalize text-muted-foreground">{status.toLowerCase().split("_").join(" ")}</span><span className="font-black">{count}</span></div>)}{Object.keys(data.vendors.byVerificationStatus).length === 0 && <p className="text-sm text-muted-foreground">No verification activity yet.</p>}</div><Link className="mt-5 inline-flex text-sm font-bold text-primary" to="/admin/vendors">Review vendors <ArrowUpRight aria-hidden="true" size={15} /></Link></Surface><Surface className="p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Operational overview</p><h2 className="mt-2 text-xl font-black">Marketplace health</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-border p-4"><p className="text-sm text-muted-foreground">Admins</p><p className="mt-2 text-2xl font-black">{data.users.byRole.ADMIN}</p></div><div className="rounded-xl border border-border p-4"><p className="text-sm text-muted-foreground">Total vendors</p><p className="mt-2 text-2xl font-black">{data.vendors.total}</p></div></div><p className="mt-5 text-sm leading-6 text-muted-foreground">Financial, audit, dispute, damage, and late-return analytics are not currently provided by the dashboard API.</p></Surface></div>
  </WorkspaceShell>;
}

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return <Navigate replace to="/login" />;
  return <Navigate replace to={`/dashboard/${user.role.toLowerCase()}`} />;
}
