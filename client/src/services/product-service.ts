import { apiClient } from "./api-client";
import type {
  AvailabilityPayload,
  AvailabilityPeriod,
  Category,
  MarketplaceFilters,
  MarketplaceProductsResult,
  Product,
  ProductPayload,
  ProductStatus,
} from "../types/product";

type Envelope<T> = {
  data: T;
};

function authorization(accessToken: string) {
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
}

export async function listCategories() {
  const response = await apiClient.get<Envelope<{ categories: Category[] }>>(
    "/products/categories",
  );

  return response.data.data.categories;
}

function marketplaceParams(filters: MarketplaceFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  return params;
}

export async function listPublishedProducts(filters: MarketplaceFilters = {}) {
  const response = await apiClient.get<Envelope<MarketplaceProductsResult>>(
    "/products/public",
    {
      params: marketplaceParams(filters),
    },
  );

  return response.data.data;
}

export async function getPublishedProduct(productId: string) {
  const response = await apiClient.get<Envelope<{ product: Product }>>(
    `/products/public/${productId}`,
  );

  return response.data.data.product;
}

export async function listMyProducts(accessToken: string) {
  const response = await apiClient.get<Envelope<{ products: Product[] }>>(
    "/products/me",
    authorization(accessToken),
  );

  return response.data.data.products;
}

export async function createMyProduct(
  accessToken: string,
  payload: ProductPayload,
) {
  const response = await apiClient.post<Envelope<{ product: Product }>>(
    "/products/me",
    payload,
    authorization(accessToken),
  );

  return response.data.data.product;
}

export async function updateMyProduct(
  accessToken: string,
  productId: string,
  payload: ProductPayload,
) {
  const response = await apiClient.put<Envelope<{ product: Product }>>(
    `/products/me/${productId}`,
    payload,
    authorization(accessToken),
  );

  return response.data.data.product;
}

export async function changeMyProductStatus(
  accessToken: string,
  productId: string,
  status: ProductStatus,
) {
  const response = await apiClient.patch<Envelope<{ product: Product }>>(
    `/products/me/${productId}/status`,
    { status },
    authorization(accessToken),
  );

  return response.data.data.product;
}

export async function deactivateMyProduct(
  accessToken: string,
  productId: string,
) {
  const response = await apiClient.delete<Envelope<{ product: Product }>>(
    `/products/me/${productId}`,
    authorization(accessToken),
  );

  return response.data.data.product;
}

export async function createMyAvailability(
  accessToken: string,
  productId: string,
  payload: AvailabilityPayload,
) {
  const response = await apiClient.post<
    Envelope<{ availabilityPeriod: AvailabilityPeriod }>
  >(
    `/products/me/${productId}/availability`,
    payload,
    authorization(accessToken),
  );

  return response.data.data.availabilityPeriod;
}
