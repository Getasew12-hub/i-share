import { Router } from "express";

import {
  createMyVendorDocument,
  getMyVendorVerification,
  submitMyVendorVerification,
  updateMyVendorProfile,
} from "../controllers/vendor-controller.js";
import { requireAuthentication } from "../middleware/authentication.js";
import { requireRoles } from "../middleware/authorization.js";
import { validateRequest } from "../middleware/validate-request.js";
import {
  vendorDocumentMetadataSchema,
  vendorProfileUpdateSchema,
} from "../schemas/vendor-schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const vendorRouter = Router();

vendorRouter.use(requireAuthentication, requireRoles("VENDOR"));

vendorRouter.get("/me/verification", asyncHandler(getMyVendorVerification));
vendorRouter.put(
  "/me/profile",
  validateRequest("body", vendorProfileUpdateSchema),
  asyncHandler(updateMyVendorProfile),
);
vendorRouter.post(
  "/me/documents",
  validateRequest("body", vendorDocumentMetadataSchema),
  asyncHandler(createMyVendorDocument),
);
vendorRouter.post(
  "/me/verification/submit",
  asyncHandler(submitMyVendorVerification),
);
