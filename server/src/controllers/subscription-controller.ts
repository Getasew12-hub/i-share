import type { Request, Response } from "express";

import { subscriptionService } from "../services/subscription-service.js";
import { sendSuccess } from "../utils/http.js";

function requestContext(request: Request) {
  return {
    ipAddress: request.ip,
    userAgent: request.get("user-agent"),
  };
}

export async function listSubscriptionPlans(
  _request: Request,
  response: Response,
) {
  const plans = await subscriptionService.listPlans();

  sendSuccess(response, { plans });
}

export async function getMySubscription(request: Request, response: Response) {
  const subscription = await subscriptionService.getMySubscription(
    request.user!.id,
  );

  sendSuccess(response, subscription);
}

export async function selectMySubscription(
  request: Request,
  response: Response,
) {
  const subscription = await subscriptionService.selectMySubscription(
    request.user!.id,
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { subscription }, 201);
}

export async function changeMySubscriptionPlan(
  request: Request,
  response: Response,
) {
  const subscription = await subscriptionService.changeMyPlan(
    request.user!.id,
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { subscription });
}

export async function cancelMySubscription(
  request: Request,
  response: Response,
) {
  const subscription = await subscriptionService.cancelMySubscription(
    request.user!.id,
    requestContext(request),
  );

  sendSuccess(response, { subscription });
}
