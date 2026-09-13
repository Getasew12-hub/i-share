import type { Request, Response } from "express";

import { bookingService } from "../services/booking-service.js";
import { sendSuccess } from "../utils/http.js";

function requestContext(request: Request) {
  return {
    ipAddress: request.ip,
    userAgent: request.get("user-agent"),
  };
}

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

export async function createMyBooking(request: Request, response: Response) {
  const booking = await bookingService.createMyBooking(
    request.user!.id,
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { booking }, 201);
}

export async function listMyBookings(request: Request, response: Response) {
  const bookings = await bookingService.listMyBookings(request.user!.id);

  sendSuccess(response, { bookings });
}

export async function getMyBooking(request: Request, response: Response) {
  const booking = await bookingService.getMyBooking(
    request.user!.id,
    param(request.params.bookingId),
  );

  sendSuccess(response, { booking });
}

export async function cancelMyBooking(request: Request, response: Response) {
  const booking = await bookingService.cancelMyBooking(
    request.user!.id,
    param(request.params.bookingId),
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { booking });
}

export async function listVendorBookings(request: Request, response: Response) {
  const bookings = await bookingService.listVendorBookings(request.user!.id);

  sendSuccess(response, { bookings });
}

export async function getVendorBooking(request: Request, response: Response) {
  const booking = await bookingService.getVendorBooking(
    request.user!.id,
    param(request.params.bookingId),
  );

  sendSuccess(response, { booking });
}

export async function confirmVendorBooking(
  request: Request,
  response: Response,
) {
  const booking = await bookingService.confirmVendorBooking(
    request.user!.id,
    param(request.params.bookingId),
    requestContext(request),
  );

  sendSuccess(response, { booking });
}

export async function rejectVendorBooking(
  request: Request,
  response: Response,
) {
  const booking = await bookingService.rejectVendorBooking(
    request.user!.id,
    param(request.params.bookingId),
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { booking });
}

export async function cancelVendorBooking(
  request: Request,
  response: Response,
) {
  const booking = await bookingService.cancelVendorBooking(
    request.user!.id,
    param(request.params.bookingId),
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { booking });
}

export async function startVendorRental(request: Request, response: Response) {
  const booking = await bookingService.startVendorRental(
    request.user!.id,
    param(request.params.bookingId),
    requestContext(request),
  );

  sendSuccess(response, { booking });
}

export async function completeVendorRental(
  request: Request,
  response: Response,
) {
  const booking = await bookingService.completeVendorRental(
    request.user!.id,
    param(request.params.bookingId),
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { booking });
}
