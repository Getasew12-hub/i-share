import type {
  BookingStatus,
  ReviewStatus,
  VendorVerificationStatus,
} from "@prisma/client";

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
  rentals: {
    active: number;
    completed: number;
  };
  successfulPayments: CurrencyTotal[];
  invoices: CurrencyTotal[];
  submittedReviewCount: number;
  unreadNotificationCount: number;
};

export type VendorDashboard = {
  products: {
    total: number;
    published: number;
  };
  bookings: {
    total: number;
    pending: number;
    upcoming: number;
    byStatus: BookingStatusCounts;
  };
  rentals: {
    active: number;
    completed: number;
  };
  successfulPayments: CurrencyTotal[];
  invoices: CurrencyTotal[];
  reviews: {
    publishedCount: number;
    averageRating: number | null;
  };
  unreadNotificationCount: number;
  subscription: {
    id: string;
    status: "ACTIVE";
    startsAt: Date;
    endsAt: Date;
    plan: {
      id: string;
      name: string;
      hasAnalytics: boolean;
    };
  } | null;
};

export type AdminDashboard = {
  users: {
    total: number;
    byRole: Record<"ADMIN" | "VENDOR" | "CUSTOMER", number>;
  };
  vendors: {
    total: number;
    byVerificationStatus: Partial<Record<VendorVerificationStatus, number>>;
  };
  products: number;
  bookings: number;
  rentals: number;
};

export type DashboardRepository = {
  getCustomerMetrics(
    customerId: string,
    userId: string,
    now: Date,
  ): Promise<CustomerDashboard>;
  getVendorMetrics(
    vendorId: string,
    userId: string,
    now: Date,
  ): Promise<VendorDashboard>;
  getAdminMetrics(): Promise<AdminDashboard>;
};

export type DashboardReviewStatus = ReviewStatus;