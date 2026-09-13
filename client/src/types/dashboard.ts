import type { BookingStatus } from "./booking";

export type CurrencyTotal = {
  currency: string;
  amount: string;
  count: number;
};

export type BookingStatusCounts = Partial<Record<BookingStatus, number>>;

export type CustomerDashboard = {
  bookings: {
    total: number;
    pending: number;
    upcoming: number;
    byStatus: BookingStatusCounts;
  };
  rentals: { active: number; completed: number };
  successfulPayments: CurrencyTotal[];
  invoices: CurrencyTotal[];
  submittedReviewCount: number;
  unreadNotificationCount: number;
};

export type VendorDashboard = {
  products: { total: number; published: number };
  bookings: {
    total: number;
    pending: number;
    upcoming: number;
    byStatus: BookingStatusCounts;
  };
  rentals: { active: number; completed: number };
  successfulPayments: CurrencyTotal[];
  invoices: CurrencyTotal[];
  reviews: { publishedCount: number; averageRating: number | null };
  unreadNotificationCount: number;
  subscription: {
    id: string;
    status: "ACTIVE";
    startsAt: string;
    endsAt: string;
    plan: { id: string; name: string; hasAnalytics: boolean };
  } | null;
};

export type AdminDashboard = {
  users: {
    total: number;
    byRole: Record<"ADMIN" | "VENDOR" | "CUSTOMER", number>;
  };
  vendors: {
    total: number;
    byVerificationStatus: Partial<
      Record<"NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED", number>
    >;
  };
  products: number;
  bookings: number;
  rentals: number;
};
