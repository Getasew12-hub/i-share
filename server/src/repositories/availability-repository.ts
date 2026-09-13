import type {
  Product,
  ProductAvailabilityPeriod,
  VendorProfile,
} from "@prisma/client";

import { prisma } from "../config/prisma.js";

export type AvailabilityWithProduct = ProductAvailabilityPeriod & {
  product: Product & {
    vendor: Pick<VendorProfile, "id" | "status" | "verificationStatus">;
  };
};

export type AvailabilityRepository = {
  findProductWithAvailability(productId: string): Promise<
    | (Product & {
        availabilityPeriods: ProductAvailabilityPeriod[];
        vendor: Pick<VendorProfile, "id" | "status" | "verificationStatus">;
      })
    | null
  >;
  findAvailabilityForRange(
    productId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<ProductAvailabilityPeriod[]>;
  hasAvailableWindow(
    productId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<boolean>;
  hasUnavailableConflict(
    productId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<boolean>;
};

export const prismaAvailabilityRepository: AvailabilityRepository = {
  findProductWithAvailability(productId) {
    return prisma.product.findFirst({
      where: { id: productId, status: "PUBLISHED" },
      include: {
        availabilityPeriods: {
          orderBy: { startsAt: "asc" },
        },
        vendor: {
          select: {
            id: true,
            status: true,
            verificationStatus: true,
          },
        },
      },
    });
  },

  findAvailabilityForRange(productId, startsAt, endsAt) {
    return prisma.productAvailabilityPeriod.findMany({
      where: {
        productId,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      orderBy: { startsAt: "asc" },
    });
  },

  async hasAvailableWindow(productId, startsAt, endsAt) {
    const count = await prisma.productAvailabilityPeriod.count({
      where: {
        productId,
        type: "AVAILABLE",
        startsAt: { lte: startsAt },
        endsAt: { gte: endsAt },
      },
    });

    return count > 0;
  },

  async hasUnavailableConflict(productId, startsAt, endsAt) {
    const count = await prisma.productAvailabilityPeriod.count({
      where: {
        productId,
        type: { in: ["RESERVED", "MAINTENANCE", "BLOCKED"] },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });

    return count > 0;
  },
};
