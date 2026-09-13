import type { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/app-error.js";
import { vendorService } from "../services/vendor-service.js";

export function requireRoles(...allowedRoles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) {
      next(new AppError(401, "UNAUTHENTICATED", "Authentication required."));
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      next(new AppError(403, "FORBIDDEN", "Insufficient permissions."));
      return;
    }

    next();
  };
}

export function requireVendorOwner(
  getVendorProfileId: (request: Request) => string,
) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) {
      next(new AppError(401, "UNAUTHENTICATED", "Authentication required."));
      return;
    }

    if (request.user.role === "ADMIN") {
      next();
      return;
    }

    if (
      request.user.role !== "VENDOR" ||
      request.user.vendorProfileId !== getVendorProfileId(request)
    ) {
      next(new AppError(403, "FORBIDDEN", "Resource access denied."));
      return;
    }

    next();
  };
}

export function requireCustomerOwner(
  getCustomerProfileId: (request: Request) => string,
) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) {
      next(new AppError(401, "UNAUTHENTICATED", "Authentication required."));
      return;
    }

    if (request.user.role === "ADMIN") {
      next();
      return;
    }

    if (
      request.user.role !== "CUSTOMER" ||
      request.user.customerProfileId !== getCustomerProfileId(request)
    ) {
      next(new AppError(403, "FORBIDDEN", "Resource access denied."));
      return;
    }

    next();
  };
}

export async function requireVerifiedVendor(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    if (!request.user) {
      throw new AppError(401, "UNAUTHENTICATED", "Authentication required.");
    }

    if (request.user.role !== "VENDOR" || !request.user.vendorProfileId) {
      throw new AppError(403, "FORBIDDEN", "Verified vendor access required.");
    }

    const isVerified = await vendorService.isVerifiedVendor(request.user)();

    if (!isVerified) {
      throw new AppError(
        403,
        "VENDOR_VERIFICATION_REQUIRED",
        "Approved vendor verification is required.",
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}
