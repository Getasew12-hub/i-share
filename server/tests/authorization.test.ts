import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import {
  requireCustomerOwner,
  requireRoles,
  requireVendorOwner,
  requireVerifiedVendor,
} from "../src/middleware/authorization.js";

function response() {
  return {} as Response;
}

describe("authorization middleware", () => {
  it("allows only configured roles", () => {
    const next = vi.fn();
    const request = {
      user: {
        id: "user-1",
        email: "vendor@example.com",
        role: "VENDOR",
        status: "ACTIVE",
      },
    } as Request;

    requireRoles("VENDOR")(request, response(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("denies mismatched roles", () => {
    const next = vi.fn();
    const request = {
      user: {
        id: "user-1",
        email: "customer@example.com",
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    } as Request;

    requireRoles("ADMIN")(request, response(), next);

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("denies customers access to vendor-only verification routes", () => {
    const next = vi.fn();
    const request = {
      user: {
        id: "user-1",
        email: "customer@example.com",
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    } as Request;

    requireRoles("VENDOR")(request, response(), next);

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("denies customers access to vendor-only subscription routes", () => {
    const next = vi.fn();
    const request = {
      user: {
        id: "user-1",
        email: "customer@example.com",
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    } as Request;

    requireRoles("VENDOR")(request, response(), next);

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("denies customers access to vendor-only product routes", () => {
    const next = vi.fn();
    const request = {
      user: {
        id: "user-1",
        email: "customer@example.com",
        role: "CUSTOMER",
        status: "ACTIVE",
      },
    } as Request;

    requireRoles("VENDOR")(request, response(), next);

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("denies vendors access to admin verification routes", () => {
    const next = vi.fn();
    const request = {
      user: {
        id: "user-1",
        email: "vendor@example.com",
        role: "VENDOR",
        status: "ACTIVE",
      },
    } as Request;

    requireRoles("ADMIN")(request, response(), next);

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("enforces vendor ownership while allowing admins", () => {
    const vendorNext = vi.fn();
    const adminNext = vi.fn();

    requireVendorOwner(() => "vendor-1")(
      {
        user: {
          id: "user-1",
          email: "vendor@example.com",
          role: "VENDOR",
          status: "ACTIVE",
          vendorProfileId: "vendor-1",
        },
      } as Request,
      response(),
      vendorNext,
    );
    requireVendorOwner(() => "vendor-2")(
      {
        user: {
          id: "admin-1",
          email: "admin@example.com",
          role: "ADMIN",
          status: "ACTIVE",
        },
      } as Request,
      response(),
      adminNext,
    );

    expect(vendorNext).toHaveBeenCalledWith();
    expect(adminNext).toHaveBeenCalledWith();
  });

  it("prevents vendors from accessing another vendor profile", () => {
    const next = vi.fn();

    requireVendorOwner(() => "vendor-2")(
      {
        user: {
          id: "user-1",
          email: "vendor@example.com",
          role: "VENDOR",
          status: "ACTIVE",
          vendorProfileId: "vendor-1",
        },
      } as Request,
      response(),
      next,
    );

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("enforces customer ownership", () => {
    const next = vi.fn();

    requireCustomerOwner(() => "customer-2")(
      {
        user: {
          id: "user-1",
          email: "customer@example.com",
          role: "CUSTOMER",
          status: "ACTIVE",
          customerProfileId: "customer-1",
        },
      } as Request,
      response(),
      next,
    );

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("denies verified-vendor middleware to customers", async () => {
    const next = vi.fn();

    await requireVerifiedVendor(
      {
        user: {
          id: "user-1",
          email: "customer@example.com",
          role: "CUSTOMER",
          status: "ACTIVE",
          customerProfileId: "customer-1",
        },
      } as Request,
      response(),
      next,
    );

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });
});
