import { randomUUID } from "node:crypto";

import { Prisma, type ProductStatus } from "@prisma/client";

import { AppError } from "../errors/app-error.js";
import type {
  ProductRepository,
  ProductWithRelations,
} from "../repositories/product-repository.js";
import { prismaProductRepository } from "../repositories/product-repository.js";
import type {
  AvailabilityPeriodInput,
  CreateProductInput,
  MarketplaceQueryInput,
  ProductDocumentInput,
  ProductImageInput,
  ProductStatusInput,
  UpdateProductInput,
} from "../schemas/product-schemas.js";
import { checkProductLimit } from "./subscription-service.js";
import { vendorService } from "./vendor-service.js";

type RequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

type ProductLimitCheck = (vendorId: string) => Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}>;

type VerifiedVendorCheck = (user: {
  role: string;
  vendorProfileId?: string;
}) => () => Promise<boolean>;

const vendorManagedTransitions: Record<ProductStatus, ProductStatus[]> = {
  DRAFT: ["DRAFT", "PUBLISHED", "ARCHIVED"],
  PENDING_REVIEW: [],
  PUBLISHED: ["PUBLISHED", "UNPUBLISHED", "ARCHIVED"],
  UNPUBLISHED: ["UNPUBLISHED", "PUBLISHED", "ARCHIVED"],
  SUSPENDED: [],
  ARCHIVED: [],
};

const defaultMarketplaceQuery: MarketplaceQueryInput = {
  page: 1,
  limit: 12,
  sort: "newest",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function decimal(value?: string) {
  return value === undefined ? undefined : new Prisma.Decimal(value);
}

export class ProductService {
  constructor(
    private readonly repository: ProductRepository,
    private readonly productLimitCheck: ProductLimitCheck,
    private readonly verifiedVendorCheck: VerifiedVendorCheck,
  ) {}

  async listCategories() {
    const categories = await this.repository.listActiveCategories();

    return categories.map((category) => ({
      id: category.id,
      parentId: category.parentId,
      name: category.name,
      slug: category.slug,
      status: category.status,
    }));
  }

  async listMyProducts(userId: string) {
    const vendor = await this.requireVendor(userId);
    const products = await this.repository.listVendorProducts(vendor.id);

    return products.map((product) => this.toProductResponse(product, true));
  }

  async getMyProduct(userId: string, productId: string) {
    const product = await this.requireOwnedProduct(userId, productId);

    return this.toProductResponse(product, true);
  }

  async createMyProduct(
    userId: string,
    input: CreateProductInput,
    context: RequestContext,
  ) {
    const vendor = await this.requireVendor(userId);
    await this.requireActiveCategory(input.categoryId);
    await this.requireProductLimit(vendor.id, "create");

    if (input.status === "PUBLISHED") {
      await this.requirePublishEligibility(vendor.id);
    }

    const product = await this.repository.createProduct(
      {
        vendor: { connect: { id: vendor.id } },
        category: { connect: { id: input.categoryId } },
        name: input.name,
        slug: `${slugify(input.name)}-${randomUUID().slice(0, 8)}`,
        description: input.description,
        pricingModel: input.pricingModel,
        hourlyRate: decimal(input.hourlyRate),
        dailyRate: decimal(input.dailyRate),
        weeklyRate: decimal(input.weeklyRate),
        monthlyRate: decimal(input.monthlyRate),
        currency: input.currency,
        securityDeposit: decimal(input.securityDeposit),
        deliveryAvailable: input.deliveryAvailable,
        deliveryCharge: decimal(input.deliveryCharge),
        city: input.city,
        country: input.country,
        specifications: input.specifications as Prisma.InputJsonValue,
        rentalPolicies: input.rentalPolicies as Prisma.InputJsonValue,
        metadata: input.metadata as Prisma.InputJsonValue,
        status: input.status,
        publishedAt: input.status === "PUBLISHED" ? new Date() : undefined,
      },
      {
        actorUserId: userId,
        action: "CREATE",
        resourceType: "Product",
        metadata: {
          event: "product_created",
          requestedStatus: input.status,
        },
        ...context,
      },
    );

    return this.toProductResponse(product, true);
  }

  async updateMyProduct(
    userId: string,
    productId: string,
    input: UpdateProductInput,
    context: RequestContext,
  ) {
    const product = await this.requireOwnedProduct(userId, productId);

    if (product.status === "ARCHIVED") {
      throw new AppError(
        409,
        "PRODUCT_ARCHIVED",
        "Archived products cannot be updated.",
      );
    }

    if (input.categoryId) {
      await this.requireActiveCategory(input.categoryId);
    }

    const updated = await this.repository.updateProduct(
      product.id,
      this.productUpdateData(input),
      {
        actorUserId: userId,
        action: "UPDATE",
        resourceType: "Product",
        resourceId: product.id,
        metadata: {
          event: "product_updated",
        },
        ...context,
      },
    );

    return this.toProductResponse(updated, true);
  }

  async changeMyProductStatus(
    userId: string,
    productId: string,
    input: ProductStatusInput,
    context: RequestContext,
  ) {
    const product = await this.requireOwnedProduct(userId, productId);
    const allowed = vendorManagedTransitions[product.status].includes(
      input.status,
    );

    if (!allowed) {
      throw new AppError(
        409,
        "INVALID_PRODUCT_STATUS_TRANSITION",
        "The requested product status transition is not allowed.",
      );
    }

    if (input.status === "PUBLISHED" && product.status !== "PUBLISHED") {
      await this.requirePublishEligibility(product.vendorId);
    }

    const updated = await this.repository.updateProduct(
      product.id,
      {
        status: input.status,
        publishedAt:
          input.status === "PUBLISHED" && !product.publishedAt
            ? new Date()
            : product.publishedAt,
        archivedAt: input.status === "ARCHIVED" ? new Date() : null,
      },
      {
        actorUserId: userId,
        action: "STATUS_CHANGE",
        resourceType: "Product",
        resourceId: product.id,
        metadata: {
          event: "product_status_changed",
          from: product.status,
          to: input.status,
        },
        ...context,
      },
    );

    return this.toProductResponse(updated, true);
  }

  deactivateMyProduct(
    userId: string,
    productId: string,
    context: RequestContext,
  ) {
    return this.changeMyProductStatus(
      userId,
      productId,
      { status: "ARCHIVED" },
      context,
    );
  }

  async addMyProductImage(
    userId: string,
    productId: string,
    input: ProductImageInput,
    context: RequestContext,
  ) {
    const product = await this.requireOwnedProduct(userId, productId);
    const image = await this.repository.createImage(
      product.id,
      {
        fileName: input.fileName,
        storageKey: input.storageKey,
        url: input.url,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        sortOrder: input.sortOrder,
        altText: input.altText,
        visibility: input.visibility ?? "PUBLIC",
        metadata: input.metadata as Prisma.InputJsonValue,
      },
      {
        actorUserId: userId,
        action: "CREATE",
        resourceType: "ProductImage",
        resourceId: product.id,
        metadata: { event: "product_image_added" },
        ...context,
      },
    );

    return this.toImageResponse(image);
  }

  async addMyProductDocument(
    userId: string,
    productId: string,
    input: ProductDocumentInput,
    context: RequestContext,
  ) {
    const product = await this.requireOwnedProduct(userId, productId);
    const document = await this.repository.createDocument(
      product.id,
      {
        fileName: input.fileName,
        storageKey: input.storageKey,
        url: input.url,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        visibility: input.visibility ?? "PRIVATE",
        metadata: input.metadata as Prisma.InputJsonValue,
      },
      {
        actorUserId: userId,
        action: "CREATE",
        resourceType: "ProductDocument",
        resourceId: product.id,
        metadata: { event: "product_document_added" },
        ...context,
      },
    );

    return this.toDocumentResponse(document);
  }

  async listMyAvailability(userId: string, productId: string) {
    const product = await this.requireOwnedProduct(userId, productId);
    const availability = await this.repository.listAvailability(product.id);

    return availability.map((period) => this.toAvailabilityResponse(period));
  }

  async createMyAvailability(
    userId: string,
    productId: string,
    input: AvailabilityPeriodInput,
    context: RequestContext,
  ) {
    const product = await this.requireOwnedProduct(userId, productId);
    const availability = await this.repository.createAvailability(
      product.id,
      {
        type: input.type,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        reason: input.reason,
      },
      {
        actorUserId: userId,
        action: "CREATE",
        resourceType: "ProductAvailabilityPeriod",
        resourceId: product.id,
        metadata: { event: "product_availability_created" },
        ...context,
      },
    );

    return this.toAvailabilityResponse(availability);
  }

  async updateMyAvailability(
    userId: string,
    productId: string,
    availabilityId: string,
    input: AvailabilityPeriodInput,
    context: RequestContext,
  ) {
    const product = await this.requireOwnedProduct(userId, productId);
    const existing = await this.repository.findAvailability(
      product.id,
      availabilityId,
    );

    if (!existing) {
      throw new AppError(
        404,
        "AVAILABILITY_NOT_FOUND",
        "Availability period not found.",
      );
    }

    const availability = await this.repository.updateAvailability(
      existing.id,
      {
        type: input.type,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        reason: input.reason,
      },
      {
        actorUserId: userId,
        action: "UPDATE",
        resourceType: "ProductAvailabilityPeriod",
        resourceId: existing.id,
        metadata: { event: "product_availability_updated" },
        ...context,
      },
    );

    return this.toAvailabilityResponse(availability);
  }

  async deleteMyAvailability(
    userId: string,
    productId: string,
    availabilityId: string,
    context: RequestContext,
  ) {
    const product = await this.requireOwnedProduct(userId, productId);
    const existing = await this.repository.findAvailability(
      product.id,
      availabilityId,
    );

    if (!existing) {
      throw new AppError(
        404,
        "AVAILABILITY_NOT_FOUND",
        "Availability period not found.",
      );
    }

    await this.repository.deleteAvailability(existing.id, {
      actorUserId: userId,
      action: "DELETE",
      resourceType: "ProductAvailabilityPeriod",
      resourceId: existing.id,
      metadata: { event: "product_availability_deleted" },
      ...context,
    });
  }

  async listPublishedProducts(
    input: MarketplaceQueryInput = defaultMarketplaceQuery,
  ) {
    const result = await this.repository.listPublishedProducts({
      ...input,
      availableOn: input.availableOn ? new Date(input.availableOn) : undefined,
    });
    const totalPages = Math.ceil(result.total / input.limit);

    return {
      products: result.products.map((product) =>
        this.toProductResponse(product, false),
      ),
      pagination: {
        page: input.page,
        limit: input.limit,
        total: result.total,
        totalPages,
        hasNextPage: input.page < totalPages,
        hasPreviousPage: input.page > 1,
      },
    };
  }

  async getPublishedProduct(productId: string) {
    const product = await this.repository.findPublishedProduct(productId);

    if (!product) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    }

    return this.toProductResponse(product, false);
  }

  private async requireVendor(userId: string) {
    const vendor = await this.repository.findVendorByUserId(userId);

    if (!vendor) {
      throw new AppError(
        404,
        "VENDOR_PROFILE_NOT_FOUND",
        "Vendor profile not found.",
      );
    }

    return vendor;
  }

  private async requireOwnedProduct(userId: string, productId: string) {
    const vendor = await this.requireVendor(userId);
    const product = await this.repository.findVendorProduct(
      vendor.id,
      productId,
    );

    if (!product) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found.");
    }

    return product;
  }

  private async requireActiveCategory(categoryId: string) {
    const category = await this.repository.findCategoryById(categoryId);

    if (!category || category.status !== "ACTIVE") {
      throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found.");
    }
  }

  private async requireProductLimit(
    vendorId: string,
    action: "create" | "publish",
  ) {
    const limit = await this.productLimitCheck(vendorId);

    const allowed =
      action === "create" ? limit.allowed : limit.used <= limit.limit;

    if (!allowed) {
      throw new AppError(
        403,
        "PRODUCT_LIMIT_EXCEEDED",
        `Product limit reached for the active subscription (${limit.used}/${limit.limit}).`,
      );
    }
  }

  private async requirePublishEligibility(vendorId: string) {
    const isVerified = await this.verifiedVendorCheck({
      role: "VENDOR",
      vendorProfileId: vendorId,
    })();

    if (!isVerified) {
      throw new AppError(
        403,
        "VENDOR_VERIFICATION_REQUIRED",
        "Approved vendor verification is required before publishing.",
      );
    }

    await this.requireProductLimit(vendorId, "publish");
  }

  private productUpdateData(
    input: UpdateProductInput,
  ): Prisma.ProductUpdateInput {
    return {
      category: input.categoryId
        ? { connect: { id: input.categoryId } }
        : undefined,
      name: input.name,
      description: input.description,
      pricingModel: input.pricingModel,
      hourlyRate: decimal(input.hourlyRate),
      dailyRate: decimal(input.dailyRate),
      weeklyRate: decimal(input.weeklyRate),
      monthlyRate: decimal(input.monthlyRate),
      currency: input.currency,
      securityDeposit: decimal(input.securityDeposit),
      deliveryAvailable: input.deliveryAvailable,
      deliveryCharge: decimal(input.deliveryCharge),
      city: input.city,
      country: input.country,
      specifications: input.specifications as Prisma.InputJsonValue,
      rentalPolicies: input.rentalPolicies as Prisma.InputJsonValue,
      metadata: input.metadata as Prisma.InputJsonValue,
    };
  }

  private toProductResponse(
    product: ProductWithRelations,
    includePrivate: boolean,
  ) {
    return {
      id: product.id,
      ...(includePrivate ? { vendorId: product.vendorId } : {}),
      categoryId: product.categoryId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      pricingModel: product.pricingModel,
      hourlyRate: product.hourlyRate?.toString() ?? null,
      dailyRate: product.dailyRate?.toString() ?? null,
      weeklyRate: product.weeklyRate?.toString() ?? null,
      monthlyRate: product.monthlyRate?.toString() ?? null,
      currency: product.currency,
      securityDeposit: product.securityDeposit.toString(),
      deliveryAvailable: product.deliveryAvailable,
      deliveryCharge: product.deliveryCharge.toString(),
      city: product.city,
      country: product.country,
      specifications: product.specifications,
      rentalPolicies: product.rentalPolicies,
      status: product.status,
      publishedAt: product.publishedAt?.toISOString() ?? null,
      ...(includePrivate
        ? {
            archivedAt: product.archivedAt?.toISOString() ?? null,
            metadata: product.metadata,
          }
        : {}),
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
      vendor: {
        ...(includePrivate ? { id: product.vendor.id } : {}),
        displayName: product.vendor.displayName,
        city: product.vendor.city,
        country: product.vendor.country,
      },
      images: product.images
        .filter((image) => includePrivate || image.visibility === "PUBLIC")
        .map((image) => this.toImageResponse(image, includePrivate)),
      ...(includePrivate
        ? {
            documents: product.documents.map((document) =>
              this.toDocumentResponse(document),
            ),
          }
        : {}),
      availabilityPeriods: product.availabilityPeriods.map((period) =>
        this.toAvailabilityResponse(period),
      ),
      availabilitySummary: this.toAvailabilitySummary(
        product.availabilityPeriods,
      ),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  private toImageResponse(
    image: ProductWithRelations["images"][number],
    includePrivate = true,
  ) {
    return {
      id: image.id,
      productId: image.productId,
      fileName: image.fileName,
      ...(includePrivate
        ? {
            storageKey: image.storageKey,
            metadata: image.metadata,
          }
        : {}),
      url: image.url,
      mimeType: image.mimeType,
      fileSize: image.fileSize,
      sortOrder: image.sortOrder,
      altText: image.altText,
      visibility: image.visibility,
      createdAt: image.createdAt.toISOString(),
    };
  }

  private toDocumentResponse(
    document: ProductWithRelations["documents"][number],
  ) {
    return {
      id: document.id,
      productId: document.productId,
      fileName: document.fileName,
      storageKey: document.storageKey,
      url: document.url,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      visibility: document.visibility,
      metadata: document.metadata,
      createdAt: document.createdAt.toISOString(),
    };
  }

  private toAvailabilityResponse(
    period: ProductWithRelations["availabilityPeriods"][number],
  ) {
    return {
      id: period.id,
      productId: period.productId,
      type: period.type,
      startsAt: period.startsAt.toISOString(),
      endsAt: period.endsAt.toISOString(),
      reason: period.reason,
      createdAt: period.createdAt.toISOString(),
      updatedAt: period.updatedAt.toISOString(),
    };
  }

  private toAvailabilitySummary(
    periods: ProductWithRelations["availabilityPeriods"],
  ) {
    const visiblePeriods = periods.filter((period) =>
      ["AVAILABLE", "MAINTENANCE", "BLOCKED"].includes(period.type),
    );
    const availablePeriods = visiblePeriods.filter(
      (period) => period.type === "AVAILABLE",
    );
    const now = new Date();
    const nextAvailable = availablePeriods.find(
      (period) => period.endsAt > now,
    );

    return {
      hasAvailability: availablePeriods.length > 0,
      nextAvailableAt: nextAvailable?.startsAt.toISOString() ?? null,
      availablePeriods: availablePeriods.length,
      maintenancePeriods: visiblePeriods.filter(
        (period) => period.type === "MAINTENANCE",
      ).length,
      blockedPeriods: visiblePeriods.filter(
        (period) => period.type === "BLOCKED",
      ).length,
    };
  }
}

export const productService = new ProductService(
  prismaProductRepository,
  checkProductLimit,
  vendorService.isVerifiedVendor.bind(vendorService),
);
