import type { Prisma, VendorProfile } from "@prisma/client";

import { AppError } from "../errors/app-error.js";
import type {
  VendorRepository,
  VendorProfileWithRelations,
} from "../repositories/vendor-repository.js";
import { prismaVendorRepository } from "../repositories/vendor-repository.js";
import type {
  VendorDocumentMetadataInput,
  VendorProfileUpdateInput,
} from "../schemas/vendor-schemas.js";

type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

const requiredProfileFields: Array<keyof VendorProfile> = [
  "displayName",
  "businessName",
  "businessEmail",
  "businessPhone",
  "country",
  "city",
  "addressLine1",
];

export class VendorService {
  constructor(private readonly vendorRepository: VendorRepository) {}

  async getMyVerification(userId: string) {
    const vendor = await this.getVendorForUser(userId);

    return this.toVendorResponse(vendor);
  }

  async updateMyProfile(
    userId: string,
    input: VendorProfileUpdateInput,
    context: RequestContext,
  ) {
    const vendor = await this.getVendorForUser(userId);

    if (vendor.verificationStatus === "APPROVED") {
      throw new AppError(
        409,
        "VENDOR_ALREADY_APPROVED",
        "Approved vendor profiles cannot be changed in this workflow.",
      );
    }

    const draft = {
      ...vendor,
      ...input,
    };
    const profileIsComplete = this.isProfileComplete(draft);
    const nextLifecycleStage = profileIsComplete
      ? "BUSINESS_PROFILE"
      : vendor.user.emailVerifiedAt
        ? "BUSINESS_PROFILE"
        : "EMAIL_VERIFICATION";

    const updated = await this.vendorRepository.updateProfile(
      vendor.id,
      {
        ...input,
        lifecycleStage: nextLifecycleStage,
        status: vendor.status === "REJECTED" ? "REJECTED" : vendor.status,
      },
      {
        actorUserId: userId,
        action: "UPDATE",
        resourceType: "VendorProfile",
        resourceId: vendor.id,
        metadata: {
          profileIsComplete,
        },
        ...context,
      },
    );

    return this.toVendorResponse(updated);
  }

  async addMyDocument(
    userId: string,
    input: VendorDocumentMetadataInput,
    context: RequestContext,
  ) {
    const vendor = await this.getVendorForUser(userId);

    if (vendor.verificationStatus === "APPROVED") {
      throw new AppError(
        409,
        "VENDOR_ALREADY_APPROVED",
        "Approved vendors cannot add verification documents in this workflow.",
      );
    }

    const document = await this.vendorRepository.createDocument(
      vendor.id,
      {
        documentType: input.documentType,
        fileName: input.fileName,
        storageKey: input.storageKey,
        url: input.url,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
      {
        actorUserId: userId,
        action: "CREATE",
        resourceType: "VendorDocument",
        resourceId: vendor.id,
        metadata: {
          documentType: input.documentType,
          fileName: input.fileName,
        },
        ...context,
      },
    );

    return document;
  }

  async submitMyVerification(userId: string, context: RequestContext) {
    const vendor = await this.getVendorForUser(userId);

    if (!vendor.user.emailVerifiedAt) {
      throw new AppError(
        409,
        "EMAIL_VERIFICATION_REQUIRED",
        "Email verification is required before vendor verification submission.",
      );
    }

    if (!this.isProfileComplete(vendor)) {
      throw new AppError(
        409,
        "VENDOR_PROFILE_INCOMPLETE",
        "Complete the required business profile fields before submission.",
      );
    }

    if (vendor.verificationStatus === "PENDING") {
      throw new AppError(
        409,
        "VENDOR_VERIFICATION_ALREADY_PENDING",
        "Vendor verification is already pending review.",
      );
    }

    if (vendor.verificationStatus === "APPROVED") {
      throw new AppError(
        409,
        "VENDOR_ALREADY_APPROVED",
        "Approved vendors cannot resubmit verification.",
      );
    }

    const isResubmission = vendor.verificationStatus === "REJECTED";
    const submitted = await this.vendorRepository.transitionVendor(
      vendor.id,
      {
        verificationStatus: "PENDING",
        lifecycleStage: "PENDING_VERIFICATION",
        status: "PENDING_VERIFICATION",
        submittedAt: new Date(),
        reviewedById: null,
        rejectedAt: null,
        approvedAt: null,
        rejectionReason: null,
      },
      {
        actorUserId: userId,
        action: "STATUS_CHANGE",
        resourceType: "VendorProfile",
        resourceId: vendor.id,
        metadata: {
          from: vendor.verificationStatus,
          to: "PENDING",
          event: isResubmission
            ? "vendor_verification_resubmitted"
            : "vendor_verification_submitted",
        },
        ...context,
      },
      {
        userId,
        title: isResubmission
          ? "Verification resubmitted"
          : "Verification submitted",
        body: "Your vendor verification is pending administrator review.",
        payload: {
          vendorId: vendor.id,
          verificationStatus: "PENDING",
        },
      },
    );

    return this.toVendorResponse(submitted);
  }

  async listPendingVendors(actorUserId: string, context: RequestContext) {
    const vendors = await this.vendorRepository.findPending();

    await this.vendorRepository.createAuditLog({
      actorUserId,
      action: "SYSTEM",
      resourceType: "VendorProfile",
      metadata: {
        event: "admin_viewed_vendor_verification_queue",
        count: vendors.length,
      },
      ...context,
    });

    return vendors.map((vendor) => this.toVendorResponse(vendor));
  }

  async getVendorForAdmin(
    actorUserId: string,
    vendorId: string,
    context: RequestContext,
  ) {
    const vendor = await this.findVendorOrThrow(vendorId);

    await this.vendorRepository.createAuditLog({
      actorUserId,
      action: "SYSTEM",
      resourceType: "VendorProfile",
      resourceId: vendor.id,
      metadata: {
        event: "admin_viewed_vendor_verification",
      },
      ...context,
    });

    return this.toVendorResponse(vendor);
  }

  async approveVendor(
    actorUserId: string,
    vendorId: string,
    context: RequestContext,
  ) {
    const vendor = await this.findVendorOrThrow(vendorId);

    if (vendor.verificationStatus !== "PENDING") {
      throw new AppError(
        409,
        "INVALID_VENDOR_VERIFICATION_STATE",
        "Only pending vendors can be approved.",
      );
    }

    const approved = await this.vendorRepository.transitionVendor(
      vendor.id,
      {
        verificationStatus: "APPROVED",
        lifecycleStage: "APPROVED",
        status: "APPROVED",
        approvedAt: new Date(),
        reviewedById: actorUserId,
        rejectedAt: null,
        rejectionReason: null,
      },
      {
        actorUserId,
        action: "APPROVE",
        resourceType: "VendorProfile",
        resourceId: vendor.id,
        metadata: {
          from: vendor.verificationStatus,
          to: "APPROVED",
          event: "vendor_verification_approved",
        },
        ...context,
      },
      {
        userId: vendor.userId,
        title: "Vendor verification approved",
        body: "Your vendor account is approved for vendor functionality.",
        payload: {
          vendorId: vendor.id,
          verificationStatus: "APPROVED",
        },
      },
    );

    return this.toVendorResponse(approved);
  }

  async rejectVendor(
    actorUserId: string,
    vendorId: string,
    reason: string,
    context: RequestContext,
  ) {
    const vendor = await this.findVendorOrThrow(vendorId);

    if (vendor.verificationStatus !== "PENDING") {
      throw new AppError(
        409,
        "INVALID_VENDOR_VERIFICATION_STATE",
        "Only pending vendors can be rejected.",
      );
    }

    const rejected = await this.vendorRepository.transitionVendor(
      vendor.id,
      {
        verificationStatus: "REJECTED",
        lifecycleStage: "REJECTED",
        status: "REJECTED",
        rejectedAt: new Date(),
        reviewedById: actorUserId,
        rejectionReason: reason,
      },
      {
        actorUserId,
        action: "REJECT",
        resourceType: "VendorProfile",
        resourceId: vendor.id,
        metadata: {
          from: vendor.verificationStatus,
          to: "REJECTED",
          event: "vendor_verification_rejected",
        },
        ...context,
      },
      {
        userId: vendor.userId,
        title: "Vendor verification rejected",
        body: reason,
        payload: {
          vendorId: vendor.id,
          verificationStatus: "REJECTED",
        },
      },
    );

    return this.toVendorResponse(rejected);
  }

  isVerifiedVendor(user: { role: string; vendorProfileId?: string }) {
    return async () => {
      if (user.role !== "VENDOR" || !user.vendorProfileId) {
        return false;
      }

      const vendor = await this.vendorRepository.findById(user.vendorProfileId);

      return (
        vendor?.verificationStatus === "APPROVED" &&
        vendor.status === "APPROVED"
      );
    };
  }

  private async getVendorForUser(userId: string) {
    const vendor = await this.vendorRepository.findByUserId(userId);

    if (!vendor) {
      throw new AppError(
        404,
        "VENDOR_PROFILE_NOT_FOUND",
        "Vendor profile not found.",
      );
    }

    return vendor;
  }

  private async findVendorOrThrow(vendorId: string) {
    const vendor = await this.vendorRepository.findById(vendorId);

    if (!vendor) {
      throw new AppError(
        404,
        "VENDOR_PROFILE_NOT_FOUND",
        "Vendor profile not found.",
      );
    }

    return vendor;
  }

  private isProfileComplete(
    vendor: Pick<VendorProfile, (typeof requiredProfileFields)[number]>,
  ) {
    return requiredProfileFields.every((field) => {
      const value = vendor[field];

      return typeof value === "string" && value.trim().length > 0;
    });
  }

  private toVendorResponse(vendor: VendorProfileWithRelations) {
    return {
      id: vendor.id,
      userId: vendor.userId,
      businessName: vendor.businessName,
      displayName: vendor.displayName,
      businessEmail: vendor.businessEmail,
      businessPhone: vendor.businessPhone,
      taxIdentifier: vendor.taxIdentifier,
      description: vendor.description,
      websiteUrl: vendor.websiteUrl,
      country: vendor.country,
      city: vendor.city,
      addressLine1: vendor.addressLine1,
      addressLine2: vendor.addressLine2,
      lifecycleStage: vendor.lifecycleStage,
      verificationStatus: vendor.verificationStatus,
      status: vendor.status,
      rejectionReason: vendor.rejectionReason,
      submittedAt: vendor.submittedAt?.toISOString() ?? null,
      approvedAt: vendor.approvedAt?.toISOString() ?? null,
      rejectedAt: vendor.rejectedAt?.toISOString() ?? null,
      reviewedById: vendor.reviewedById,
      emailVerifiedAt: vendor.user.emailVerifiedAt?.toISOString() ?? null,
      profileComplete: this.isProfileComplete(vendor),
      documents: vendor.documents.map((document) => ({
        id: document.id,
        documentType: document.documentType,
        reviewStatus: document.reviewStatus,
        fileName: document.fileName,
        storageKey: document.storageKey,
        url: document.url,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        submittedAt: document.submittedAt.toISOString(),
        reviewedAt: document.reviewedAt?.toISOString() ?? null,
      })),
      reviewedBy: vendor.reviewedBy,
      createdAt: vendor.createdAt.toISOString(),
      updatedAt: vendor.updatedAt.toISOString(),
    };
  }
}

export const vendorService = new VendorService(prismaVendorRepository);
