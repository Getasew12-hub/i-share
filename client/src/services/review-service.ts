import type { Review } from "../types/review";
import { apiClient } from "./api-client";

type Envelope<T> = { data: T };

type ReviewListResult = {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function normalizeReviewList(result: ReviewListResult) {
  return {
    reviews: result.reviews,
    total: result.pagination.total,
    page: result.pagination.page,
    totalPages: result.pagination.totalPages,
  };
}

export const reviewService = {
  async createReview(input: {
    rentalId: string;
    rating: number;
    comment?: string;
  }): Promise<{ review: Review }> {
    const response = await apiClient.post<Envelope<{ review: Review }>>(
      "/reviews",
      input,
    );
    return response.data.data;
  },

  async getReview(reviewId: string): Promise<{ review: Review }> {
    const response = await apiClient.get<Envelope<{ review: Review }>>(
      `/reviews/${reviewId}`,
    );
    return response.data.data;
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
    const response = await apiClient.get<Envelope<ReviewListResult>>(
      `/reviews/product/${productId}?page=${page}&limit=${limit}`,
    );
    return normalizeReviewList(response.data.data);
  },

  async getProductRating(productId: string): Promise<{
    rating: {
      average: number;
      count: number;
    };
  }> {
    const response = await apiClient.get<Envelope<{ rating: { averageRating: number; reviewCount: number } }>>(
      `/reviews/product/${productId}/rating`,
    );
    return {
      rating: {
        average: response.data.data.rating.averageRating,
        count: response.data.data.rating.reviewCount,
      },
    };
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
    const response = await apiClient.get<Envelope<ReviewListResult>>(
      `/reviews/me?page=${page}&limit=${limit}`,
    );
    return normalizeReviewList(response.data.data);
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
    const response = await apiClient.get<Envelope<ReviewListResult>>(
      `/reviews/vendor?page=${page}&limit=${limit}`,
    );
    return normalizeReviewList(response.data.data);
  },
};
