import type { ReviewStatus } from "@prisma/client";

import { AppError } from "../errors/app-error.js";
import type { ReviewRepository } from "../repositories/review-repository.js";
import { prismaReviewRepository } from "../repositories/review-repository.js";
import type { BookingRepository } from "../repositories/booking-repository.js";
import { prismaBookingRepository } from "../repositories/booking-repository.js";
import { prisma } from "../config/prisma.js";
import type { CreateReviewInput } from "../schemas/review-schemas.js";

export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly bookingRepository: BookingRepository,
  ) {}

  async createReview(userId: string, input: CreateReviewInput) {
    const customer = await this.requireCustomer(userId);

    const rental = await prisma.rental.findUnique({
      where: { id: input.rentalId },
      include: {
        booking: {
          select: {
            customerId: true,
            productId: true,
            vendorId: true,
          },
        },
      },
    });

    if (!rental) {
      throw new AppError(404, "RENTAL_NOT_FOUND", "Rental not found.");
    }

    if (rental.status !== "COMPLETED") {
      throw new AppError(
        409,
        "INVALID_RENTAL_STATUS",
        "Only completed rentals can be reviewed.",
      );
    }

    if (rental.booking.customerId !== customer.id) {
      throw new AppError(
        403,
        "REVIEW_ACCESS_DENIED",
        "You do not own this rental.",
      );
    }

    const existingReview = await this.reviewRepository.findByCustomerAndRental(
      customer.id,
      input.rentalId,
    );

    if (existingReview) {
      throw new AppError(
        409,
        "REVIEW_ALREADY_EXISTS",
        "You have already reviewed this rental.",
      );
    }

    const review = await this.reviewRepository.create({
      rental: { connect: { id: input.rentalId } },
      product: { connect: { id: rental.booking.productId } },
      vendor: { connect: { id: rental.booking.vendorId } },
      customer: { connect: { id: customer.id } },
      rating: input.rating,
      comment: input.comment || null,
      status: "PUBLISHED",
    });

    return review;
  }

  async getReviewDetails(reviewId: string) {
    const review = await this.reviewRepository.findById(reviewId);

    if (!review) {
      throw new AppError(404, "REVIEW_NOT_FOUND", "Review not found.");
    }

    return review;
  }

  async listProductReviews(productId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { reviews, total } = await this.reviewRepository.listByProduct(
      productId,
      limit,
      offset,
    );

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listCustomerReviews(userId: string, page: number, limit: number) {
    const customer = await this.requireCustomer(userId);

    const offset = (page - 1) * limit;
    const { reviews, total } = await this.reviewRepository.listByCustomer(
      customer.id,
      limit,
      offset,
    );

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listVendorReviews(userId: string, page: number, limit: number) {
    const vendor = await this.requireVendor(userId);

    const offset = (page - 1) * limit;
    const { reviews, total } = await this.reviewRepository.listByVendor(
      vendor.id,
      limit,
      offset,
    );

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductRating(productId: string) {
    const { average, count } =
      await this.reviewRepository.getAverageRating(productId);

    return {
      averageRating: average,
      reviewCount: count,
    };
  }

  private async requireCustomer(userId: string): Promise<{ id: string }> {
    const customer = await this.bookingRepository.findCustomerByUserId(userId);

    if (!customer) {
      throw new AppError(
        404,
        "CUSTOMER_PROFILE_NOT_FOUND",
        "Customer profile not found.",
      );
    }

    return customer;
  }

  private async requireVendor(userId: string): Promise<{ id: string }> {
    const vendor = await this.bookingRepository.findVendorByUserId(userId);

    if (!vendor) {
      throw new AppError(
        404,
        "VENDOR_PROFILE_NOT_FOUND",
        "Vendor profile not found.",
      );
    }

    return vendor;
  }
}

export const reviewService = new ReviewService(
  prismaReviewRepository,
  prismaBookingRepository,
);
