import { Router } from "express";

import {
  approveVendor,
  getVendorReview,
  listPendingVendors,
  rejectVendor,
} from "../controllers/vendor-controller.js";
import { requireAuthentication } from "../middleware/authentication.js";
import { requireRoles } from "../middleware/authorization.js";
import { validateRequest } from "../middleware/validate-request.js";
import {
  vendorIdParamSchema,
  vendorRejectionSchema,
} from "../schemas/vendor-schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const adminRouter = Router();

adminRouter.use(requireAuthentication, requireRoles("ADMIN"));

adminRouter.get("/vendors/pending", asyncHandler(listPendingVendors));
adminRouter.get(
  "/vendors/:vendorId",
  validateRequest("params", vendorIdParamSchema),
  asyncHandler(getVendorReview),
);
adminRouter.post(
  "/vendors/:vendorId/approve",
  validateRequest("params", vendorIdParamSchema),
  asyncHandler(approveVendor),
);
adminRouter.post(
  "/vendors/:vendorId/reject",
  validateRequest("params", vendorIdParamSchema),
  validateRequest("body", vendorRejectionSchema),
  asyncHandler(rejectVendor),
);
