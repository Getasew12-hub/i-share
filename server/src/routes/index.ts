import { Router } from "express";

import { adminRouter } from "./admin-routes.js";
import { authRouter } from "./auth-routes.js";
import { availabilityRouter } from "./availability-routes.js";
import { bookingRouter } from "./booking-routes.js";
import { dashboardRouter } from "./dashboard-routes.js";
import { healthRouter } from "./health-routes.js";
import { invoiceRouter } from "./invoice-routes.js";
import { notificationRouter } from "./notification-routes.js";
import { paymentRouter } from "./payment-routes.js";
import { productRouter } from "./product-routes.js";
import { reviewRouter } from "./review-routes.js";
import { subscriptionRouter } from "./subscription-routes.js";
import { vendorRouter } from "./vendor-routes.js";

export const apiV1Router = Router();

apiV1Router.use("/admin", adminRouter);
apiV1Router.use("/auth", authRouter);
apiV1Router.use("/bookings", bookingRouter);
apiV1Router.use("/dashboards", dashboardRouter);
apiV1Router.use("/health", healthRouter);
apiV1Router.use("/invoices", invoiceRouter);
apiV1Router.use("/notifications", notificationRouter);
apiV1Router.use("/payments", paymentRouter);
apiV1Router.use("/products", availabilityRouter);
apiV1Router.use("/products", productRouter);
apiV1Router.use("/reviews", reviewRouter);
apiV1Router.use("/subscriptions", subscriptionRouter);
apiV1Router.use("/vendors", vendorRouter);
