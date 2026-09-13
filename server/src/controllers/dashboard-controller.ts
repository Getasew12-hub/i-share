import type { Request, Response } from "express";

import { dashboardService } from "../services/dashboard-service.js";
import { sendSuccess } from "../utils/http.js";

export async function getCustomerDashboard(request: Request, response: Response) {
  sendSuccess(response, await dashboardService.getCustomerDashboard(request.user!.id));
}

export async function getVendorDashboard(request: Request, response: Response) {
  sendSuccess(response, await dashboardService.getVendorDashboard(request.user!.id));
}

export async function getAdminDashboard(_request: Request, response: Response) {
  sendSuccess(response, await dashboardService.getAdminDashboard());
}