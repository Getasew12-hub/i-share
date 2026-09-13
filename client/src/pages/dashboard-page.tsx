import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../hooks/use-auth";
import {
  listMyBookings,
  listVendorBookings,
} from "../services/booking-service";
import {
  getAdminDashboard,
  getCustomerDashboard,
  getVendorDashboard,
} from "../services/dashboard-service";
import type { Booking } from "../types/booking";
import type {
  AdminDashboard,
  CurrencyTotal,
  CustomerDashboard,
  VendorDashboard,
} from "../types/dashboard";

const cardClass = "rounded-xl border border-border bg-white p-5 shadow-sm";

function money(amount: string, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function DashboardShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
          <Link
            className="inline-flex w-fit items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            to="/products"
          >
            Browse marketplace <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {children}
      </section>
    </main>
  );
}

function DashboardState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`${cardClass} flex min-h-56 flex-col items-center justify-center text-center`}
    >
      <AlertCircle className="mb-3 text-slate-400" aria-hidden="true" />
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  detail,
}: {
  label: string;
  value: string | number;
  icon: typeof CalendarDays;
  detail?: string;
}) {
  return (
    <div className={cardClass}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-primary">
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>
      <p className="text-3xl font-semibold text-slate-950">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

function CurrencyTotals({
  title,
  totals,
  emptyText = "No totals yet.",
}: {
  title: string;
  totals: CurrencyTotal[];
  emptyText?: string;
}) {
  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-950">{title}</h2>
        <CreditCard size={18} className="text-slate-400" aria-hidden="true" />
      </div>
      {totals.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {totals.map((total) => (
            <div
              className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              key={total.currency}
            >
              <span className="text-sm text-slate-500">{total.currency}</span>
              <span className="text-sm font-semibold text-slate-900">
                {money(total.amount, total.currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function QuickLinks({
  vendor = false,
  admin = false,
}: {
  vendor?: boolean;
  admin?: boolean;
}) {
  const links = admin
    ? [
        {
          to: "/admin/vendors",
          label: "Vendor verification",
          icon: ShieldCheck,
        },
      ]
    : vendor
      ? [
          { to: "/vendor/products", label: "Manage products", icon: Package },
          {
            to: "/vendor/bookings",
            label: "Manage bookings",
            icon: CalendarDays,
          },
          {
            to: "/vendor/subscription",
            label: "Subscription",
            icon: CreditCard,
          },
        ]
      : [
          { to: "/products", label: "Marketplace", icon: Package },
          { to: "/bookings/me", label: "Bookings", icon: CalendarDays },
          { to: "/payments", label: "Payments", icon: CreditCard },
          { to: "/invoices", label: "Invoices", icon: FileText },
          { to: "/reviews", label: "Reviews", icon: Star },
          { to: "/notifications", label: "Notifications", icon: Bell },
        ];

  return (
    <section className={`${cardClass} mt-6`}>
      <h2 className="mb-4 font-semibold text-slate-950">Quick actions</h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary"
            key={to}
            to={to}
          >
            <span className="flex items-center gap-2">
              <Icon size={16} aria-hidden="true" />
              {label}
            </span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecentBookings({
  bookings,
  vendor = false,
}: {
  bookings: Booking[];
  vendor?: boolean;
}) {
  const visibleBookings = bookings.slice(0, 5);
  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-950">
          {vendor ? "Recent booking activity" : "Upcoming and recent bookings"}
        </h2>
        <Link
          className="text-xs font-semibold text-primary hover:underline"
          to={vendor ? "/vendor/bookings" : "/bookings/me"}
        >
          View all
        </Link>
      </div>
      {visibleBookings.length === 0 ? (
        <p className="text-sm text-slate-500">No bookings to show yet.</p>
      ) : (
        <div className="space-y-3">
          {visibleBookings.map((booking) => (
            <Link
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 transition hover:border-primary"
              key={booking.id}
              to={
                vendor
                  ? `/vendor/bookings/${booking.id}`
                  : `/bookings/me/${booking.id}`
              }
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {booking.product.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(booking.startsAt).toLocaleDateString()} to{" "}
                  {new Date(booking.endsAt).toLocaleDateString()}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {booking.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function useBookings(role: "CUSTOMER" | "VENDOR", accessToken: string | null) {
  return useQuery({
    queryKey: [
      role === "CUSTOMER" ? "my-bookings" : "vendor-bookings",
      accessToken,
    ],
    queryFn: () =>
      role === "CUSTOMER"
        ? listMyBookings(accessToken ?? "")
        : listVendorBookings(accessToken ?? ""),
    enabled: Boolean(accessToken),
  });
}

export function CustomerDashboardPage() {
  const { user, accessToken } = useAuth();
  const query = useQuery({
    queryKey: ["customer-dashboard"],
    queryFn: () => getCustomerDashboard(accessToken ?? ""),
    enabled: user?.role === "CUSTOMER" && Boolean(accessToken),
  });
  const bookingsQuery = useBookings("CUSTOMER", accessToken);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "CUSTOMER")
    return (
      <Navigate
        to={user.role === "VENDOR" ? "/dashboard/vendor" : "/dashboard/admin"}
        replace
      />
    );
  if (query.isLoading)
    return (
      <DashboardShell
        eyebrow="Customer workspace"
        title="Your dashboard"
        description="Loading your rental activity."
      >
        <DashboardState
          title="Loading dashboard"
          message="Gathering your bookings, rentals, payments, and notifications."
        />
      </DashboardShell>
    );
  if (query.isError || !query.data)
    return (
      <DashboardShell
        eyebrow="Customer workspace"
        title="Your dashboard"
        description="Your rental activity at a glance."
      >
        <DashboardState
          title="Dashboard unavailable"
          message="We could not load your dashboard right now. Please try again shortly."
        />
      </DashboardShell>
    );
  return (
    <CustomerDashboardContent
      data={query.data}
      bookings={bookingsQuery.data ?? []}
    />
  );
}

function CustomerDashboardContent({
  data,
  bookings,
}: {
  data: CustomerDashboard;
  bookings: Booking[];
}) {
  return (
    <DashboardShell
      eyebrow="Customer workspace"
      title="Your dashboard"
      description="A clear view of the rentals, payments, and follow-up tasks that matter now."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total bookings"
          value={data.bookings.total}
          icon={CalendarDays}
        />
        <StatCard
          label="Pending bookings"
          value={data.bookings.pending}
          icon={CalendarDays}
          detail="Awaiting confirmation"
        />
        <StatCard
          label="Upcoming bookings"
          value={data.bookings.upcoming}
          icon={CalendarDays}
        />
        <StatCard
          label="Unread notifications"
          value={data.unreadNotificationCount}
          icon={Bell}
        />
        <StatCard
          label="Active rentals"
          value={data.rentals.active}
          icon={Package}
        />
        <StatCard
          label="Completed rentals"
          value={data.rentals.completed}
          icon={CheckCircle2}
        />
        <StatCard
          label="Reviews submitted"
          value={data.submittedReviewCount}
          icon={Star}
        />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <CurrencyTotals
          title="Successful payments"
          totals={data.successfulPayments}
        />
        <CurrencyTotals title="Invoices" totals={data.invoices} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <RecentBookings bookings={bookings} />
        <section className={cardClass}>
          <h2 className="mb-4 font-semibold text-slate-950">
            Rental follow-up
          </h2>
          <p className="text-sm leading-6 text-slate-500">
            Completed rentals can be reviewed from the Reviews area when the
            rental is eligible.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            to="/reviews"
          >
            Open reviews <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </div>
      <QuickLinks />
    </DashboardShell>
  );
}

export function VendorDashboardPage() {
  const { user, accessToken } = useAuth();
  const query = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: () => getVendorDashboard(accessToken ?? ""),
    enabled: user?.role === "VENDOR" && Boolean(accessToken),
  });
  const bookingsQuery = useBookings("VENDOR", accessToken);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "VENDOR")
    return (
      <Navigate
        to={
          user.role === "CUSTOMER" ? "/dashboard/customer" : "/dashboard/admin"
        }
        replace
      />
    );
  if (query.isLoading)
    return (
      <DashboardShell
        eyebrow="Vendor workspace"
        title="Business dashboard"
        description="Loading your business activity."
      >
        <DashboardState
          title="Loading dashboard"
          message="Gathering products, bookings, rentals, and subscription information."
        />
      </DashboardShell>
    );
  if (query.isError || !query.data)
    return (
      <DashboardShell
        eyebrow="Vendor workspace"
        title="Business dashboard"
        description="Your marketplace operations at a glance."
      >
        <DashboardState
          title="Dashboard unavailable"
          message="We could not load your dashboard right now. Please try again shortly."
        />
      </DashboardShell>
    );
  return (
    <VendorDashboardContent
      data={query.data}
      bookings={bookingsQuery.data ?? []}
    />
  );
}

function VendorDashboardContent({
  data,
  bookings,
}: {
  data: VendorDashboard;
  bookings: Booking[];
}) {
  return (
    <DashboardShell
      eyebrow="Vendor workspace"
      title="Business dashboard"
      description="Track inventory, booking demand, rental progress, and published customer feedback."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total products"
          value={data.products.total}
          icon={Package}
        />
        <StatCard
          label="Published products"
          value={data.products.published}
          icon={CheckCircle2}
        />
        <StatCard
          label="Pending bookings"
          value={data.bookings.pending}
          icon={CalendarDays}
        />
        <StatCard
          label="Upcoming bookings"
          value={data.bookings.upcoming}
          icon={CalendarDays}
        />
        <StatCard
          label="Active rentals"
          value={data.rentals.active}
          icon={Package}
        />
        <StatCard
          label="Completed rentals"
          value={data.rentals.completed}
          icon={CheckCircle2}
        />
        <StatCard
          label="Unread notifications"
          value={data.unreadNotificationCount}
          icon={Bell}
        />
        <StatCard
          label="Published reviews"
          value={data.reviews.publishedCount}
          icon={Star}
          detail={
            data.reviews.averageRating === null
              ? "No rating yet"
              : `${data.reviews.averageRating.toFixed(1)} average rating`
          }
        />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <CurrencyTotals
          title="Successful booking payments"
          totals={data.successfulPayments}
        />
        <CurrencyTotals title="Invoices" totals={data.invoices} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <RecentBookings bookings={bookings} vendor />
        <section className={cardClass}>
          <h2 className="mb-4 font-semibold text-slate-950">Subscription</h2>
          {data.subscription ? (
            <>
              <p className="text-lg font-semibold text-slate-950">
                {data.subscription.plan.name}
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                Active through{" "}
                {new Date(data.subscription.endsAt).toLocaleDateString()}
              </p>
              <p className="mt-4 text-sm text-slate-500">
                {data.subscription.plan.hasAnalytics
                  ? "Advanced analytics entitlement is enabled."
                  : "Basic operational dashboard access is available."}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              No active subscription is currently recorded.
            </p>
          )}
          <Link
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            to="/vendor/subscription"
          >
            Manage subscription <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </div>
      <QuickLinks vendor />
    </DashboardShell>
  );
}

export function AdminDashboardPage() {
  const { user, accessToken } = useAuth();
  const query = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => getAdminDashboard(accessToken ?? ""),
    enabled: user?.role === "ADMIN" && Boolean(accessToken),
  });
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ADMIN")
    return (
      <Navigate
        to={
          user.role === "CUSTOMER" ? "/dashboard/customer" : "/dashboard/vendor"
        }
        replace
      />
    );
  if (query.isLoading)
    return (
      <DashboardShell
        eyebrow="Administration"
        title="Operations dashboard"
        description="Loading supported operational counts."
      >
        <DashboardState
          title="Loading dashboard"
          message="Gathering users, vendors, products, bookings, and rentals."
        />
      </DashboardShell>
    );
  if (query.isError || !query.data)
    return (
      <DashboardShell
        eyebrow="Administration"
        title="Operations dashboard"
        description="Supported marketplace operations at a glance."
      >
        <DashboardState
          title="Dashboard unavailable"
          message="We could not load the admin dashboard right now. Please try again shortly."
        />
      </DashboardShell>
    );
  return <AdminDashboardContent data={query.data} />;
}

function AdminDashboardContent({ data }: { data: AdminDashboard }) {
  return (
    <DashboardShell
      eyebrow="Administration"
      title="Operations dashboard"
      description="Monitor the core marketplace counts and vendor verification queue."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={data.users.total}
          icon={LayoutDashboard}
        />
        <StatCard
          label="Admins"
          value={data.users.byRole.ADMIN}
          icon={ShieldCheck}
        />
        <StatCard
          label="Vendors"
          value={data.users.byRole.VENDOR}
          icon={Package}
        />
        <StatCard
          label="Customers"
          value={data.users.byRole.CUSTOMER}
          icon={LayoutDashboard}
        />
        <StatCard
          label="Total vendors"
          value={data.vendors.total}
          icon={ShieldCheck}
        />
        <StatCard label="Products" value={data.products} icon={Package} />
        <StatCard label="Bookings" value={data.bookings} icon={CalendarDays} />
        <StatCard label="Rentals" value={data.rentals} icon={CheckCircle2} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="mb-4 font-semibold text-slate-950">
            Vendor verification
          </h2>
          <div className="space-y-3">
            {Object.entries(data.vendors.byVerificationStatus).map(
              ([status, count]) => (
                <div
                  className="flex justify-between border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0"
                  key={status}
                >
                  <span className="text-slate-500">
                    {status.replace(/_/g, " ")}
                  </span>
                  <span className="font-semibold text-slate-900">{count}</span>
                </div>
              ),
            )}
            {Object.keys(data.vendors.byVerificationStatus).length === 0 && (
              <p className="text-sm text-slate-500">
                No vendor verification activity yet.
              </p>
            )}
          </div>
          <Link
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            to="/admin/vendors"
          >
            Review vendors <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </section>
        <section className={cardClass}>
          <h2 className="mb-4 font-semibold text-slate-950">
            Operational scope
          </h2>
          <p className="text-sm leading-6 text-slate-500">
            This dashboard shows counts currently supported by the dashboard
            API. Financial, audit, dispute, damage, and late-return analytics
            will appear when their backend metrics are available.
          </p>
        </section>
      </div>
      <QuickLinks admin />
    </DashboardShell>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/dashboard/${user.role.toLowerCase()}`} replace />;
}
