import type {
  Category,
  Prisma,
  Product,
  ProductAvailabilityPeriod,
  ProductDocument,
  ProductImage,
  VendorProfile,
} from "@prisma/client";

import { prisma } from "../config/prisma.js";
import type { AuditInput } from "./vendor-repository.js";

const productInclude = {
  category: true,
  vendor: {
    select: {
      id: true,
      displayName: true,
      verificationStatus: true,
      status: true,
      city: true,
      country: true,
    },
  },
  images: {
    orderBy: {
      sortOrder: "asc",
    },
  },
  documents: {
    orderBy: {
      createdAt: "desc",
    },
  },
  availabilityPeriods: {
    orderBy: {
      startsAt: "asc",
    },
  },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Product & {
  category: Category;
  vendor: Pick<
    VendorProfile,
    "id" | "displayName" | "verificationStatus" | "status" | "city" | "country"
  >;
  images: ProductImage[];
  documents: ProductDocument[];
  availabilityPeriods: ProductAvailabilityPeriod[];
};

export type MarketplaceProductFilters = {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  availableOn?: Date;
  page: number;
  limit: number;
  sort: "newest" | "name_asc" | "name_desc";
};

export type MarketplaceProductResult = {
  products: ProductWithRelations[];
  total: number;
};

export type ProductRepository = {
  findVendorByUserId(
    userId: string,
  ): Promise<Pick<
    VendorProfile,
    "id" | "verificationStatus" | "status"
  > | null>;
  findCategoryById(categoryId: string): Promise<Category | null>;
  listActiveCategories(): Promise<Category[]>;
  listVendorProducts(vendorId: string): Promise<ProductWithRelations[]>;
  listPublishedProducts(
    filters: MarketplaceProductFilters,
  ): Promise<MarketplaceProductResult>;
  findVendorProduct(
    vendorId: string,
    productId: string,
  ): Promise<ProductWithRelations | null>;
  findPublishedProduct(productId: string): Promise<ProductWithRelations | null>;
  createProduct(
    data: Prisma.ProductCreateInput,
    audit?: AuditInput,
  ): Promise<ProductWithRelations>;
  updateProduct(
    productId: string,
    data: Prisma.ProductUpdateInput,
    audit?: AuditInput,
  ): Promise<ProductWithRelations>;
  createImage(
    productId: string,
    data: Prisma.ProductImageCreateWithoutProductInput,
    audit?: AuditInput,
  ): Promise<ProductImage>;
  createDocument(
    productId: string,
    data: Prisma.ProductDocumentCreateWithoutProductInput,
    audit?: AuditInput,
  ): Promise<ProductDocument>;
  listAvailability(productId: string): Promise<ProductAvailabilityPeriod[]>;
  findAvailability(
    productId: string,
    availabilityId: string,
  ): Promise<ProductAvailabilityPeriod | null>;
  createAvailability(
    productId: string,
    data: Prisma.ProductAvailabilityPeriodCreateWithoutProductInput,
    audit?: AuditInput,
  ): Promise<ProductAvailabilityPeriod>;
  updateAvailability(
    availabilityId: string,
    data: Prisma.ProductAvailabilityPeriodUpdateInput,
    audit?: AuditInput,
  ): Promise<ProductAvailabilityPeriod>;
  deleteAvailability(availabilityId: string, audit?: AuditInput): Promise<void>;
};

function rateFilter(
  minPrice?: number,
  maxPrice?: number,
): Prisma.ProductWhereInput | undefined {
  if (minPrice === undefined && maxPrice === undefined) {
    return undefined;
  }

  const priceRange = {
    gte: minPrice,
    lte: maxPrice,
  };

  return {
    OR: [
      { pricingModel: "HOURLY", hourlyRate: priceRange },
      { pricingModel: "DAILY", dailyRate: priceRange },
      { pricingModel: "WEEKLY", weeklyRate: priceRange },
      { pricingModel: "MONTHLY", monthlyRate: priceRange },
    ],
  };
}

function marketplaceWhere(
  filters: MarketplaceProductFilters,
): Prisma.ProductWhereInput {
  const conditions: Prisma.ProductWhereInput[] = [{ status: "PUBLISHED" }];
  const query = filters.query?.trim();
  const category = filters.category?.trim();
  const location = filters.location?.trim();

  if (query) {
    conditions.push({
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { category: { name: { contains: query, mode: "insensitive" } } },
      ],
    });
  }

  if (category) {
    const categoryFilter: Prisma.ProductWhereInput[] = [
      { category: { slug: category } },
    ];

    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        category,
      )
    ) {
      categoryFilter.push({ categoryId: category });
    }

    conditions.push({
      OR: categoryFilter,
    });
  }

  if (location) {
    conditions.push({
      OR: [
        { city: { contains: location, mode: "insensitive" } },
        { country: { contains: location, mode: "insensitive" } },
      ],
    });
  }

  const price = rateFilter(filters.minPrice, filters.maxPrice);

  if (price) {
    conditions.push(price);
  }

  if (filters.availableOn) {
    conditions.push({
      availabilityPeriods: {
        some: {
          type: "AVAILABLE",
          startsAt: { lte: filters.availableOn },
          endsAt: { gt: filters.availableOn },
        },
      },
      NOT: {
        availabilityPeriods: {
          some: {
            type: { in: ["RESERVED", "MAINTENANCE", "BLOCKED"] },
            startsAt: { lte: filters.availableOn },
            endsAt: { gt: filters.availableOn },
          },
        },
      },
    });
  }

  return { AND: conditions };
}

function marketplaceOrderBy(
  sort: MarketplaceProductFilters["sort"],
): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "name_asc") {
    return [{ name: "asc" }, { publishedAt: "desc" }];
  }

  if (sort === "name_desc") {
    return [{ name: "desc" }, { publishedAt: "desc" }];
  }

  return [{ publishedAt: "desc" }, { createdAt: "desc" }];
}

function createAudit(tx: Prisma.TransactionClient, input?: AuditInput) {
  if (!input) {
    return Promise.resolve();
  }

  return tx.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

export const prismaProductRepository: ProductRepository = {
  findVendorByUserId(userId) {
    return prisma.vendorProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        verificationStatus: true,
        status: true,
      },
    });
  },

  findCategoryById(categoryId) {
    return prisma.category.findUnique({
      where: { id: categoryId },
    });
  },

  listActiveCategories() {
    return prisma.category.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ name: "asc" }],
    });
  },

  listVendorProducts(vendorId) {
    return prisma.product.findMany({
      where: { vendorId },
      include: productInclude,
      orderBy: { updatedAt: "desc" },
    });
  },

  async listPublishedProducts(filters) {
    const where = marketplaceWhere(filters);
    const [total, products] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: marketplaceOrderBy(filters.sort),
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
    ]);

    return {
      products,
      total,
    };
  },

  findVendorProduct(vendorId, productId) {
    return prisma.product.findFirst({
      where: { id: productId, vendorId },
      include: productInclude,
    });
  },

  findPublishedProduct(productId) {
    return prisma.product.findFirst({
      where: { id: productId, status: "PUBLISHED" },
      include: productInclude,
    });
  },

  async createProduct(data, audit) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data,
        include: productInclude,
      });

      await createAudit(
        tx,
        audit
          ? {
              ...audit,
              resourceId: product.id,
            }
          : undefined,
      );

      return product;
    });
  },

  async updateProduct(productId, data, audit) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data,
        include: productInclude,
      });

      await createAudit(tx, audit);

      return product;
    });
  },

  async createImage(productId, data, audit) {
    return prisma.$transaction(async (tx) => {
      const image = await tx.productImage.create({
        data: {
          ...data,
          product: { connect: { id: productId } },
        },
      });

      await createAudit(tx, audit);

      return image;
    });
  },

  async createDocument(productId, data, audit) {
    return prisma.$transaction(async (tx) => {
      const document = await tx.productDocument.create({
        data: {
          ...data,
          product: { connect: { id: productId } },
        },
      });

      await createAudit(tx, audit);

      return document;
    });
  },

  listAvailability(productId) {
    return prisma.productAvailabilityPeriod.findMany({
      where: { productId },
      orderBy: { startsAt: "asc" },
    });
  },

  findAvailability(productId, availabilityId) {
    return prisma.productAvailabilityPeriod.findFirst({
      where: { id: availabilityId, productId },
    });
  },

  async createAvailability(productId, data, audit) {
    return prisma.$transaction(async (tx) => {
      const availability = await tx.productAvailabilityPeriod.create({
        data: {
          ...data,
          product: { connect: { id: productId } },
        },
      });

      await createAudit(tx, audit);

      return availability;
    });
  },

  async updateAvailability(availabilityId, data, audit) {
    return prisma.$transaction(async (tx) => {
      const availability = await tx.productAvailabilityPeriod.update({
        where: { id: availabilityId },
        data,
      });

      await createAudit(tx, audit);

      return availability;
    });
  },

  async deleteAvailability(availabilityId, audit) {
    await prisma.$transaction(async (tx) => {
      await tx.productAvailabilityPeriod.delete({
        where: { id: availabilityId },
      });

      await createAudit(tx, audit);
    });
  },
};
