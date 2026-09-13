import type { EmailVerificationToken, RefreshSession } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { env } from "../src/config/env.js";
import type {
  AuthRepository,
  SafeUser,
  UserWithCredentials,
} from "../src/repositories/auth-repository.js";
import { AuthService } from "../src/services/auth-service.js";
import { hashPassword } from "../src/utils/password.js";
import { hashToken } from "../src/utils/tokens.js";

function createUser(
  overrides: Partial<UserWithCredentials> = {},
): UserWithCredentials {
  const now = new Date();

  return {
    id: "00000000-0000-4000-8000-000000000001",
    email: "user@example.com",
    passwordHash: "placeholder",
    role: "CUSTOMER",
    status: "ACTIVE",
    firstName: null,
    lastName: null,
    phoneNumber: null,
    emailVerifiedAt: null,
    lastLoginAt: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    customerProfile: {
      id: "00000000-0000-4000-8000-000000000011",
    },
    vendorProfile: null,
    ...overrides,
  };
}

class FakeAuthRepository implements AuthRepository {
  users = new Map<string, UserWithCredentials>();
  refreshSessions = new Map<string, RefreshSession>();
  emailVerificationTokens = new Map<string, EmailVerificationToken>();

  async createCustomer(input: {
    email: string;
    passwordHash: string;
    displayName: string;
  }) {
    const user = createUser({
      email: input.email,
      passwordHash: input.passwordHash,
    });
    this.users.set(user.id, user);
    return this.stripPassword(user);
  }

  async createVendor(input: {
    email: string;
    passwordHash: string;
    displayName: string;
    businessName?: string;
  }) {
    const user = createUser({
      email: input.email,
      passwordHash: input.passwordHash,
      role: "VENDOR",
      customerProfile: null,
      vendorProfile: {
        id: "00000000-0000-4000-8000-000000000012",
      },
    });
    this.users.set(user.id, user);
    return this.stripPassword(user);
  }

  async findUserByEmail(email: string) {
    return (
      [...this.users.values()].find((user) => user.email === email) ?? null
    );
  }

  async findSafeUserById(id: string) {
    const user = this.users.get(id);
    return user ? this.stripPassword(user) : null;
  }

  async updateLastLoginAt(userId: string, loggedInAt: Date) {
    const user = this.users.get(userId);

    if (user) {
      user.lastLoginAt = loggedInAt;
    }
  }

  async createRefreshSession(input: {
    userId: string;
    tokenHash: string;
    familyId: string;
    rotatedFromId?: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const session: RefreshSession = {
      id: `session-${this.refreshSessions.size + 1}`,
      userId: input.userId,
      tokenHash: input.tokenHash,
      familyId: input.familyId,
      rotatedFromId: input.rotatedFromId ?? null,
      revokedAt: null,
      revokedReason: null,
      expiresAt: input.expiresAt,
      lastUsedAt: null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      createdAt: new Date(),
    };
    this.refreshSessions.set(session.tokenHash, session);
    return session;
  }

  async findRefreshSessionByTokenHash(tokenHash: string) {
    return this.refreshSessions.get(tokenHash) ?? null;
  }

  async revokeRefreshSession(
    id: string,
    revokedAt: Date,
    revokedReason: string,
  ) {
    for (const session of this.refreshSessions.values()) {
      if (session.id === id) {
        session.revokedAt = revokedAt;
        session.revokedReason = revokedReason;
      }
    }
  }

  async revokeRefreshFamily(
    familyId: string,
    revokedAt: Date,
    revokedReason: string,
  ) {
    for (const session of this.refreshSessions.values()) {
      if (session.familyId === familyId && !session.revokedAt) {
        session.revokedAt = revokedAt;
        session.revokedReason = revokedReason;
      }
    }
  }

  async markRefreshSessionUsed(id: string, usedAt: Date) {
    for (const session of this.refreshSessions.values()) {
      if (session.id === id) {
        session.lastUsedAt = usedAt;
      }
    }
  }

  async createEmailVerificationToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    const token: EmailVerificationToken = {
      id: `email-token-${this.emailVerificationTokens.size + 1}`,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      usedAt: null,
      createdAt: new Date(),
    };
    this.emailVerificationTokens.set(token.tokenHash, token);
    return token;
  }

  async findEmailVerificationTokenByHash(tokenHash: string) {
    return this.emailVerificationTokens.get(tokenHash) ?? null;
  }

  async markEmailVerified(userId: string, tokenId: string, verifiedAt: Date) {
    const user = this.users.get(userId);

    if (user) {
      user.emailVerifiedAt = verifiedAt;
    }

    for (const token of this.emailVerificationTokens.values()) {
      if (token.id === tokenId) {
        token.usedAt = verifiedAt;
      }
    }
  }

  stripPassword(user: UserWithCredentials): SafeUser {
    const safeUser = { ...user };

    delete (safeUser as Partial<UserWithCredentials>).passwordHash;

    return safeUser;
  }
}

describe("AuthService", () => {
  it("registers customers without returning password hashes", async () => {
    const repository = new FakeAuthRepository();
    const service = new AuthService(repository);

    const result = await service.registerCustomer(
      {
        email: "new@example.com",
        password: "verysecurepassword",
        displayName: "New Customer",
      },
      {},
    );

    expect(result.user.role).toBe("CUSTOMER");
    expect(result.user.customerProfileId).toBeDefined();
    expect(result.accessToken).toBeTruthy();
    expect(JSON.stringify(result)).not.toContain("passwordHash");
    expect(repository.emailVerificationTokens.size).toBe(1);
  });

  it("registers vendors with a vendor profile and email verification foundation", async () => {
    const repository = new FakeAuthRepository();
    const service = new AuthService(repository);

    const result = await service.registerVendor(
      {
        email: "vendor@example.com",
        password: "verysecurepassword",
        displayName: "Acme Rentals",
        businessName: "Acme Rentals LLC",
      },
      {},
    );

    expect(result.user.role).toBe("VENDOR");
    expect(result.user.vendorProfileId).toBeDefined();
    expect(result.user.customerProfileId).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain("passwordHash");
    expect(repository.emailVerificationTokens.size).toBe(1);
  });

  it("rejects invalid login credentials", async () => {
    const repository = new FakeAuthRepository();
    const user = createUser({
      passwordHash: await hashPassword("correct-password"),
    });
    repository.users.set(user.id, user);
    const service = new AuthService(repository);

    await expect(
      service.login(
        {
          email: user.email,
          password: "wrong-password",
        },
        {},
      ),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("rotates refresh tokens and revokes a family on replay", async () => {
    const repository = new FakeAuthRepository();
    const user = createUser({
      passwordHash: await hashPassword("correct-password"),
    });
    repository.users.set(user.id, user);
    const service = new AuthService(repository);
    const loginResult = await service.login(
      {
        email: user.email,
        password: "correct-password",
      },
      {},
    );

    const refreshed = await service.refresh(loginResult.refreshToken, {});

    expect(refreshed.refreshToken).not.toBe(loginResult.refreshToken);
    expect(
      repository.refreshSessions.get(
        hashToken(loginResult.refreshToken, env.JWT_REFRESH_SECRET),
      )?.revokedReason,
    ).toBe("rotated");

    await expect(
      service.refresh(loginResult.refreshToken, {}),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "REFRESH_TOKEN_REPLAYED",
    });
    expect(
      repository.refreshSessions.get(
        hashToken(refreshed.refreshToken, env.JWT_REFRESH_SECRET),
      )?.revokedReason,
    ).toBe("replay_detected");
  });

  it("rejects invalid, expired, and reused email verification tokens", async () => {
    const repository = new FakeAuthRepository();
    const service = new AuthService(repository);
    const user = createUser();
    repository.users.set(user.id, user);

    await expect(
      service.confirmEmailVerification("not-a-real-token-with-enough-length"),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_EMAIL_VERIFICATION_TOKEN",
    });

    const expiredToken = "expired-token-with-enough-characters";
    repository.emailVerificationTokens.set(
      hashToken(expiredToken, env.JWT_REFRESH_SECRET),
      {
        id: "expired-email-token",
        userId: user.id,
        tokenHash: hashToken(expiredToken, env.JWT_REFRESH_SECRET),
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
        createdAt: new Date(),
      },
    );

    await expect(
      service.confirmEmailVerification(expiredToken),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_EMAIL_VERIFICATION_TOKEN",
    });

    const reusedToken = "reused-token-with-enough-characters";
    repository.emailVerificationTokens.set(
      hashToken(reusedToken, env.JWT_REFRESH_SECRET),
      {
        id: "reused-email-token",
        userId: user.id,
        tokenHash: hashToken(reusedToken, env.JWT_REFRESH_SECRET),
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: new Date(),
        createdAt: new Date(),
      },
    );

    await expect(
      service.confirmEmailVerification(reusedToken),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "INVALID_EMAIL_VERIFICATION_TOKEN",
    });
  });
});
