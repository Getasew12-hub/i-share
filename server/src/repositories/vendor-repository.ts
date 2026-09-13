import type {
  AuditAction,
  Prisma,
  VendorDocument,
  VendorProfile,
} from "@prisma/client";

import { prisma } from "../config/prisma.js";

export type VendorProfileWithRelations = VendorProfile & {
  user: {
    id: string;
    email: string;
    emailVerifiedAt: Date | null;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: string | null;
  };
  documents: VendorDocument[];
  reviewedBy: {
    id: string;
    email: string;
  } | null;
};

const vendorProfileInclude = {
  user: {
    select: {
      id: true,
      email: true,
      emailVerifiedAt: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
    },
  },
  documents: {
    orderBy: {
      submittedAt: "desc",
    },
  },
  reviewedBy: {
    select: {
      id: true,
      email: true,
    },
  },
} satisfies Prisma.VendorProfileInclude;

export type AuditInput = {
  actorUserId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

export type VendorProfileUpdateData = Partial<
  Pick<
    VendorProfile,
    | "displayName"
    | "businessName"
    | "businessEmail"
    | "businessPhone"
    | "taxIdentifier"
    | "description"
    | "websiteUrl"
    | "country"
    | "city"
    | "addressLine1"
    | "addressLine2"
    | "lifecycleStage"
    | "verificationStatus"
    | "status"
    | "rejectionReason"
    | "submittedAt"
    | "approvedAt"
    | "rejectedAt"
    | "reviewedById"
  >
>;

export type VendorRepository = {
  findByUserId(userId: string): Promise<VendorProfileWithRelations | null>;
  findById(vendorId: string): Promise<VendorProfileWithRelations | null>;
  findPending(): Promise<VendorProfileWithRelations[]>;
  updateProfile(
    vendorId: string,
    data: VendorProfileUpdateData,
    audit?: AuditInput,
  ): Promise<VendorProfileWithRelations>;
  createDocument(
    vendorId: string,
    data: Prisma.VendorDocumentCreateWithoutVendorInput,
    audit?: AuditInput,
  ): Promise<VendorDocument>;
  transitionVendor(
    vendorId: string,
    data: VendorProfileUpdateData,
    audit: AuditInput,
    notification?: {
      userId: string;
      title: string;
      body: string;
      payload?: Prisma.InputJsonValue;
    },
  ): Promise<VendorProfileWithRelations>;
  createAuditLog(input: AuditInput): Promise<void>;
};

function createAudit(tx: Prisma.TransactionClient, input?: AuditInput) {
  if (!input) {
    return Promise.resolve();
  }

  return tx.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

export const prismaVendorRepository: VendorRepository = {
  findByUserId(userId) {
    return prisma.vendorProfile.findUnique({
      where: { userId },
      include: vendorProfileInclude,
    });
  },

  findById(vendorId) {
    return prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: vendorProfileInclude,
    });
  },

  findPending() {
    return prisma.vendorProfile.findMany({
      where: {
        verificationStatus: "PENDING",
        status: "PENDING_VERIFICATION",
      },
      include: vendorProfileInclude,
      orderBy: {
        submittedAt: "asc",
      },
    });
  },

  async updateProfile(vendorId, data, audit) {
    return prisma.$transaction(async (tx) => {
      const profile = await tx.vendorProfile.update({
        where: { id: vendorId },
        data,
        include: vendorProfileInclude,
      });

      await createAudit(tx, audit);

      return profile;
    });
  },

  async createDocument(vendorId, data, audit) {
    return prisma.$transaction(async (tx) => {
      const document = await tx.vendorDocument.create({
        data: {
          ...data,
          vendor: {
            connect: {
              id: vendorId,
            },
          },
        },
      });

      await createAudit(tx, audit);

      return document;
    });
  },

  async transitionVendor(vendorId, data, audit, notification) {
    return prisma.$transaction(async (tx) => {
      const profile = await tx.vendorProfile.update({
        where: { id: vendorId },
        data,
        include: vendorProfileInclude,
      });

      await createAudit(tx, audit);

      if (notification) {
        await tx.notification.create({
          data: {
            userId: notification.userId,
            type: "ACCOUNT_VERIFICATION",
            title: notification.title,
            body: notification.body,
            payload: notification.payload,
          },
        });
      }

      return profile;
    });
  },

  async createAuditLog(input) {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        metadata: input.metadata,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  },
};
