import { Router } from "express";

import {
  createReview,
  getProductRating,
  getReview,
  listMyReviews,
  listProductReviews,
  listVendorReviews,
} from "../controllers/review-controller.js";
import { requireAuthentication } from "../middleware/authentication.js";
import { requireRoles } from "../middleware/authorization.js";
import { validateRequest } from "../middleware/validate-request.js";
import { createReviewSchema } from "../schemas/review-schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const reviewRouter = Router();

// Public endpoints (no auth required)
reviewRouter.get("/:reviewId", asyncHandler(getReview));
reviewRouter.get("/product/:productId", asyncHandler(listProductReviews));
reviewRouter.get("/product/:productId/rating", asyncHandler(getProductRating));

reviewRouter.use(requireAuthentication);

// Customer reviews
reviewRouter.post(
  "/",
  requireRoles("CUSTOMER"),
  validateRequest("body", createReviewSchema),
  asyncHandler(createReview),
);

reviewRouter.get("/me", requireRoles("CUSTOMER"), asyncHandler(listMyReviews));

// Vendor reviews (their product reviews)
reviewRouter.get(
  "/vendor",
  requireRoles("VENDOR"),
  asyncHandler(listVendorReviews),
);
