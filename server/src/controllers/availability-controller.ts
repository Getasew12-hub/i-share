import type { Request, Response } from "express";

import { availabilityService } from "../services/availability-service.js";
import { sendSuccess } from "../utils/http.js";

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

export async function checkAvailability(request: Request, response: Response) {
  const productId = param(request.params.productId);
  const startsAt = new Date(request.query.startsAt as string);
  const endsAt = new Date(request.query.endsAt as string);

  const result = await availabilityService.checkAvailability(
    productId,
    startsAt,
    endsAt,
  );

  sendSuccess(response, result);
}

export async function getAvailabilitySchedule(
  request: Request,
  response: Response,
) {
  const productId = param(request.params.productId);
  const result = await availabilityService.getSchedule(productId);

  sendSuccess(response, result);
}
