import type { Request, Response } from "express";

import { reviewService } from "../services/review-service.js";
import { sendSuccess } from "../utils/http.js";

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

function query(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

export async function createReview(request: Request, response: Response) {
  const review = await reviewService.createReview(
    request.user!.id,
    request.body,
  );

  sendSuccess(response, { review }, 201);
}

export async function getReview(request: Request, response: Response) {
  const review = await reviewService.getReviewDetails(
    param(request.params.reviewId),
  );

  sendSuccess(response, { review });
}

export async function listProductReviews(request: Request, response: Response) {
  const productId = param(request.params.productId);
  const page = Number.parseInt(query(request.query.page as string)) || 1;
  const limit = Number.parseInt(query(request.query.limit as string)) || 20;

  const result = await reviewService.listProductReviews(productId, page, limit);

  sendSuccess(response, result);
}

export async function listMyReviews(request: Request, response: Response) {
  const page = Number.parseInt(query(request.query.page as string)) || 1;
  const limit = Number.parseInt(query(request.query.limit as string)) || 20;

  const result = await reviewService.listCustomerReviews(
    request.user!.id,
    page,
    limit,
  );

  sendSuccess(response, result);
}

export async function listVendorReviews(request: Request, response: Response) {
  const page = Number.parseInt(query(request.query.page as string)) || 1;
  const limit = Number.parseInt(query(request.query.limit as string)) || 20;

  const result = await reviewService.listVendorReviews(
    request.user!.id,
    page,
    limit,
  );

  sendSuccess(response, result);
}

export async function getProductRating(request: Request, response: Response) {
  const productId = param(request.params.productId);
  const rating = await reviewService.getProductRating(productId);

  sendSuccess(response, { rating });
}
