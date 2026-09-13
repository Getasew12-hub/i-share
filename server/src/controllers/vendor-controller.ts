import type { Request, Response } from "express";

import { vendorService } from "../services/vendor-service.js";
import { sendSuccess } from "../utils/http.js";

function requestContext(request: Request) {
  return {
    ipAddress: request.ip,
    userAgent: request.get("user-agent"),
  };
}

function vendorIdParam(request: Request) {
  return request.params.vendorId as string;
}

export async function getMyVendorVerification(
  request: Request,
  response: Response,
) {
  const vendor = await vendorService.getMyVerification(request.user!.id);

  sendSuccess(response, { vendor });
}

export async function updateMyVendorProfile(
  request: Request,
  response: Response,
) {
  const vendor = await vendorService.updateMyProfile(
    request.user!.id,
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { vendor });
}

export async function createMyVendorDocument(
  request: Request,
  response: Response,
) {
  const document = await vendorService.addMyDocument(
    request.user!.id,
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { document }, 201);
}

export async function submitMyVendorVerification(
  request: Request,
  response: Response,
) {
  const vendor = await vendorService.submitMyVerification(
    request.user!.id,
    requestContext(request),
  );

  sendSuccess(response, { vendor });
}

export async function listPendingVendors(request: Request, response: Response) {
  const vendors = await vendorService.listPendingVendors(
    request.user!.id,
    requestContext(request),
  );

  sendSuccess(response, { vendors });
}

export async function getVendorReview(request: Request, response: Response) {
  const vendor = await vendorService.getVendorForAdmin(
    request.user!.id,
    vendorIdParam(request),
    requestContext(request),
  );

  sendSuccess(response, { vendor });
}

export async function approveVendor(request: Request, response: Response) {
  const vendor = await vendorService.approveVendor(
    request.user!.id,
    vendorIdParam(request),
    requestContext(request),
  );

  sendSuccess(response, { vendor });
}

export async function rejectVendor(request: Request, response: Response) {
  const vendor = await vendorService.rejectVendor(
    request.user!.id,
    vendorIdParam(request),
    request.body.reason,
    requestContext(request),
  );

  sendSuccess(response, { vendor });
}
