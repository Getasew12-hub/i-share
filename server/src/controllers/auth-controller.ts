import type { Request, Response } from "express";

import { authService } from "../services/auth-service.js";
import {
  clearRefreshTokenCookie,
  getRefreshTokenCookie,
  setRefreshTokenCookie,
} from "../utils/cookies.js";
import { sendMessage, sendSuccess } from "../utils/http.js";

function requestContext(request: Request) {
  return {
    ipAddress: request.ip,
    userAgent: request.get("user-agent"),
  };
}

function sendAuthResult(
  response: Response,
  result: Awaited<ReturnType<typeof authService.login>>,
  statusCode = 200,
) {
  setRefreshTokenCookie(
    response,
    result.refreshToken,
    result.refreshTokenExpiresAt,
  );

  return sendSuccess(
    response,
    {
      user: result.user,
      accessToken: result.accessToken,
    },
    statusCode,
  );
}

export async function registerCustomer(request: Request, response: Response) {
  const result = await authService.registerCustomer(
    request.body,
    requestContext(request),
  );

  sendAuthResult(response, result, 201);
}

export async function registerVendor(request: Request, response: Response) {
  const result = await authService.registerVendor(
    request.body,
    requestContext(request),
  );

  sendAuthResult(response, result, 201);
}

export async function login(request: Request, response: Response) {
  const result = await authService.login(request.body, requestContext(request));

  sendAuthResult(response, result);
}

export async function refresh(request: Request, response: Response) {
  const result = await authService.refresh(
    getRefreshTokenCookie(request),
    requestContext(request),
  );

  sendAuthResult(response, result);
}

export async function logout(request: Request, response: Response) {
  await authService.logout(getRefreshTokenCookie(request));
  clearRefreshTokenCookie(response);
  sendMessage(response, "Logged out.");
}

export async function getCurrentUser(request: Request, response: Response) {
  sendSuccess(response, {
    user: request.user,
  });
}

export async function requestEmailVerification(
  request: Request,
  response: Response,
) {
  await authService.requestEmailVerification(request.user!.id);
  sendMessage(response, "Email verification requested.");
}

export async function confirmEmailVerification(
  request: Request,
  response: Response,
) {
  await authService.confirmEmailVerification(request.body.token);
  sendMessage(response, "Email verified.");
}
