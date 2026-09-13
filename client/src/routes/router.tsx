import { createBrowserRouter } from "react-router-dom";

import { RootLayout } from "../layouts/root-layout";
import { AdminVendorVerificationPage } from "../pages/admin-vendor-verification-page";
import { BookingDetailPage } from "../pages/booking-detail-page";
import { CreateBookingPage } from "../pages/create-booking-page";
import {
  AdminDashboardPage,
  CustomerDashboardPage,
  DashboardPage,
  VendorDashboardPage,
} from "../pages/dashboard-page";
import { HomePage } from "../pages/home-page";
import { InvoicesPage } from "../pages/invoices-page";
import { LoginPage } from "../pages/login-page";
import { MyBookingsPage } from "../pages/my-bookings-page";
import { NotificationsPage } from "../pages/notifications-page";
import { PaymentsPage } from "../pages/payments-page";
import { PublicProductDetailPage } from "../pages/public-product-detail-page";
import { PublicProductsPage } from "../pages/public-products-page";
import { RegisterPage } from "../pages/register-page";
import { ReviewsPage } from "../pages/reviews-page";
import { VendorBookingDetailPage } from "../pages/vendor-booking-detail-page";
import { VendorBookingsPage } from "../pages/vendor-bookings-page";
import { VendorOnboardingPage } from "../pages/vendor-onboarding-page";
import { VendorProductsPage } from "../pages/vendor-products-page";
import { VendorSubscriptionPage } from "../pages/vendor-subscription-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "dashboard/customer",
        element: <CustomerDashboardPage />,
      },
      {
        path: "dashboard/vendor",
        element: <VendorDashboardPage />,
      },
      {
        path: "dashboard/admin",
        element: <AdminDashboardPage />,
      },
      {
        path: "products",
        element: <PublicProductsPage />,
      },
      {
        path: "products/:productId",
        element: <PublicProductDetailPage />,
      },
      {
        path: "products/:productId/book",
        element: <CreateBookingPage />,
      },
      {
        path: "bookings/me",
        element: <MyBookingsPage />,
      },
      {
        path: "bookings/me/:bookingId",
        element: <BookingDetailPage />,
      },
      {
        path: "payments",
        element: <PaymentsPage />,
      },
      {
        path: "invoices",
        element: <InvoicesPage />,
      },
      {
        path: "reviews",
        element: <ReviewsPage />,
      },
      {
        path: "notifications",
        element: <NotificationsPage />,
      },
      {
        path: "vendor/onboarding",
        element: <VendorOnboardingPage />,
      },
      {
        path: "vendor/products",
        element: <VendorProductsPage />,
      },
      {
        path: "vendor/subscription",
        element: <VendorSubscriptionPage />,
      },
      {
        path: "vendor/bookings",
        element: <VendorBookingsPage />,
      },
      {
        path: "vendor/bookings/:bookingId",
        element: <VendorBookingDetailPage />,
      },
      {
        path: "admin/vendors",
        element: <AdminVendorVerificationPage />,
      },
    ],
  },
]);
