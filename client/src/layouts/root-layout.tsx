import {
  Bell,
  ChevronDown,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/use-auth";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

function navItems(role: string | undefined): NavItem[] {
  const shared: NavItem[] = [
    { to: "/products", label: "Marketplace", icon: ShoppingBag },
  ];

  if (role === "CUSTOMER") {
    return [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
      ...shared,
      { to: "/bookings/me", label: "Bookings", icon: Package },
      { to: "/payments", label: "Payments", icon: CreditCard },
      { to: "/invoices", label: "Invoices", icon: FileText },
      { to: "/reviews", label: "Reviews", icon: Star },
      { to: "/notifications", label: "Notifications", icon: Bell },
    ];
  }

  if (role === "VENDOR") {
    return [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { to: "/vendor/products", label: "Products", icon: Store },
      { to: "/vendor/bookings", label: "Bookings", icon: Package },
      { to: "/vendor/subscription", label: "Subscription", icon: CreditCard },
      { to: "/payments", label: "Payments", icon: CreditCard },
      { to: "/invoices", label: "Invoices", icon: FileText },
      { to: "/reviews", label: "Reviews", icon: Star },
      { to: "/notifications", label: "Notifications", icon: Bell },
    ];
  }

  if (role === "ADMIN") {
    return [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { to: "/admin/vendors", label: "Vendor verification", icon: ShieldCheck },
      ...shared,
      { to: "/notifications", label: "Notifications", icon: Bell },
    ];
  }

  return shared;
}

function isActivePath(pathname: string, to: string) {
  return to === "/products"
    ? pathname === "/products" || pathname.startsWith("/products/")
    : pathname === to || pathname.startsWith(`${to}/`);
}

export function RootLayout() {
  const { user, logout, isBootstrapping } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const items = navItems(user?.role);
  const userDisplayName = user?.displayName?.trim() || user?.email || "Account";

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-[4.5rem] max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="i-Share home">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground">
              iS
            </span>
            <span className="hidden text-lg font-black tracking-[-0.03em] text-foreground sm:inline">
              i-Share
            </span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex" aria-label="Primary navigation">
            {items.map(({ to, label, icon: Icon }) => {
              const active = isActivePath(location.pathname, to);
              return (
                <Link
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-muted text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  key={to}
                  to={to}
                >
                  <Icon aria-hidden="true" size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              className="hidden size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
              to="/products"
              aria-label="Search marketplace"
              title="Search marketplace"
            >
              <Search aria-hidden="true" size={19} />
            </Link>
            {!user ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                  to="/register"
                >
                  Create account
                </Link>
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                  to="/login"
                >
                  Sign in
                </Link>
              </div>
            ) : (
              <div className="relative hidden sm:block">
                <button
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Open user menu"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold hover:bg-muted"
                  onClick={() => setIsUserMenuOpen((open) => !open)}
                  type="button"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-black text-secondary-foreground">
                    {userDisplayName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="max-w-28 truncate">{userDisplayName}</span>
                  <ChevronDown aria-hidden="true" size={15} />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-12 w-48 rounded-xl border border-border bg-surface p-2 shadow-xl" role="menu">
                    <Link
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                      onClick={() => setIsUserMenuOpen(false)}
                      role="menuitem"
                      to="/dashboard"
                    >
                      <LayoutDashboard aria-hidden="true" size={16} />
                      Dashboard
                    </Link>
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-red-50"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        void logout();
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <LogOut aria-hidden="true" size={16} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border hover:bg-muted lg:hidden"
              onClick={() => setIsMenuOpen((open) => !open)}
              type="button"
            >
              {isMenuOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-border bg-surface px-4 py-3 lg:hidden">
            <nav className="mx-auto grid max-w-[1600px] gap-1 sm:grid-cols-2" aria-label="Mobile navigation">
              {items.map(({ to, label, icon: Icon }) => (
                <Link
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${
                    isActivePath(location.pathname, to)
                      ? "bg-muted text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  key={to}
                  onClick={() => setIsMenuOpen(false)}
                  to={to}
                >
                  <Icon aria-hidden="true" size={18} />
                  {label}
                </Link>
              ))}
              {!user && (
                <>
                  <Link
                    className="flex items-center justify-center rounded-lg border border-border px-3 py-3 text-sm font-semibold hover:bg-muted"
                    onClick={() => setIsMenuOpen(false)}
                    to="/register"
                  >
                    Create account
                  </Link>
                  <Link
                    className="flex items-center justify-center rounded-lg bg-primary px-3 py-3 text-sm font-bold text-primary-foreground"
                    onClick={() => setIsMenuOpen(false)}
                    to="/login"
                  >
                    Sign in
                  </Link>
                </>
              )}
              {user && (
                <button
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-destructive hover:bg-red-50 sm:col-span-2"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void logout();
                  }}
                  type="button"
                >
                  <LogOut aria-hidden="true" size={18} />
                  Sign out
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      <Outlet />
    </div>
  );
}
