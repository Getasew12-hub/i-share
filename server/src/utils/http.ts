import type { Response } from "express";

export function sendSuccess<T>(response: Response, data: T, statusCode = 200) {
  return response.status(statusCode).json({
    data,
  });
}

export function sendMessage(
  response: Response,
  message: string,
  statusCode = 200,
) {
  return response.status(statusCode).json({
    data: {
      message,
    },
  });
}
