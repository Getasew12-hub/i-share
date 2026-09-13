import { apiClient } from "./api-client";
import type {
  VendorDocument,
  VendorDocumentPayload,
  VendorProfile,
  VendorProfilePayload,
} from "../types/vendor";

type Envelope<T> = {
  data: T;
};

function authorization(accessToken: string) {
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

export async function getMyVendorVerification(accessToken: string) {
  const response = await apiClient.get<Envelope<{ vendor: VendorProfile }>>(
    "/vendors/me/verification",
    authorization(accessToken),
  );

  return response.data.data.vendor;
}

export async function updateMyVendorProfile(
  accessToken: string,
  payload: VendorProfilePayload,
) {
  const response = await apiClient.put<Envelope<{ vendor: VendorProfile }>>(
    "/vendors/me/profile",
    payload,
    authorization(accessToken),
  );

  return response.data.data.vendor;
}

export async function addMyVendorDocument(
  accessToken: string,
  payload: VendorDocumentPayload,
) {
  const response = await apiClient.post<Envelope<{ document: VendorDocument }>>(
    "/vendors/me/documents",
    payload,
    authorization(accessToken),
  );

  return response.data.data.document;
}

export async function submitMyVendorVerification(accessToken: string) {
  const response = await apiClient.post<Envelope<{ vendor: VendorProfile }>>(
    "/vendors/me/verification/submit",
    undefined,
    authorization(accessToken),
  );

  return response.data.data.vendor;
}

export async function listPendingVendors(accessToken: string) {
  const response = await apiClient.get<Envelope<{ vendors: VendorProfile[] }>>(
    "/admin/vendors/pending",
    authorization(accessToken),
  );

  return response.data.data.vendors;
}

export async function approveVendor(accessToken: string, vendorId: string) {
  const response = await apiClient.post<Envelope<{ vendor: VendorProfile }>>(
    `/admin/vendors/${vendorId}/approve`,
    undefined,
    authorization(accessToken),
  );

  return response.data.data.vendor;
}

export async function rejectVendor(
  accessToken: string,
  vendorId: string,
  reason: string,
) {
  const response = await apiClient.post<Envelope<{ vendor: VendorProfile }>>(
    `/admin/vendors/${vendorId}/reject`,
    { reason },
    authorization(accessToken),
  );

  return response.data.data.vendor;
}
