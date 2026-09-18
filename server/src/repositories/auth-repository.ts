import type {
  EmailVerificationToken,
  Prisma,
  RefreshSession,
  User,
} from "@prisma/client";

import { prisma } from "../config/prisma.js";

export type SafeUser = Omit<User, "passwordHash"> & {
  vendorProfile?: { id: string; displayName?: string } | null;
  customerProfile?: { id: string; displayName?: string } | null;
};

export type UserWithCredentials = User & {
  vendorProfile?: { id: string; displayName?: string } | null;
  customerProfile?: { id: string; displayName?: string } | null;
};

const safeUserSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  vendorProfile: {
    select: {
      id: true,
      displayName: true,
    },
  },
  customerProfile: {
    select: {
      id: true,
      displayName: true,
    },
  },
} satisfies Prisma.UserSelect;

export type AuthRepository = {
  createCustomer(input: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    displayName: string;
  }): Promise<SafeUser>;
  createVendor(input: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    displayName: string;
    businessName?: string;
    businessEmail?: string;
    businessPhone?: string;
  }): Promise<SafeUser>;
  findUserByEmail(email: string): Promise<UserWithCredentials | null>;
  findSafeUserById(id: string): Promise<SafeUser | null>;
  updateLastLoginAt(userId: string, loggedInAt: Date): Promise<void>;
  createRefreshSession(input: {
    userId: string;
    tokenHash: string;
    familyId: string;
    rotatedFromId?: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<RefreshSession>;
  findRefreshSessionByTokenHash(
    tokenHash: string,
  ): Promise<RefreshSession | null>;
  revokeRefreshSession(
    id: string,
    revokedAt: Date,
    revokedReason: string,
  ): Promise<void>;
  revokeRefreshFamily(
    familyId: string,
    revokedAt: Date,
    revokedReason: string,
  ): Promise<void>;
  markRefreshSessionUsed(id: string, usedAt: Date): Promise<void>;
  createEmailVerificationToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<EmailVerificationToken>;
  findEmailVerificationTokenByHash(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null>;
  markEmailVerified(
    userId: string,
    tokenId: string,
    verifiedAt: Date,
  ): Promise<void>;
};

export const prismaAuthRepository: AuthRepository = {
  async createCustomer(input) {
    return prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        role: "CUSTOMER",
        firstName: input.firstName,
        lastName: input.lastName,
        phoneNumber: input.phoneNumber,
        customerProfile: {
          create: {
            displayName: input.displayName,
            phoneNumber: input.phoneNumber,
          },
        },
      },
      select: safeUserSelect,
    });
  },

  async createVendor(input) {
    return prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        role: "VENDOR",
        firstName: input.firstName,
        lastName: input.lastName,
        phoneNumber: input.phoneNumber,
        vendorProfile: {
          create: {
            displayName: input.displayName,
            businessName: input.businessName,
            businessEmail: input.businessEmail ?? input.email,
            businessPhone: input.businessPhone ?? input.phoneNumber,
            lifecycleStage: "EMAIL_VERIFICATION",
          },
        },
      },
      select: safeUserSelect,
    });
  },

  async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        vendorProfile: {
          select: {
            id: true,
            displayName: true,
          },
        },
        customerProfile: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });
  },

  async findSafeUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
  },

  async updateLastLoginAt(userId, loggedInAt) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: loggedInAt,
      },
    });
  },

  async createRefreshSession(input) {
    return prisma.refreshSession.create({
      data: input,
    });
  },

  async findRefreshSessionByTokenHash(tokenHash) {
    return prisma.refreshSession.findUnique({
      where: { tokenHash },
    });
  },

  async revokeRefreshSession(id, revokedAt, revokedReason) {
    await prisma.refreshSession.update({
      where: { id },
      data: {
        revokedAt,
        revokedReason,
      },
    });
  },

  async revokeRefreshFamily(familyId, revokedAt, revokedReason) {
    await prisma.refreshSession.updateMany({
      where: {
        familyId,
        revokedAt: null,
      },
      data: {
        revokedAt,
        revokedReason,
      },
    });
  },

  async markRefreshSessionUsed(id, usedAt) {
    await prisma.refreshSession.update({
      where: { id },
      data: {
        lastUsedAt: usedAt,
      },
    });
  },

  async createEmailVerificationToken(input) {
    return prisma.emailVerificationToken.create({
      data: input,
    });
  },

  async findEmailVerificationTokenByHash(tokenHash) {
    return prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });
  },

  async markEmailVerified(userId, tokenId, verifiedAt) {
    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: tokenId },
        data: {
          usedAt: verifiedAt,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          emailVerifiedAt: verifiedAt,
        },
      }),
      prisma.vendorProfile.updateMany({
        where: {
          userId,
          lifecycleStage: {
            in: ["REGISTERED", "EMAIL_VERIFICATION"],
          },
        },
        data: {
          lifecycleStage: "BUSINESS_PROFILE",
        },
      }),
    ]);
  },
};
