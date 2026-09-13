import { Router } from "express";

import {
  cancelMyBooking,
  cancelVendorBooking,
  completeVendorRental,
  confirmVendorBooking,
  createMyBooking,
  getMyBooking,
  getVendorBooking,
  listMyBookings,
  listVendorBookings,
  rejectVendorBooking,
  startVendorRental,
} from "../controllers/booking-controller.js";
import { requireAuthentication } from "../middleware/authentication.js";
import { requireRoles } from "../middleware/authorization.js";
import { validateRequest } from "../middleware/validate-request.js";
import {
  bookingParamsSchema,
  cancelBookingSchema,
  completeRentalSchema,
  createBookingSchema,
  rejectBookingSchema,
} from "../schemas/booking-schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const bookingRouter = Router();

bookingRouter.use(requireAuthentication);

bookingRouter.get(
  "/me",
  requireRoles("CUSTOMER"),
  asyncHandler(listMyBookings),
);
bookingRouter.post(
  "/me",
  requireRoles("CUSTOMER"),
  validateRequest("body", createBookingSchema),
  asyncHandler(createMyBooking),
);
bookingRouter.get(
  "/me/:bookingId",
  requireRoles("CUSTOMER"),
  validateRequest("params", bookingParamsSchema),
  asyncHandler(getMyBooking),
);
bookingRouter.post(
  "/me/:bookingId/cancel",
  requireRoles("CUSTOMER"),
  validateRequest("params", bookingParamsSchema),
  validateRequest("body", cancelBookingSchema),
  asyncHandler(cancelMyBooking),
);

bookingRouter.get(
  "/vendor",
  requireRoles("VENDOR"),
  asyncHandler(listVendorBookings),
);
bookingRouter.get(
  "/vendor/:bookingId",
  requireRoles("VENDOR"),
  validateRequest("params", bookingParamsSchema),
  asyncHandler(getVendorBooking),
);
bookingRouter.post(
  "/vendor/:bookingId/confirm",
  requireRoles("VENDOR"),
  validateRequest("params", bookingParamsSchema),
  asyncHandler(confirmVendorBooking),
);
bookingRouter.post(
  "/vendor/:bookingId/reject",
  requireRoles("VENDOR"),
  validateRequest("params", bookingParamsSchema),
  validateRequest("body", rejectBookingSchema),
  asyncHandler(rejectVendorBooking),
);
bookingRouter.post(
  "/vendor/:bookingId/cancel",
  requireRoles("VENDOR"),
  validateRequest("params", bookingParamsSchema),
  validateRequest("body", cancelBookingSchema),
  asyncHandler(cancelVendorBooking),
);
bookingRouter.post(
  "/vendor/:bookingId/rental/start",
  requireRoles("VENDOR"),
  validateRequest("params", bookingParamsSchema),
  asyncHandler(startVendorRental),
);
bookingRouter.post(
  "/vendor/:bookingId/rental/complete",
  requireRoles("VENDOR"),
  validateRequest("params", bookingParamsSchema),
  validateRequest("body", completeRentalSchema),
  asyncHandler(completeVendorRental),
);
