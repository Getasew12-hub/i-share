import { Router } from "express";

import {
  createBookingPayment,
  getPayment,
  listMyPayments,
  listVendorPayments,
} from "../controllers/payment-controller.js";
import { requireAuthentication } from "../middleware/authentication.js";
import { requireRoles } from "../middleware/authorization.js";
import { validateRequest } from "../middleware/validate-request.js";
import {
  createBookingPaymentSchema,
  listPaymentQuerySchema,
} from "../schemas/payment-schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const paymentRouter = Router();

paymentRouter.use(requireAuthentication);

// Create payment for a booking
paymentRouter.post(
  "/bookings/:bookingId",
  requireRoles("CUSTOMER"),
  validateRequest("body", createBookingPaymentSchema),
  asyncHandler(createBookingPayment),
);

// Customer payments
paymentRouter.get(
  "/me",
  requireRoles("CUSTOMER"),
  validateRequest("query", listPaymentQuerySchema),
  asyncHandler(listMyPayments),
);

paymentRouter.get(
  "/me/:paymentId",
  requireRoles("CUSTOMER"),
  asyncHandler(getPayment),
);

// Vendor payments (all payments from their bookings)
paymentRouter.get(
  "/vendor",
  requireRoles("VENDOR"),
  validateRequest("query", listPaymentQuerySchema),
  asyncHandler(listVendorPayments),
);
