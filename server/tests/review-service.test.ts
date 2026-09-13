import { Prisma, type Review } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../src/config/prisma.js";
import { AppError } from "../src/errors/app-error.js";
import { ReviewService } from "../src/services/review-service.js";

const customerUserId = "20000000-0000-4000-8000-000000000001";
const customerId = "40000000-0000-4000-8000-000000000001";
const vendorUserId = "10000000-0000-4000-8000-000000000001";
const vendorId = "30000000-0000-4000-8000-000000000001";
const productId = "60000000-0000-4000-8000-000000000001";
const rentalId = "90000000-0000-4000-8000-000000000001";
const reviewId = "rev_001";

function createRental(overrides: Record<string, unknown> = {}) {
  return {
    id: rentalId,
    status: "COMPLETED",
    booking: {
      customerId,
      productId,
      vendorId,
    },
    ...overrides,
  };
}

function createReview(overrides: Partial<Review> = {}): Review & {
  customer: { id: string; displayName: string };
  product: { id: string; name: string };
  vendor: { id: string; displayName: string };
} {
  return {
    id: reviewId,
    rentalId,
    productId,
    vendorId,
    customerId,
    rating: 5,
    comment: "Excellent rental experience",
    status: "PUBLISHED",
    createdAt: new Date("2026-09-02T00:00:00.000Z"),
    updatedAt: new Date("2026-09-02T00:00:00.000Z"),
    customer: { id: customerId, displayName: "Test Customer" },
    product: { id: productId, name: "Cordless Drill" },
    vendor: { id: vendorId, displayName: "Test Vendor" },
    ...overrides,
  } as Review & {
    customer: { id: string; displayName: string };
    product: { id: string; name: string };
    vendor: { id: string; displayName: string };
  };
}

class FakeReviewRepository {
  reviews: Array<Review & { customer: any; product: any; vendor: any }> = [];

  async findById(reviewId: string) {
    return this.reviews.find((review) => review.id === reviewId) ?? null;
  }

  async findByCustomerAndRental(
    customerIdValue: string,
    rentalIdValue: string,
  ) {
    return (
      this.reviews.find(
        (review) =>
          review.customerId === customerIdValue &&
          review.rentalId === rentalIdValue,
      ) ?? null
    );
  }

  async listByProduct(productIdValue: string, limit: number, offset: number) {
    const filtered = this.reviews.filter(
      (review) => review.productId === productIdValue,
    );
    return {
      reviews: filtered.slice(offset, offset + limit),
      total: filtered.length,
    };
  }

  async listByCustomer(customerIdValue: string, limit: number, offset: number) {
    const filtered = this.reviews.filter(
      (review) => review.customerId === customerIdValue,
    );
    return {
      reviews: filtered.slice(offset, offset + limit),
      total: filtered.length,
    };
  }

  async listByVendor(vendorIdValue: string, limit: number, offset: number) {
    const filtered = this.reviews.filter(
      (review) => review.vendorId === vendorIdValue,
    );
    return {
      reviews: filtered.slice(offset, offset + limit),
      total: filtered.length,
    };
  }

  async create(data: any) {
    const record = {
      id: `rev_${this.reviews.length + 1}`,
      rentalId: data.rental.connect.id,
      productId: data.product.connect.id,
      vendorId: data.vendor.connect.id,
      customerId: data.customer.connect.id,
      rating: data.rating,
      comment: data.comment,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { id: data.customer.connect.id, displayName: "Test Customer" },
      product: { id: data.product.connect.id, name: "Cordless Drill" },
      vendor: { id: data.vendor.connect.id, displayName: "Test Vendor" },
    } as Review & { customer: any; product: any; vendor: any };

    this.reviews.push(record);
    return record;
  }

  async getAverageRating(productIdValue: string) {
    const filtered = this.reviews.filter(
      (review) => review.productId === productIdValue,
    );
    const average =
      filtered.length === 0
        ? 0
        : filtered.reduce((sum, review) => sum + Number(review.rating), 0) /
          filtered.length;

    return { average, count: filtered.length };
  }
}

class FakeBookingRepository {
  async findCustomerByUserId(userId: string) {
    return userId === customerUserId ? { id: customerId } : null;
  }

  async findVendorByUserId(userId: string) {
    return userId === vendorUserId ? { id: vendorId } : null;
  }
}

describe("ReviewService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a review for completed rentals owned by the customer", async () => {
    const reviewRepository = new FakeReviewRepository();
    const bookingRepository = new FakeBookingRepository();
    const service = new ReviewService(
      reviewRepository as any,
      bookingRepository as any,
    );

    vi.spyOn(bookingRepository, "findCustomerByUserId").mockResolvedValue({
      id: customerId,
    });
    vi.spyOn(prisma.rental, "findUnique").mockResolvedValue(
      createRental() as any,
    );

    const result = await service.createReview(customerUserId, {
      rentalId,
      rating: 5,
      comment: "Great experience",
    } as any);

    expect(result.rating).toBe(5);
    expect(result.productId).toBe(productId);
    expect(result.vendorId).toBe(vendorId);
  });

  it("rejects review creation when the rental is not completed or the customer does not own it", async () => {
    const reviewRepository = new FakeReviewRepository();
    const bookingRepository = new FakeBookingRepository();
    const service = new ReviewService(
      reviewRepository as any,
      bookingRepository as any,
    );

    vi.spyOn(bookingRepository, "findCustomerByUserId").mockResolvedValue({
      id: customerId,
    });
    vi.spyOn(prisma.rental, "findUnique").mockResolvedValue(
      createRental({ status: "ACTIVE" }) as any,
    );

    await expect(
      service.createReview(customerUserId, { rentalId, rating: 4 } as any),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "INVALID_RENTAL_STATUS",
    });

    vi.spyOn(prisma.rental, "findUnique").mockResolvedValue(
      createRental({
        booking: { customerId: "other-customer", productId, vendorId },
      }) as any,
    );

    await expect(
      service.createReview(customerUserId, { rentalId, rating: 4 } as any),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "REVIEW_ACCESS_DENIED",
    });
  });

  it("prevents duplicate reviews for the same rental", async () => {
    const reviewRepository = new FakeReviewRepository();
    const bookingRepository = new FakeBookingRepository();
    const service = new ReviewService(
      reviewRepository as any,
      bookingRepository as any,
    );

    reviewRepository.reviews.push(createReview());
    vi.spyOn(bookingRepository, "findCustomerByUserId").mockResolvedValue({
      id: customerId,
    });
    vi.spyOn(prisma.rental, "findUnique").mockResolvedValue(
      createRental() as any,
    );

    await expect(
      service.createReview(customerUserId, { rentalId, rating: 5 } as any),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "REVIEW_ALREADY_EXISTS",
    });
  });

  it("returns a review by id and paginated product, customer, and vendor review lists", async () => {
    const reviewRepository = new FakeReviewRepository();
    const bookingRepository = new FakeBookingRepository();
    const service = new ReviewService(
      reviewRepository as any,
      bookingRepository as any,
    );

    const review = createReview();
    reviewRepository.reviews.push(review);

    await expect(service.getReviewDetails(review.id)).resolves.toMatchObject({
      id: review.id,
    });

    await expect(
      service.listProductReviews(productId, 1, 10),
    ).resolves.toMatchObject({
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });

    vi.spyOn(bookingRepository, "findCustomerByUserId").mockResolvedValue({
      id: customerId,
    });
    await expect(
      service.listCustomerReviews(customerUserId, 1, 10),
    ).resolves.toMatchObject({
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });

    vi.spyOn(bookingRepository, "findVendorByUserId").mockResolvedValue({
      id: vendorId,
    });
    await expect(
      service.listVendorReviews(vendorUserId, 1, 10),
    ).resolves.toMatchObject({
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it("returns the average review rating and count for a product", async () => {
    const reviewRepository = new FakeReviewRepository();
    const bookingRepository = new FakeBookingRepository();
    const service = new ReviewService(
      reviewRepository as any,
      bookingRepository as any,
    );

    reviewRepository.reviews.push(
      createReview({ id: "rev_1", rating: 5 }),
      createReview({ id: "rev_2", rating: 3 }),
      createReview({ id: "rev_3", rating: 4 }),
    );

    await expect(service.getProductRating(productId)).resolves.toMatchObject({
      averageRating: 4,
      reviewCount: 3,
    });
  });
});
