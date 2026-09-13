import type { Request, Response } from "express";

import { invoiceService } from "../services/invoice-service.js";
import { sendSuccess } from "../utils/http.js";

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

function query(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

export async function getInvoice(request: Request, response: Response) {
  const invoice = await invoiceService.getInvoiceDetails(
    request.user!.id,
    param(request.params.invoiceId),
  );

  sendSuccess(response, { invoice });
}

export async function listMyInvoices(request: Request, response: Response) {
  const page = Number.parseInt(query(request.query.page as string)) || 1;
  const limit = Number.parseInt(query(request.query.limit as string)) || 20;

  const result = await invoiceService.listMyInvoices(
    request.user!.id,
    page,
    limit,
  );

  sendSuccess(response, result);
}

export async function listVendorInvoices(request: Request, response: Response) {
  const page = Number.parseInt(query(request.query.page as string)) || 1;
  const limit = Number.parseInt(query(request.query.limit as string)) || 20;

  const result = await invoiceService.listVendorInvoices(
    request.user!.id,
    page,
    limit,
  );

  sendSuccess(response, result);
}
