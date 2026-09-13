import type { Request, Response } from "express";

import { paymentService } from "../services/payment-service.js";
import { sendSuccess } from "../utils/http.js";

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

function query(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

export async function createBookingPayment(
  request: Request,
  response: Response,
) {
  const bookingId = param(request.params.bookingId);
  const payment = await paymentService.createBookingPayment(
    request.user!.id,
    {
      bookingId,
      ...request.body,
    },
    {
      ipAddress: request.ip,
      userAgent: request.get("user-agent"),
    },
  );

  sendSuccess(response, { payment }, 201);
}

export async function getPayment(request: Request, response: Response) {
  const payment = await paymentService.getPaymentDetails(
    request.user!.id,
    param(request.params.paymentId),
  );

  sendSuccess(response, { payment });
}

export async function listMyPayments(request: Request, response: Response) {
  const page = Number.parseInt(query(request.query.page as string)) || 1;
  const limit = Number.parseInt(query(request.query.limit as string)) || 20;

  const result = await paymentService.listMyPayments(
    request.user!.id,
    page,
    limit,
  );

  sendSuccess(response, result);
}

export async function listVendorPayments(request: Request, response: Response) {
  const page = Number.parseInt(query(request.query.page as string)) || 1;
  const limit = Number.parseInt(query(request.query.limit as string)) || 20;

  const result = await paymentService.listVendorPayments(
    request.user!.id,
    page,
    limit,
  );

  sendSuccess(response, result);
}
