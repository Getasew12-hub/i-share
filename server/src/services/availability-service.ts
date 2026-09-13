import type { ProductAvailabilityPeriod } from "@prisma/client";

import { AppError } from "../errors/app-error.js";
import type { AvailabilityRepository } from "../repositories/availability-repository.js";
import { prismaAvailabilityRepository } from "../repositories/availability-repository.js";

export type AvailabilityCheckResult = {
  available: boolean;
  productId: string;
  startsAt: string;
  endsAt: string;
  coveringPeriod: ProductAvailabilityPeriod | null;
  conflicts: ProductAvailabilityPeriod[];
};

export type AvailabilityWindow = {
  type: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
};

export type AvailabilityScheduleResult = {
  productId: string;
  isRentable: boolean;
  periods: AvailabilityWindow[];
};

function overlaps(
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date,
): boolean {
  return firstStart < secondEnd && firstEnd > secondStart;
}

export class AvailabilityService {
  constructor(private readonly repository: AvailabilityRepository) {}

  async checkAvailability(
    productId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<AvailabilityCheckResult> {
    const product =
      await this.repository.findProductWithAvailability(productId);

    if (!product) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    }

    if (
      product.vendor.status !== "APPROVED" ||
      product.vendor.verificationStatus !== "APPROVED"
    ) {
      throw new AppError(
        409,
        "PRODUCT_NOT_RENTABLE",
        "This product is not currently rentable.",
      );
    }

    const coveringPeriod =
      product.availabilityPeriods.find(
        (period) =>
          period.type === "AVAILABLE" &&
          period.startsAt <= startsAt &&
          period.endsAt >= endsAt,
      ) ?? null;

    const conflicts = product.availabilityPeriods.filter(
      (period) =>
        ["RESERVED", "MAINTENANCE", "BLOCKED"].includes(period.type) &&
        overlaps(period.startsAt, period.endsAt, startsAt, endsAt),
    );

    const available = Boolean(coveringPeriod) && conflicts.length === 0;

    return {
      available,
      productId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      coveringPeriod: coveringPeriod
        ? {
            id: coveringPeriod.id,
            productId: coveringPeriod.productId,
            type: coveringPeriod.type,
            startsAt: coveringPeriod.startsAt,
            endsAt: coveringPeriod.endsAt,
            reason: coveringPeriod.reason,
            createdAt: coveringPeriod.createdAt,
            updatedAt: coveringPeriod.updatedAt,
          }
        : null,
      conflicts: conflicts.map((period) => ({
        id: period.id,
        productId: period.productId,
        type: period.type,
        startsAt: period.startsAt,
        endsAt: period.endsAt,
        reason: period.reason,
        createdAt: period.createdAt,
        updatedAt: period.updatedAt,
      })),
    };
  }

  async getSchedule(productId: string): Promise<AvailabilityScheduleResult> {
    const product =
      await this.repository.findProductWithAvailability(productId);

    if (!product) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    }

    const isRentable =
      product.vendor.status === "APPROVED" &&
      product.vendor.verificationStatus === "APPROVED";

    return {
      productId,
      isRentable,
      periods: product.availabilityPeriods.map((period) => ({
        type: period.type,
        startsAt: period.startsAt.toISOString(),
        endsAt: period.endsAt.toISOString(),
        reason: period.reason,
      })),
    };
  }
}

export const availabilityService = new AvailabilityService(
  prismaAvailabilityRepository,
);
