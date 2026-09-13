import { Router } from "express";

import {
  getAdminDashboard,
  getCustomerDashboard,
  getVendorDashboard,
} from "../controllers/dashboard-controller.js";
import { requireAuthentication } from "../middleware/authentication.js";
import { requireRoles } from "../middleware/authorization.js";
import { asyncHandler } from "../utils/async-handler.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuthentication);
dashboardRouter.get("/customer", requireRoles("CUSTOMER"), asyncHandler(getCustomerDashboard));
dashboardRouter.get("/vendor", requireRoles("VENDOR"), asyncHandler(getVendorDashboard));
dashboardRouter.get("/admin", requireRoles("ADMIN"), asyncHandler(getAdminDashboard));