import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "../src/utils/password.js";
import { createAccessToken, verifyAccessToken } from "../src/utils/tokens.js";

describe("authentication crypto utilities", () => {
  it("hashes passwords without storing the plaintext", async () => {
    const password = "correct horse battery";
    const passwordHash = await hashPassword(password);

    expect(passwordHash).toContain("scrypt:");
    expect(passwordHash).not.toContain(password);
    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("wrong password", passwordHash)).resolves.toBe(
      false,
    );
  });

  it("signs and verifies access tokens", () => {
    const secret = "test-access-secret-that-is-long-enough";
    const token = createAccessToken(
      {
        sub: "user-1",
        email: "user@example.com",
        role: "CUSTOMER",
        status: "ACTIVE",
      },
      secret,
      60,
    );

    expect(verifyAccessToken(token, secret)).toMatchObject({
      sub: "user-1",
      email: "user@example.com",
      role: "CUSTOMER",
      status: "ACTIVE",
    });
    expect(() => verifyAccessToken(token, "different-secret")).toThrow(
      "Invalid access token.",
    );
  });
});
