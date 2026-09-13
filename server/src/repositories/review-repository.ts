import type { Review, Prisma } from "@prisma/client";

import { prisma } from "../config/prisma.js";
import type { AuditInput } from "./vendor-repository.js";

export type ReviewWithRelations = Review & {
  customer: { id: string; displayName: string };
  product: { id: string; name: string };
  vendor: { id: string; displayName: string };
};

export type ReviewRepository = {
  findById(reviewId: string): Promise<ReviewWithRelations | null>;
  findByRentalId(rentalId: string): Promise<ReviewWithRelations | null>;
  findByCustomerAndRental(
    customerId: string,
    rentalId: string,
  ): Promise<ReviewWithRelations | null>;
  listByProduct(
    productId: string,
    limit: number,
    offset: number,
  ): Promise<{ reviews: ReviewWithRelations[]; total: number }>;
  listByCustomer(
    customerId: string,
    limit: number,
    offset: number,
  ): Promise<{ reviews: ReviewWithRelations[]; total: number }>;
  listByVendor(
    vendorId: string,
    limit: number,
    offset: number,
  ): Promise<{ reviews: ReviewWithRelations[]; total: number }>;
  create(
    data: Prisma.ReviewCreateInput,
    audit?: AuditInput,
  ): Promise<ReviewWithRelations>;
  getAverageRating(
    productId: string,
  ): Promise<{ average: number; count: number }>;
};

const reviewInclude = {
  customer: {
    select: { id: true, displayName: true },
  },
  product: {
    select: { id: true, name: true },
  },
  vendor: {
    select: { id: true, displayName: true },
  },
} satisfies Prisma.ReviewInclude;

export const prismaReviewRepository: ReviewRepository = {
  async findById(reviewId) {
    return prisma.review.findUnique({
      where: { id: reviewId },
      include: reviewInclude,
    });
  },

  async findByRentalId(rentalId) {
    return prisma.review.findUnique({
      where: { rentalId },
      include: reviewInclude,
    });
  },

  async findByCustomerAndRental(customerId, rentalId) {
    return prisma.review.findFirst({
      where: { customerId, rentalId },
      include: reviewInclude,
    });
  },

  async listByProduct(productId, limit, offset) {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId,
          status: "PUBLISHED",
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: reviewInclude,
      }),
      prisma.review.count({
        where: {
          productId,
          status: "PUBLISHED",
        },
      }),
    ]);
    return { reviews, total };
  },

  async listByCustomer(customerId, limit, offset) {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: reviewInclude,
      }),
      prisma.review.count({
        where: { customerId },
      }),
    ]);
    return { reviews, total };
  },

  async listByVendor(vendorId, limit, offset) {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          vendorId,
          status: "PUBLISHED",
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: reviewInclude,
      }),
      prisma.review.count({
        where: {
          vendorId,
          status: "PUBLISHED",
        },
      }),
    ]);
    return { reviews, total };
  },

  async create(data) {
    return prisma.review.create({
      data,
      include: reviewInclude,
    });
  },

  async getAverageRating(productId) {
    const result = await prisma.review.aggregate({
      where: {
        productId,
        status: "PUBLISHED",
      },
      _avg: {
        rating: true,
      },
      _count: true,
    });

    return {
      average: result._avg.rating ?? 0,
      count: result._count,
    };
  },
};
