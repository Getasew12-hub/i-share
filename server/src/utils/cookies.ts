import type { Request, Response } from "express";

const refreshCookieName = "i_share_refresh";

export function getRefreshTokenCookie(request: Request) {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return undefined;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookie.trim().split("=");

    if (name === refreshCookieName) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return undefined;
}

export function setRefreshTokenCookie(
  response: Response,
  refreshToken: string,
  expiresAt: Date,
) {
  response.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: expiresAt,
    path: "/api/v1/auth",
  });
}

export function clearRefreshTokenCookie(response: Response) {
  response.clearCookie(refreshCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth",
  });
}
