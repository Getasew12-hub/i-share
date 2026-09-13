import { randomUUID } from "node:crypto";

import type { UserRole, UserStatus } from "@prisma/client";

import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import type {
  AuthRepository,
  SafeUser,
  UserWithCredentials,
} from "../repositories/auth-repository.js";
import { prismaAuthRepository } from "../repositories/auth-repository.js";
import type {
  CustomerRegistrationInput,
  LoginInput,
  VendorRegistrationInput,
} from "../schemas/auth-schemas.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  createAccessToken,
  createOpaqueToken,
  hashToken,
} from "../utils/tokens.js";

type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

export type AuthUserResponse = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  vendorProfileId?: string;
  customerProfileId?: string;
};

export type AuthResult = {
  user: AuthUserResponse;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async registerCustomer(
    input: CustomerRegistrationInput,
    context: RequestContext,
  ) {
    const passwordHash = await hashPassword(input.password);
    const user = await this.handleUniqueEmail(() =>
      this.authRepository.createCustomer({
        ...input,
        passwordHash,
      }),
    );

    await this.createEmailVerificationFoundation(user.id);

    return this.createAuthenticatedSession(user, context);
  }

  async registerVendor(
    input: VendorRegistrationInput,
    context: RequestContext,
  ) {
    const passwordHash = await hashPassword(input.password);
    const user = await this.handleUniqueEmail(() =>
      this.authRepository.createVendor({
        ...input,
        passwordHash,
      }),
    );

    await this.createEmailVerificationFoundation(user.id);

    return this.createAuthenticatedSession(user, context);
  }

  async login(input: LoginInput, context: RequestContext) {
    const user = await this.authRepository.findUserByEmail(input.email);

    if (!user?.passwordHash) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials.");
    }

    if (user.status !== "ACTIVE") {
      throw new AppError(403, "ACCOUNT_NOT_ACTIVE", "Account is not active.");
    }

    const passwordMatches = await verifyPassword(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials.");
    }

    await this.authRepository.updateLastLoginAt(user.id, new Date());

    return this.createAuthenticatedSession(user, context);
  }

  async refresh(refreshToken: string | undefined, context: RequestContext) {
    if (!refreshToken) {
      throw new AppError(
        401,
        "REFRESH_TOKEN_REQUIRED",
        "Refresh token required.",
      );
    }

    const now = new Date();
    const tokenHash = hashToken(refreshToken, env.JWT_REFRESH_SECRET);
    const session =
      await this.authRepository.findRefreshSessionByTokenHash(tokenHash);

    if (!session) {
      throw new AppError(
        401,
        "INVALID_REFRESH_TOKEN",
        "Invalid refresh token.",
      );
    }

    if (session.expiresAt <= now) {
      await this.authRepository.revokeRefreshSession(
        session.id,
        now,
        "expired",
      );
      throw new AppError(
        401,
        "REFRESH_TOKEN_EXPIRED",
        "Refresh token expired.",
      );
    }

    if (session.revokedAt) {
      await this.authRepository.revokeRefreshFamily(
        session.familyId,
        now,
        "replay_detected",
      );
      throw new AppError(
        401,
        "REFRESH_TOKEN_REPLAYED",
        "Refresh token revoked.",
      );
    }

    const user = await this.authRepository.findSafeUserById(session.userId);

    if (!user || user.status !== "ACTIVE") {
      await this.authRepository.revokeRefreshFamily(
        session.familyId,
        now,
        "user_inactive",
      );
      throw new AppError(
        401,
        "INVALID_REFRESH_TOKEN",
        "Invalid refresh token.",
      );
    }

    await this.authRepository.markRefreshSessionUsed(session.id, now);
    await this.authRepository.revokeRefreshSession(session.id, now, "rotated");

    return this.createAuthenticatedSession(user, context, {
      familyId: session.familyId,
      rotatedFromId: session.id,
    });
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) {
      return;
    }

    const tokenHash = hashToken(refreshToken, env.JWT_REFRESH_SECRET);
    const session =
      await this.authRepository.findRefreshSessionByTokenHash(tokenHash);

    if (session && !session.revokedAt) {
      await this.authRepository.revokeRefreshSession(
        session.id,
        new Date(),
        "logout",
      );
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.authRepository.findSafeUserById(userId);

    if (!user || user.status !== "ACTIVE") {
      throw new AppError(401, "UNAUTHENTICATED", "Authentication required.");
    }

    return this.toUserResponse(user);
  }

  async requestEmailVerification(userId: string) {
    await this.createEmailVerificationFoundation(userId);
  }

  async confirmEmailVerification(token: string) {
    const tokenHash = hashToken(token, env.JWT_REFRESH_SECRET);
    const verificationToken =
      await this.authRepository.findEmailVerificationTokenByHash(tokenHash);

    if (
      !verificationToken ||
      verificationToken.usedAt ||
      verificationToken.expiresAt <= new Date()
    ) {
      throw new AppError(
        400,
        "INVALID_EMAIL_VERIFICATION_TOKEN",
        "Invalid or expired email verification token.",
      );
    }

    await this.authRepository.markEmailVerified(
      verificationToken.userId,
      verificationToken.id,
      new Date(),
    );
  }

  toUserResponse(user: SafeUser | UserWithCredentials): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      vendorProfileId: user.vendorProfile?.id,
      customerProfileId: user.customerProfile?.id,
    };
  }

  private async createAuthenticatedSession(
    user: SafeUser | UserWithCredentials,
    context: RequestContext,
    rotation?: { familyId: string; rotatedFromId: string },
  ): Promise<AuthResult> {
    const refreshToken = createOpaqueToken();
    const refreshTokenExpiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.authRepository.createRefreshSession({
      userId: user.id,
      tokenHash: hashToken(refreshToken, env.JWT_REFRESH_SECRET),
      familyId: rotation?.familyId ?? randomUUID(),
      rotatedFromId: rotation?.rotatedFromId,
      expiresAt: refreshTokenExpiresAt,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      user: this.toUserResponse(user),
      accessToken: createAccessToken(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
        env.JWT_ACCESS_SECRET,
        env.ACCESS_TOKEN_TTL_SECONDS,
      ),
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  private async createEmailVerificationFoundation(userId: string) {
    const token = createOpaqueToken();

    await this.authRepository.createEmailVerificationToken({
      userId,
      tokenHash: hashToken(token, env.JWT_REFRESH_SECRET),
      expiresAt: new Date(
        Date.now() + env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000,
      ),
    });
  }

  private async handleUniqueEmail(createUser: () => Promise<SafeUser>) {
    try {
      return await createUser();
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new AppError(
          409,
          "EMAIL_ALREADY_REGISTERED",
          "Email is already registered.",
        );
      }

      throw error;
    }
  }
}

export const authService = new AuthService(prismaAuthRepository);
