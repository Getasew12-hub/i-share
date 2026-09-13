import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { AppError } from "../errors/app-error.js";

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  status: string;
  exp: number;
  iat: number;
};

const encoder = new TextEncoder();

function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlJson(value: unknown) {
  return base64UrlEncode(JSON.stringify(value));
}

function signValue(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqualString(left: string, right: string) {
  const leftBuffer = encoder.encode(left);
  const rightBuffer = encoder.encode(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function createAccessToken(
  payload: Omit<JwtPayload, "exp" | "iat">,
  secret: string,
  expiresInSeconds: number,
) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const body = base64UrlJson({
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  });
  const unsignedToken = `${header}.${body}`;
  const signature = signValue(unsignedToken, secret);

  return `${unsignedToken}.${signature}`;
}

export function verifyAccessToken(token: string, secret: string): JwtPayload {
  const [header, body, signature] = token.split(".");

  if (!header || !body || !signature) {
    throw new AppError(401, "INVALID_ACCESS_TOKEN", "Invalid access token.");
  }

  const expectedSignature = signValue(`${header}.${body}`, secret);

  if (!safeEqualString(signature, expectedSignature)) {
    throw new AppError(401, "INVALID_ACCESS_TOKEN", "Invalid access token.");
  }

  const payload = JSON.parse(
    Buffer.from(body, "base64url").toString("utf8"),
  ) as JwtPayload;

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new AppError(401, "ACCESS_TOKEN_EXPIRED", "Access token expired.");
  }

  return payload;
}

export function createOpaqueToken() {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token: string, secret: string) {
  return signValue(token, secret);
}
