import type { Request, Response } from "express";

import { productService } from "../services/product-service.js";
import type { MarketplaceQueryInput } from "../schemas/product-schemas.js";
import { sendMessage, sendSuccess } from "../utils/http.js";

function requestContext(request: Request) {
  return {
    ipAddress: request.ip,
    userAgent: request.get("user-agent"),
  };
}

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

export async function listCategories(_request: Request, response: Response) {
  const categories = await productService.listCategories();

  sendSuccess(response, { categories });
}

export async function listMyProducts(request: Request, response: Response) {
  const products = await productService.listMyProducts(request.user!.id);

  sendSuccess(response, { products });
}

export async function createMyProduct(request: Request, response: Response) {
  const product = await productService.createMyProduct(
    request.user!.id,
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { product }, 201);
}

export async function getMyProduct(request: Request, response: Response) {
  const product = await productService.getMyProduct(
    request.user!.id,
    param(request.params.productId),
  );

  sendSuccess(response, { product });
}

export async function updateMyProduct(request: Request, response: Response) {
  const product = await productService.updateMyProduct(
    request.user!.id,
    param(request.params.productId),
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { product });
}

export async function changeMyProductStatus(
  request: Request,
  response: Response,
) {
  const product = await productService.changeMyProductStatus(
    request.user!.id,
    param(request.params.productId),
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { product });
}

export async function deactivateMyProduct(
  request: Request,
  response: Response,
) {
  const product = await productService.deactivateMyProduct(
    request.user!.id,
    param(request.params.productId),
    requestContext(request),
  );

  sendSuccess(response, { product });
}

export async function addMyProductImage(request: Request, response: Response) {
  const image = await productService.addMyProductImage(
    request.user!.id,
    param(request.params.productId),
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { image }, 201);
}

export async function addMyProductDocument(
  request: Request,
  response: Response,
) {
  const document = await productService.addMyProductDocument(
    request.user!.id,
    param(request.params.productId),
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { document }, 201);
}

export async function listMyAvailability(request: Request, response: Response) {
  const availabilityPeriods = await productService.listMyAvailability(
    request.user!.id,
    param(request.params.productId),
  );

  sendSuccess(response, { availabilityPeriods });
}

export async function createMyAvailability(
  request: Request,
  response: Response,
) {
  const availabilityPeriod = await productService.createMyAvailability(
    request.user!.id,
    param(request.params.productId),
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { availabilityPeriod }, 201);
}

export async function updateMyAvailability(
  request: Request,
  response: Response,
) {
  const availabilityPeriod = await productService.updateMyAvailability(
    request.user!.id,
    param(request.params.productId),
    param(request.params.availabilityId),
    request.body,
    requestContext(request),
  );

  sendSuccess(response, { availabilityPeriod });
}

export async function deleteMyAvailability(
  request: Request,
  response: Response,
) {
  await productService.deleteMyAvailability(
    request.user!.id,
    param(request.params.productId),
    param(request.params.availabilityId),
    requestContext(request),
  );

  sendMessage(response, "Availability period deleted.");
}

export async function listPublishedProducts(
  request: Request,
  response: Response,
) {
  const result = await productService.listPublishedProducts(
    request.query as unknown as MarketplaceQueryInput,
  );

  sendSuccess(response, result);
}

export async function getPublishedProduct(
  request: Request,
  response: Response,
) {
  const product = await productService.getPublishedProduct(
    param(request.params.productId),
  );

  sendSuccess(response, { product });
}
