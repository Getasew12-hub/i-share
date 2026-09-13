import { Router } from "express";

import {
  confirmEmailVerification,
  getCurrentUser,
  login,
  logout,
  refresh,
  registerCustomer,
  registerVendor,
  requestEmailVerification,
} from "../controllers/auth-controller.js";
import { requireAuthentication } from "../middleware/authentication.js";
import { validateRequest } from "../middleware/validate-request.js";
import {
  customerRegistrationSchema,
  emailVerificationConfirmSchema,
  loginSchema,
  vendorRegistrationSchema,
} from "../schemas/auth-schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const authRouter = Router();

authRouter.post(
  "/register/customer",
  validateRequest("body", customerRegistrationSchema),
  asyncHandler(registerCustomer),
);
authRouter.post(
  "/register/vendor",
  validateRequest("body", vendorRegistrationSchema),
  asyncHandler(registerVendor),
);
authRouter.post(
  "/login",
  validateRequest("body", loginSchema),
  asyncHandler(login),
);
authRouter.post("/refresh", asyncHandler(refresh));
authRouter.post("/logout", asyncHandler(logout));
authRouter.get("/me", requireAuthentication, asyncHandler(getCurrentUser));
authRouter.post(
  "/email-verification/request",
  requireAuthentication,
  asyncHandler(requestEmailVerification),
);
authRouter.post(
  "/email-verification/confirm",
  validateRequest("body", emailVerificationConfirmSchema),
  asyncHandler(confirmEmailVerification),
);
