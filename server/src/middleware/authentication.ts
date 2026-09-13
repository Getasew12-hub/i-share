import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { authService } from "../services/auth-service.js";
import { verifyAccessToken } from "../utils/tokens.js";

function getBearerToken(request: Request) {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return undefined;
  }

  return authorizationHeader.slice("Bearer ".length);
}

export async function requireAuthentication(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      throw new AppError(401, "UNAUTHENTICATED", "Authentication required.");
    }

    const payload = verifyAccessToken(token, env.JWT_ACCESS_SECRET);
    const user = await authService.getCurrentUser(payload.sub);

    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
