import { AppError } from "../errors/app-error.js";
import { prisma } from "../config/prisma.js";
import { prismaDashboardRepository } from "../repositories/dashboard-repository.js";
import type { DashboardRepository } from "../types/dashboard.js";

export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async getCustomerDashboard(userId: string) {
    const customer = await this.repositoryCustomerId(userId);
    return this.repository.getCustomerMetrics(customer, userId, new Date());
  }

  async getVendorDashboard(userId: string) {
    const vendor = await this.repositoryVendorId(userId);
    return this.repository.getVendorMetrics(vendor, userId, new Date());
  }

  getAdminDashboard() {
    return this.repository.getAdminMetrics();
  }

  private async repositoryCustomerId(userId: string) {
    const profile = await prisma.customerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new AppError(404, "CUSTOMER_PROFILE_NOT_FOUND", "Customer profile not found.");
    return profile.id;
  }

  private async repositoryVendorId(userId: string) {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new AppError(404, "VENDOR_PROFILE_NOT_FOUND", "Vendor profile not found.");
    return profile.id;
  }
}

export const dashboardService = new DashboardService(prismaDashboardRepository);