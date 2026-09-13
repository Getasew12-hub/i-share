import { Router } from "express";

import {
  addMyProductDocument,
  addMyProductImage,
  changeMyProductStatus,
  createMyAvailability,
  createMyProduct,
  deactivateMyProduct,
  deleteMyAvailability,
  getMyProduct,
  getPublishedProduct,
  listCategories,
  listMyAvailability,
  listMyProducts,
  listPublishedProducts,
  updateMyAvailability,
  updateMyProduct,
} from "../controllers/product-controller.js";
import { requireAuthentication } from "../middleware/authentication.js";
import { requireRoles } from "../middleware/authorization.js";
import { validateRequest } from "../middleware/validate-request.js";
import {
  availabilityParamsSchema,
  availabilityPeriodSchema,
  createProductSchema,
  marketplaceQuerySchema,
  productDocumentSchema,
  productImageSchema,
  productParamsSchema,
  productStatusSchema,
  publicProductParamsSchema,
  updateProductSchema,
} from "../schemas/product-schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const productRouter = Router();

productRouter.get("/categories", asyncHandler(listCategories));
productRouter.get(
  "/public",
  validateRequest("query", marketplaceQuerySchema),
  asyncHandler(listPublishedProducts),
);
productRouter.get(
  "/public/:productId",
  validateRequest("params", publicProductParamsSchema),
  asyncHandler(getPublishedProduct),
);

productRouter.use(requireAuthentication, requireRoles("VENDOR"));

productRouter.get("/me", asyncHandler(listMyProducts));
productRouter.post(
  "/me",
  validateRequest("body", createProductSchema),
  asyncHandler(createMyProduct),
);
productRouter.get(
  "/me/:productId",
  validateRequest("params", productParamsSchema),
  asyncHandler(getMyProduct),
);
productRouter.put(
  "/me/:productId",
  validateRequest("params", productParamsSchema),
  validateRequest("body", updateProductSchema),
  asyncHandler(updateMyProduct),
);
productRouter.patch(
  "/me/:productId/status",
  validateRequest("params", productParamsSchema),
  validateRequest("body", productStatusSchema),
  asyncHandler(changeMyProductStatus),
);
productRouter.delete(
  "/me/:productId",
  validateRequest("params", productParamsSchema),
  asyncHandler(deactivateMyProduct),
);
productRouter.post(
  "/me/:productId/images",
  validateRequest("params", productParamsSchema),
  validateRequest("body", productImageSchema),
  asyncHandler(addMyProductImage),
);
productRouter.post(
  "/me/:productId/documents",
  validateRequest("params", productParamsSchema),
  validateRequest("body", productDocumentSchema),
  asyncHandler(addMyProductDocument),
);
productRouter.get(
  "/me/:productId/availability",
  validateRequest("params", productParamsSchema),
  asyncHandler(listMyAvailability),
);
productRouter.post(
  "/me/:productId/availability",
  validateRequest("params", productParamsSchema),
  validateRequest("body", availabilityPeriodSchema),
  asyncHandler(createMyAvailability),
);
productRouter.put(
  "/me/:productId/availability/:availabilityId",
  validateRequest("params", availabilityParamsSchema),
  validateRequest("body", availabilityPeriodSchema),
  asyncHandler(updateMyAvailability),
);
productRouter.delete(
  "/me/:productId/availability/:availabilityId",
  validateRequest("params", availabilityParamsSchema),
  asyncHandler(deleteMyAvailability),
);
