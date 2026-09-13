import { apiClient } from "./api-client";
import type {
  AdminDashboard,
  CustomerDashboard,
  VendorDashboard,
} from "../types/dashboard";

type Envelope<T> = { data: T };

function authorization(accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

export async function getCustomerDashboard(accessToken: string) {
  const response = await apiClient.get<Envelope<CustomerDashboard>>(
    "/dashboards/customer",
    authorization(accessToken),
  );
  return response.data.data;
}

export async function getVendorDashboard(accessToken: string) {
  const response = await apiClient.get<Envelope<VendorDashboard>>(
    "/dashboards/vendor",
    authorization(accessToken),
  );
  return response.data.data;
}

export async function getAdminDashboard(accessToken: string) {
  const response = await apiClient.get<Envelope<AdminDashboard>>(
    "/dashboards/admin",
    authorization(accessToken),
  );
  return response.data.data;
}
