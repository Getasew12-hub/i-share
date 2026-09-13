import { apiClient } from "./api-client";
import type {
  Booking,
  CompleteRentalPayload,
  CreateBookingPayload,
} from "../types/booking";

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

export async function createMyBooking(
  accessToken: string,
  payload: CreateBookingPayload,
) {
  const response = await apiClient.post<Envelope<{ booking: Booking }>>(
    "/bookings/me",
    payload,
    authorization(accessToken),
  );

  return response.data.data.booking;
}

export async function listMyBookings(accessToken: string) {
  const response = await apiClient.get<Envelope<{ bookings: Booking[] }>>(
    "/bookings/me",
    authorization(accessToken),
  );

  return response.data.data.bookings;
}

export async function getMyBooking(accessToken: string, bookingId: string) {
  const response = await apiClient.get<Envelope<{ booking: Booking }>>(
    `/bookings/me/${bookingId}`,
    authorization(accessToken),
  );

  return response.data.data.booking;
}

export async function cancelMyBooking(
  accessToken: string,
  bookingId: string,
  reason?: string,
) {
  const response = await apiClient.post<Envelope<{ booking: Booking }>>(
    `/bookings/me/${bookingId}/cancel`,
    { reason },
    authorization(accessToken),
  );

  return response.data.data.booking;
}

export async function listVendorBookings(accessToken: string) {
  const response = await apiClient.get<Envelope<{ bookings: Booking[] }>>(
    "/bookings/vendor",
    authorization(accessToken),
  );

  return response.data.data.bookings;
}

export async function getVendorBooking(accessToken: string, bookingId: string) {
  const response = await apiClient.get<Envelope<{ booking: Booking }>>(
    `/bookings/vendor/${bookingId}`,
    authorization(accessToken),
  );

  return response.data.data.booking;
}

export async function confirmVendorBooking(
  accessToken: string,
  bookingId: string,
) {
  const response = await apiClient.post<Envelope<{ booking: Booking }>>(
    `/bookings/vendor/${bookingId}/confirm`,
    {},
    authorization(accessToken),
  );

  return response.data.data.booking;
}

export async function rejectVendorBooking(
  accessToken: string,
  bookingId: string,
  reason: string,
) {
  const response = await apiClient.post<Envelope<{ booking: Booking }>>(
    `/bookings/vendor/${bookingId}/reject`,
    { reason },
    authorization(accessToken),
  );

  return response.data.data.booking;
}

export async function cancelVendorBooking(
  accessToken: string,
  bookingId: string,
  reason?: string,
) {
  const response = await apiClient.post<Envelope<{ booking: Booking }>>(
    `/bookings/vendor/${bookingId}/cancel`,
    { reason },
    authorization(accessToken),
  );

  return response.data.data.booking;
}

export async function startVendorRental(
  accessToken: string,
  bookingId: string,
) {
  const response = await apiClient.post<Envelope<{ booking: Booking }>>(
    `/bookings/vendor/${bookingId}/rental/start`,
    {},
    authorization(accessToken),
  );

  return response.data.data.booking;
}

export async function completeVendorRental(
  accessToken: string,
  bookingId: string,
  payload: CompleteRentalPayload,
) {
  const response = await apiClient.post<Envelope<{ booking: Booking }>>(
    `/bookings/vendor/${bookingId}/rental/complete`,
    payload,
    authorization(accessToken),
  );

  return response.data.data.booking;
}
