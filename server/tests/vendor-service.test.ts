import type { Notification, Prisma, VendorDocument } from "@prisma/client";
import { describe, expect, it } from "vitest";

import type {
  AuditInput,
  VendorRepository,
  VendorProfileUpdateData,
  VendorProfileWithRelations,
} from "../src/repositories/vendor-repository.js";
import { VendorService } from "../src/services/vendor-service.js";

const now = new Date("2026-09-01T10:00:00.000Z");

function createVendor(
  overrides: Partial<VendorProfileWithRelations> = {},
): VendorProfileWithRelations {
  return {
    id: "10000000-0000-4000-8000-000000000001",
    userId: "20000000-0000-4000-8000-000000000001",
    businessName: "Acme Rentals",
    displayName: "Acme",
    businessEmail: "vendor@example.com",
    businessPhone: "+15555550100",
    taxIdentifier: null,
    description: null,
    websiteUrl: null,
    country: "US",
    city: "Chicago",
    addressLine1: "10 Market Street",
    addressLine2: null,
    lifecycleStage: "BUSINESS_PROFILE",
    verificationStatus: "NOT_SUBMITTED",
    status: "DRAFT",
    rejectionReason: null,
    submittedAt: null,
    approvedAt: null,
    rejectedAt: null,
    reviewedById: null,
    createdAt: now,
    updatedAt: now,
    user: {
      id: "20000000-0000-4000-8000-000000000001",
      email: "vendor@example.com",
      emailVerifiedAt: now,
      firstName: null,
      lastName: null,
      phoneNumber: null,
    },
    documents: [],
    reviewedBy: null,
    ...overrides,
  };
}

class FakeVendorRepository implements VendorRepository {
  vendors = new Map<string, VendorProfileWithRelations>();
  audits: AuditInput[] = [];
  notifications: Array<Partial<Notification>> = [];

  async findByUserId(userId: string) {
    return (
      [...this.vendors.values()].find((vendor) => vendor.userId === userId) ??
      null
    );
  }

  async findById(vendorId: string) {
    return this.vendors.get(vendorId) ?? null;
  }

  async findPending() {
    return [...this.vendors.values()].filter(
      (vendor) =>
        vendor.verificationStatus === "PENDING" &&
        vendor.status === "PENDING_VERIFICATION",
    );
  }

  async updateProfile(
    vendorId: string,
    data: VendorProfileUpdateData,
    audit?: AuditInput,
  ) {
    const vendor = this.vendors.get(vendorId)!;
    const updated = { ...vendor, ...data, updatedAt: now };
    this.vendors.set(vendorId, updated);
    if (audit) {
      this.audits.push(audit);
    }
    return updated;
  }

  async createDocument(
    vendorId: string,
    data: Prisma.VendorDocumentCreateWithoutVendorInput,
    audit?: AuditInput,
  ) {
    const document: VendorDocument = {
      id: `document-${vendorId}`,
      vendorId,
      documentType: data.documentType ?? "OTHER",
      reviewStatus: "SUBMITTED",
      fileName: data.fileName,
      storageKey: data.storageKey,
      url: data.url ?? null,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      visibility: "PRIVATE",
      metadata: null,
      submittedAt: now,
      reviewedAt: null,
      createdAt: now,
    };
    const vendor = this.vendors.get(vendorId)!;
    vendor.documents.push(document);
    if (audit) {
      this.audits.push(audit);
    }
    return document;
  }

  async transitionVendor(
    vendorId: string,
    data: VendorProfileUpdateData,
    audit: AuditInput,
    notification?: { userId: string; title: string; body: string },
  ) {
    const vendor = this.vendors.get(vendorId)!;
    const updated = { ...vendor, ...data, updatedAt: now };
    this.vendors.set(vendorId, updated);
    this.audits.push(audit);
    if (notification) {
      this.notifications.push(notification);
    }
    return updated;
  }

  async createAuditLog(input: AuditInput) {
    this.audits.push(input);
  }
}

describe("VendorService", () => {
  it("rejects verification submission until email is verified", async () => {
    const repository = new FakeVendorRepository();
    const vendor = createVendor({
      user: {
        ...createVendor().user,
        emailVerifiedAt: null,
      },
    });
    repository.vendors.set(vendor.id, vendor);
    const service = new VendorService(repository);

    await expect(
      service.submitMyVerification(vendor.userId, {}),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "EMAIL_VERIFICATION_REQUIRED",
    });
  });

  it("rejects incomplete profiles before admin review", async () => {
    const repository = new FakeVendorRepository();
    const vendor = createVendor({ city: null });
    repository.vendors.set(vendor.id, vendor);
    const service = new VendorService(repository);

    await expect(
      service.submitMyVerification(vendor.userId, {}),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "VENDOR_PROFILE_INCOMPLETE",
    });
  });

  it("submits complete profiles and records audit plus notification", async () => {
    const repository = new FakeVendorRepository();
    const vendor = createVendor();
    repository.vendors.set(vendor.id, vendor);
    const service = new VendorService(repository);

    const result = await service.submitMyVerification(vendor.userId, {});

    expect(result.verificationStatus).toBe("PENDING");
    expect(result.lifecycleStage).toBe("PENDING_VERIFICATION");
    expect(repository.audits[0]).toMatchObject({
      action: "STATUS_CHANGE",
      resourceType: "VendorProfile",
      resourceId: vendor.id,
    });
    expect(repository.notifications[0]).toMatchObject({
      userId: vendor.userId,
      title: "Verification submitted",
    });
  });

  it("prevents duplicate pending submissions", async () => {
    const repository = new FakeVendorRepository();
    const vendor = createVendor({
      verificationStatus: "PENDING",
      status: "PENDING_VERIFICATION",
    });
    repository.vendors.set(vendor.id, vendor);
    const service = new VendorService(repository);

    await expect(
      service.submitMyVerification(vendor.userId, {}),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "VENDOR_VERIFICATION_ALREADY_PENDING",
    });
  });

  it("allows admins to approve only pending vendors", async () => {
    const repository = new FakeVendorRepository();
    const vendor = createVendor({
      verificationStatus: "PENDING",
      status: "PENDING_VERIFICATION",
    });
    repository.vendors.set(vendor.id, vendor);
    const service = new VendorService(repository);

    const result = await service.approveVendor("admin-1", vendor.id, {});

    expect(result.verificationStatus).toBe("APPROVED");
    expect(result.status).toBe("APPROVED");
    expect(repository.audits[0]).toMatchObject({
      action: "APPROVE",
      actorUserId: "admin-1",
    });
    expect(repository.notifications[0]).toMatchObject({
      userId: vendor.userId,
      title: "Vendor verification approved",
    });
  });

  it("requires pending state for rejection and stores the reason", async () => {
    const repository = new FakeVendorRepository();
    const vendor = createVendor({
      verificationStatus: "PENDING",
      status: "PENDING_VERIFICATION",
    });
    repository.vendors.set(vendor.id, vendor);
    const service = new VendorService(repository);

    const result = await service.rejectVendor(
      "admin-1",
      vendor.id,
      "Business address could not be verified.",
      {},
    );

    expect(result.verificationStatus).toBe("REJECTED");
    expect(result.rejectionReason).toBe(
      "Business address could not be verified.",
    );
    expect(repository.audits[0]).toMatchObject({
      action: "REJECT",
      actorUserId: "admin-1",
    });
  });

  it("allows rejected vendors to resubmit after correction", async () => {
    const repository = new FakeVendorRepository();
    const vendor = createVendor({
      verificationStatus: "REJECTED",
      status: "REJECTED",
      lifecycleStage: "REJECTED",
      rejectionReason: "Missing address detail.",
      rejectedAt: now,
    });
    repository.vendors.set(vendor.id, vendor);
    const service = new VendorService(repository);

    const result = await service.submitMyVerification(vendor.userId, {});

    expect(result.verificationStatus).toBe("PENDING");
    expect(result.rejectionReason).toBeNull();
    expect(repository.audits[0].metadata).toMatchObject({
      event: "vendor_verification_resubmitted",
    });
  });

  it("treats vendor role as separate from verified vendor access", async () => {
    const repository = new FakeVendorRepository();
    const vendor = createVendor({
      verificationStatus: "NOT_SUBMITTED",
      status: "DRAFT",
    });
    repository.vendors.set(vendor.id, vendor);
    const service = new VendorService(repository);

    await expect(
      service.isVerifiedVendor({
        role: "VENDOR",
        vendorProfileId: vendor.id,
      })(),
    ).resolves.toBe(false);

    repository.vendors.set(
      vendor.id,
      createVendor({
        verificationStatus: "APPROVED",
        status: "APPROVED",
      }),
    );

    await expect(
      service.isVerifiedVendor({
        role: "VENDOR",
        vendorProfileId: vendor.id,
      })(),
    ).resolves.toBe(true);
  });
});
