import { Router } from "express";

import {
  cancelMySubscription,
  changeMySubscriptionPlan,
  getMySubscription,
  listSubscriptionPlans,
  selectMySubscription,
} from "../controllers/subscription-controller.js";
import { requireAuthentication } from "../middleware/authentication.js";
import { requireRoles } from "../middleware/authorization.js";
import { validateRequest } from "../middleware/validate-request.js";
import {
  changeSubscriptionPlanSchema,
  selectSubscriptionSchema,
} from "../schemas/subscription-schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const subscriptionRouter = Router();

subscriptionRouter.get("/plans", asyncHandler(listSubscriptionPlans));

subscriptionRouter.use(requireAuthentication, requireRoles("VENDOR"));

subscriptionRouter.get("/me", asyncHandler(getMySubscription));
subscriptionRouter.post(
  "/me",
  validateRequest("body", selectSubscriptionSchema),
  asyncHandler(selectMySubscription),
);
subscriptionRouter.patch(
  "/me/plan",
  validateRequest("body", changeSubscriptionPlanSchema),
  asyncHandler(changeMySubscriptionPlan),
);
subscriptionRouter.post("/me/cancel", asyncHandler(cancelMySubscription));
