import { apiClient } from "./api-client";
import type { AuthResponse, AuthUser } from "../types/auth";

type Envelope<T> = {
  data: T;
};

type CustomerRegistrationPayload = {
  email: string;
  password: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
};

type VendorRegistrationPayload = CustomerRegistrationPayload & {
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
};

export async function registerCustomer(payload: CustomerRegistrationPayload) {
  const response = await apiClient.post<Envelope<AuthResponse>>(
    "/auth/register/customer",
    payload,
  );

  return response.data.data;
}

export async function registerVendor(payload: VendorRegistrationPayload) {
  const response = await apiClient.post<Envelope<AuthResponse>>(
    "/auth/register/vendor",
    payload,
  );

  return response.data.data;
}

export async function login(payload: { email: string; password: string }) {
  const response = await apiClient.post<Envelope<AuthResponse>>(
    "/auth/login",
    payload,
  );

  return response.data.data;
}

export async function refreshSession() {
  const response =
    await apiClient.post<Envelope<AuthResponse>>("/auth/refresh");

  return response.data.data;
}

export async function logout() {
  await apiClient.post("/auth/logout");
}

export async function getCurrentUser(accessToken: string) {
  const response = await apiClient.get<Envelope<{ user: AuthUser }>>(
    "/auth/me",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return response.data.data.user;
}
