import type { Review } from "../types/review";
import { apiClient } from "./api-client";

export const reviewService = {
  async createReview(input: {
    rentalId: string;
    rating: number;
    comment?: string;
  }): Promise<{ review: Review }> {
    const response = await apiClient.post("/reviews", input);
    return response.data;
  },

  async getReview(reviewId: string): Promise<{ review: Review }> {
    const response = await apiClient.get(`/reviews/${reviewId}`);
    return response.data;
  },

  async listProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await apiClient.get(
      `/reviews/product/${productId}?page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  async getProductRating(productId: string): Promise<{
    rating: {
      average: number;
      count: number;
    };
  }> {
    const response = await apiClient.get(
      `/reviews/product/${productId}/rating`,
    );
    return response.data;
  },

  async listMyReviews(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await apiClient.get(
      `/reviews/me?page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  async listVendorReviews(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    reviews: Review[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await apiClient.get(
      `/reviews/vendor?page=${page}&limit=${limit}`,
    );
    return response.data;
  },
};
