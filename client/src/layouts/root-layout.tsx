import {
  Bell,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/use-auth";

export function RootLayout() {
  const { user, logout, isBootstrapping } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (isBootstrapping) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <span className="text-primary">i-Share</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex md:gap-8">
              {user && (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              )}
              <Link
                to="/products"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Shop
              </Link>
              {user && (
                <>
                  <Link
                    to="/bookings/me"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Bookings
                  </Link>
                  <Link
                    to="/payments"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <CreditCard className="h-4 w-4" />
                    Payments
                  </Link>
                  <Link
                    to="/invoices"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <FileText className="h-4 w-4" />
                    Invoices
                  </Link>
                  <Link
                    to="/reviews"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Star className="h-4 w-4" />
                    Reviews
                  </Link>
                  <Link
                    to="/notifications"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Bell className="h-4 w-4" />
                    Notifications
                  </Link>
                  {user.role === "VENDOR" && (
                    <>
                      <Link
                        to="/vendor/products"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        My Products
                      </Link>
                      <Link
                        to="/vendor/bookings"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Vendor Bookings
                      </Link>
                    </>
                  )}
                </>
              )}
            </nav>

            <div className="flex items-center gap-4">
              {!user && (
                <Link
                  to="/login"
                  className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
                >
                  Login
                </Link>
              )}
              {user && (
                <>
                  <span className="hidden text-sm text-muted-foreground sm:inline">
                    {user.displayName}
                  </span>
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && user && (
            <div className="border-t border-border pb-4 pt-4 md:hidden">
              <nav className="flex flex-col gap-2">
                <Link
                  to="/dashboard"
                  className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/products"
                  className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Shop
                </Link>
                <Link
                  to="/bookings/me"
                  className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Bookings
                </Link>
                <Link
                  to="/payments"
                  className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Payments
                </Link>
                <Link
                  to="/invoices"
                  className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Invoices
                </Link>
                <Link
                  to="/reviews"
                  className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Reviews
                </Link>
                <Link
                  to="/notifications"
                  className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Notifications
                </Link>
                {user.role === "VENDOR" && (
                  <>
                    <Link
                      to="/vendor/products"
                      className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Products
                    </Link>
                    <Link
                      to="/vendor/bookings"
                      className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Vendor Bookings
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <Outlet />
    </div>
  );
}
