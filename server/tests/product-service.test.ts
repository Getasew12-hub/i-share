import {
  Prisma,
  type Category,
  type ProductDocument,
  type ProductImage,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import type {
  MarketplaceProductFilters,
  ProductRepository,
  ProductWithRelations,
} from "../src/repositories/product-repository.js";
import { ProductService } from "../src/services/product-service.js";
import {
  availabilityPeriodSchema,
  createProductSchema,
  marketplaceQuerySchema,
} from "../src/schemas/product-schemas.js";

const now = new Date("2026-09-01T10:00:00.000Z");
const vendorId = "30000000-0000-4000-8000-000000000001";
const otherVendorId = "30000000-0000-4000-8000-000000000002";
const userId = "40000000-0000-4000-8000-000000000001";
const otherUserId = "40000000-0000-4000-8000-000000000002";
const categoryId = "50000000-0000-4000-8000-000000000001";
type VendorLookup = NonNullable<
  Awaited<ReturnType<ProductRepository["findVendorByUserId"]>>
>;

function decimal(value: string) {
  return new Prisma.Decimal(value);
}

function category(overrides: Partial<Category> = {}): Category {
  return {
    id: categoryId,
    parentId: null,
    name: "Tools",
    slug: "tools",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function product(
  overrides: Partial<ProductWithRelations> = {},
): ProductWithRelations {
  return {
    id: "60000000-0000-4000-8000-000000000001",
    vendorId,
    categoryId,
    name: "Cordless Drill",
    slug: "cordless-drill",
    description: "A reliable cordless drill for rentals.",
    pricingModel: "DAILY",
    hourlyRate: null,
    dailyRate: decimal("15.00"),
    weeklyRate: null,
    monthlyRate: null,
    currency: "USD",
    securityDeposit: decimal("50.00"),
    deliveryAvailable: false,
    deliveryCharge: decimal("0.00"),
    city: "Addis Ababa",
    country: "ET",
    specifications: null,
    rentalPolicies: null,
    metadata: null,
    status: "DRAFT",
    publishedAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    category: category(),
    vendor: {
      id: vendorId,
      displayName: "Tool Vendor",
      verificationStatus: "APPROVED",
      status: "APPROVED",
      city: "Addis Ababa",
      country: "ET",
    },
    images: [],
    documents: [],
    availabilityPeriods: [],
    ...overrides,
  };
}

function basePrice(item: ProductWithRelations) {
  return Number(
    item.hourlyRate ??
      item.dailyRate ??
      item.weeklyRate ??
      item.monthlyRate ??
      0,
  );
}

class FakeProductRepository implements ProductRepository {
  vendors = new Map<string, VendorLookup>([
    [
      userId,
      { id: vendorId, verificationStatus: "APPROVED", status: "APPROVED" },
    ],
    [
      otherUserId,
      {
        id: otherVendorId,
        verificationStatus: "APPROVED",
        status: "APPROVED",
      },
    ],
  ]);
  categories = new Map([[categoryId, category()]]);
  products = new Map<string, ProductWithRelations>();
  availability = new Map<
    string,
    ProductWithRelations["availabilityPeriods"][number]
  >();

  async findVendorByUserId(id: string) {
    return this.vendors.get(id) ?? null;
  }

  async findCategoryById(id: string) {
    return this.categories.get(id) ?? null;
  }

  async listActiveCategories() {
    return [...this.categories.values()].filter(
      (item) => item.status === "ACTIVE",
    );
  }

  async listVendorProducts(id: string) {
    return [...this.products.values()].filter((item) => item.vendorId === id);
  }

  async listPublishedProducts(filters: MarketplaceProductFilters) {
    const availableOn = filters.availableOn?.getTime();
    const filtered = [...this.products.values()].filter(
      (item) => item.status === "PUBLISHED",
    );

    const products = filtered
      .filter((item) => {
        const query = filters.query?.toLowerCase();

        if (!query) {
          return true;
        }

        return [item.name, item.description, item.category.name].some((value) =>
          value.toLowerCase().includes(query),
        );
      })
      .filter((item) => {
        if (!filters.category) {
          return true;
        }

        return (
          item.categoryId === filters.category ||
          item.category.slug === filters.category
        );
      })
      .filter((item) => {
        if (!filters.location) {
          return true;
        }

        const location = filters.location.toLowerCase();

        return [item.city, item.country].some((value) =>
          (value ?? "").toLowerCase().includes(location),
        );
      })
      .filter((item) => {
        const price = basePrice(item);

        return (
          (filters.minPrice === undefined || price >= filters.minPrice) &&
          (filters.maxPrice === undefined || price <= filters.maxPrice)
        );
      })
      .filter((item) => {
        if (availableOn === undefined) {
          return true;
        }

        const isAvailable = item.availabilityPeriods.some(
          (period) =>
            period.type === "AVAILABLE" &&
            period.startsAt.getTime() <= availableOn &&
            period.endsAt.getTime() > availableOn,
        );
        const isBlocked = item.availabilityPeriods.some(
          (period) =>
            period.type !== "AVAILABLE" &&
            period.startsAt.getTime() <= availableOn &&
            period.endsAt.getTime() > availableOn,
        );

        return isAvailable && !isBlocked;
      })
      .sort((first, second) => {
        if (filters.sort === "name_asc") {
          return first.name.localeCompare(second.name);
        }

        if (filters.sort === "name_desc") {
          return second.name.localeCompare(first.name);
        }

        return (
          (second.publishedAt?.getTime() ?? 0) -
          (first.publishedAt?.getTime() ?? 0)
        );
      });
    const start = (filters.page - 1) * filters.limit;

    return {
      products: products.slice(start, start + filters.limit),
      total: products.length,
    };
  }

  async findVendorProduct(id: string, productId: string) {
    const item = this.products.get(productId);

    return item?.vendorId === id ? item : null;
  }

  async findPublishedProduct(productId: string) {
    const item = this.products.get(productId);

    return item?.status === "PUBLISHED" ? item : null;
  }

  async createProduct(data: Prisma.ProductCreateInput) {
    const item = product({
      id: `60000000-0000-4000-8000-00000000000${this.products.size + 1}`,
      vendorId: data.vendor.connect!.id!,
      categoryId: data.category.connect!.id!,
      name: data.name,
      slug: data.slug,
      description: data.description,
      pricingModel: data.pricingModel,
      dailyRate: data.dailyRate as Prisma.Decimal,
      status: data.status ?? "DRAFT",
      publishedAt: data.publishedAt as Date | null,
    });
    this.products.set(item.id, item);

    return item;
  }

  async updateProduct(productId: string, data: Prisma.ProductUpdateInput) {
    const item = this.products.get(productId)!;
    const updated = {
      ...item,
      name: typeof data.name === "string" ? data.name : item.name,
      status: (data.status ?? item.status) as ProductWithRelations["status"],
      publishedAt:
        data.publishedAt instanceof Date ? data.publishedAt : item.publishedAt,
      archivedAt:
        data.archivedAt instanceof Date || data.archivedAt === null
          ? data.archivedAt
          : item.archivedAt,
      updatedAt: now,
    };
    this.products.set(productId, updated);

    return updated;
  }

  async createImage(): Promise<ProductImage> {
    throw new Error("Not needed for this test.");
  }

  async createDocument(): Promise<ProductDocument> {
    throw new Error("Not needed for this test.");
  }

  async listAvailability(productId: string) {
    return [...this.availability.values()].filter(
      (item) => item.productId === productId,
    );
  }

  async findAvailability(productId: string, availabilityId: string) {
    const item = this.availability.get(availabilityId);

    return item?.productId === productId ? item : null;
  }

  async createAvailability(
    productId: string,
    data: Prisma.ProductAvailabilityPeriodCreateWithoutProductInput,
  ) {
    const item = {
      id: `70000000-0000-4000-8000-00000000000${this.availability.size + 1}`,
      productId,
      type: data.type,
      startsAt: data.startsAt as Date,
      endsAt: data.endsAt as Date,
      reason: data.reason ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.availability.set(item.id, item);

    return item;
  }

  async updateAvailability(
    availabilityId: string,
    data: Prisma.ProductAvailabilityPeriodUpdateInput,
  ) {
    const item = this.availability.get(availabilityId)!;
    const updated = {
      ...item,
      type: (data.type ?? item.type) as typeof item.type,
      startsAt: data.startsAt instanceof Date ? data.startsAt : item.startsAt,
      endsAt: data.endsAt instanceof Date ? data.endsAt : item.endsAt,
      reason: typeof data.reason === "string" ? data.reason : item.reason,
      updatedAt: now,
    };
    this.availability.set(availabilityId, updated);

    return updated;
  }

  async deleteAvailability(availabilityId: string) {
    this.availability.delete(availabilityId);
  }
}

function validProductInput() {
  return {
    categoryId,
    name: "Cordless Drill",
    description: "A reliable cordless drill for rentals.",
    pricingModel: "DAILY" as const,
    dailyRate: "15",
    currency: "USD",
    securityDeposit: "50",
    deliveryAvailable: false,
    deliveryCharge: "0",
    city: "Addis Ababa",
    country: "ET",
    status: "DRAFT" as const,
  };
}

function createService(
  options: { verified?: boolean; used?: number; limit?: number } = {},
) {
  const repository = new FakeProductRepository();
  const used = options.used ?? 0;
  const limit = options.limit ?? 2;
  const service = new ProductService(
    repository,
    async () => ({ allowed: used < limit, used, limit }),
    () => async () => options.verified ?? true,
  );

  return { repository, service };
}

describe("ProductService", () => {
  it("lets a vendor create and update their own product", async () => {
    const { repository, service } = createService();

    const created = await service.createMyProduct(
      userId,
      validProductInput(),
      {},
    );
    const updated = await service.updateMyProduct(
      userId,
      created.id,
      { name: "Updated Drill" },
      {},
    );

    expect(repository.products.size).toBe(1);
    expect(updated.name).toBe("Updated Drill");
  });

  it("rejects customers or users without vendor profiles", async () => {
    const { service } = createService();

    await expect(
      service.createMyProduct("customer-user", validProductInput(), {}),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "VENDOR_PROFILE_NOT_FOUND",
    });
  });

  it("prevents a vendor from modifying another vendor product", async () => {
    const { repository, service } = createService();
    const item = product({ vendorId: otherVendorId });
    repository.products.set(item.id, item);

    await expect(
      service.updateMyProduct(userId, item.id, { name: "Nope" }, {}),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "PRODUCT_NOT_FOUND",
    });
  });

  it("blocks publishing for unverified vendors and inactive subscriptions", async () => {
    const unverified = createService({ verified: false });
    const noSubscription = createService({ verified: true, used: 2, limit: 2 });
    const item = product();
    unverified.repository.products.set(item.id, item);
    noSubscription.repository.products.set(item.id, item);

    await expect(
      unverified.service.changeMyProductStatus(
        userId,
        item.id,
        {
          status: "PUBLISHED",
        },
        {},
      ),
    ).rejects.toMatchObject({ code: "VENDOR_VERIFICATION_REQUIRED" });
    await expect(
      noSubscription.service.createMyProduct(userId, validProductInput(), {}),
    ).rejects.toMatchObject({ code: "PRODUCT_LIMIT_EXCEEDED" });
  });

  it("allows publishing an existing draft when it is within the plan limit", async () => {
    const { repository, service } = createService({ used: 1, limit: 1 });
    const item = product();
    repository.products.set(item.id, item);

    const published = await service.changeMyProductStatus(
      userId,
      item.id,
      { status: "PUBLISHED" },
      {},
    );

    expect(published.status).toBe("PUBLISHED");
  });

  it("rejects invalid product data and invalid status transitions", async () => {
    const { repository, service } = createService();
    const item = product({ status: "ARCHIVED" });
    repository.products.set(item.id, item);

    expect(
      createProductSchema.safeParse({
        ...validProductInput(),
        dailyRate: undefined,
      }).success,
    ).toBe(false);
    await expect(
      service.changeMyProductStatus(
        userId,
        item.id,
        { status: "PUBLISHED" },
        {},
      ),
    ).rejects.toMatchObject({ code: "INVALID_PRODUCT_STATUS_TRANSITION" });
  });

  it("archives products as deactivation", async () => {
    const { repository, service } = createService();
    const item = product({ status: "PUBLISHED" });
    repository.products.set(item.id, item);

    const archived = await service.deactivateMyProduct(userId, item.id, {});

    expect(archived.status).toBe("ARCHIVED");
    expect(archived.archivedAt).not.toBeNull();
  });

  it("creates and updates availability for owned products", async () => {
    const { repository, service } = createService();
    const item = product();
    repository.products.set(item.id, item);

    const created = await service.createMyAvailability(
      userId,
      item.id,
      {
        type: "AVAILABLE",
        startsAt: "2026-09-10T00:00:00.000Z",
        endsAt: "2026-09-11T00:00:00.000Z",
      },
      {},
    );
    const updated = await service.updateMyAvailability(
      userId,
      item.id,
      created.id,
      {
        type: "BLOCKED",
        startsAt: "2026-09-12T00:00:00.000Z",
        endsAt: "2026-09-13T00:00:00.000Z",
        reason: "Maintenance",
      },
      {},
    );

    expect(updated.type).toBe("BLOCKED");
    expect(updated.reason).toBe("Maintenance");
  });

  it("rejects invalid availability dates and cross-vendor availability changes", async () => {
    const { repository, service } = createService();
    const item = product({ vendorId: otherVendorId });
    repository.products.set(item.id, item);

    expect(
      availabilityPeriodSchema.safeParse({
        type: "AVAILABLE",
        startsAt: "2026-09-11T00:00:00.000Z",
        endsAt: "2026-09-10T00:00:00.000Z",
      }).success,
    ).toBe(false);
    await expect(
      service.createMyAvailability(
        userId,
        item.id,
        {
          type: "AVAILABLE",
          startsAt: "2026-09-10T00:00:00.000Z",
          endsAt: "2026-09-11T00:00:00.000Z",
        },
        {},
      ),
    ).rejects.toMatchObject({ code: "PRODUCT_NOT_FOUND" });
  });

  it("exposes only published products publicly", async () => {
    const { repository, service } = createService();
    const draft = product({ id: "60000000-0000-4000-8000-000000000009" });
    const published = product({
      id: "60000000-0000-4000-8000-000000000010",
      status: "PUBLISHED",
      publishedAt: now,
    });
    repository.products.set(draft.id, draft);
    repository.products.set(published.id, published);

    await expect(service.listPublishedProducts()).resolves.toMatchObject({
      products: [{ id: published.id, status: "PUBLISHED" }],
      pagination: { total: 1 },
    });
    await expect(service.getPublishedProduct(draft.id)).rejects.toMatchObject({
      code: "PRODUCT_NOT_FOUND",
    });
    await expect(
      service.getPublishedProduct(published.id),
    ).resolves.toMatchObject({
      id: published.id,
      status: "PUBLISHED",
    });
  });

  it("searches and filters published marketplace products", async () => {
    const { repository, service } = createService();
    const tools = product({
      id: "60000000-0000-4000-8000-000000000011",
      name: "Cordless Drill",
      status: "PUBLISHED",
      publishedAt: new Date("2026-09-03T00:00:00.000Z"),
      dailyRate: decimal("15.00"),
      city: "Addis Ababa",
      category: category({ slug: "tools", name: "Tools" }),
    });
    const audio = product({
      id: "60000000-0000-4000-8000-000000000012",
      name: "Portable Speaker",
      status: "PUBLISHED",
      publishedAt: new Date("2026-09-02T00:00:00.000Z"),
      dailyRate: decimal("40.00"),
      city: "Adama",
      categoryId: "50000000-0000-4000-8000-000000000002",
      category: category({
        id: "50000000-0000-4000-8000-000000000002",
        slug: "audio",
        name: "Audio",
      }),
    });
    repository.products.set(tools.id, tools);
    repository.products.set(audio.id, audio);

    await expect(
      service.listPublishedProducts({
        query: "drill",
        category: "tools",
        minPrice: 10,
        maxPrice: 20,
        location: "addis",
        page: 1,
        limit: 12,
        sort: "newest",
      }),
    ).resolves.toMatchObject({
      products: [{ id: tools.id }],
      pagination: { total: 1, page: 1, limit: 12, totalPages: 1 },
    });
  });

  it("sorts and paginates marketplace products", async () => {
    const { repository, service } = createService();
    const camera = product({
      id: "60000000-0000-4000-8000-000000000013",
      name: "Camera",
      status: "PUBLISHED",
      publishedAt: new Date("2026-09-03T00:00:00.000Z"),
    });
    const bike = product({
      id: "60000000-0000-4000-8000-000000000014",
      name: "Bike",
      status: "PUBLISHED",
      publishedAt: new Date("2026-09-04T00:00:00.000Z"),
    });
    const awning = product({
      id: "60000000-0000-4000-8000-000000000015",
      name: "Awning",
      status: "PUBLISHED",
      publishedAt: new Date("2026-09-05T00:00:00.000Z"),
    });
    [camera, bike, awning].forEach((item) =>
      repository.products.set(item.id, item),
    );

    const result = await service.listPublishedProducts({
      page: 2,
      limit: 1,
      sort: "name_asc",
    });

    expect(result.products.map((item) => item.name)).toEqual(["Bike"]);
    expect(result.pagination).toMatchObject({
      page: 2,
      limit: 1,
      total: 3,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it("filters marketplace products by available date", async () => {
    const { repository, service } = createService();
    const available = product({
      id: "60000000-0000-4000-8000-000000000016",
      status: "PUBLISHED",
      availabilityPeriods: [
        {
          id: "70000000-0000-4000-8000-000000000016",
          productId: "60000000-0000-4000-8000-000000000016",
          type: "AVAILABLE",
          startsAt: new Date("2026-09-10T00:00:00.000Z"),
          endsAt: new Date("2026-09-12T00:00:00.000Z"),
          reason: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });
    const blocked = product({
      id: "60000000-0000-4000-8000-000000000017",
      status: "PUBLISHED",
      availabilityPeriods: [
        {
          id: "70000000-0000-4000-8000-000000000017",
          productId: "60000000-0000-4000-8000-000000000017",
          type: "AVAILABLE",
          startsAt: new Date("2026-09-10T00:00:00.000Z"),
          endsAt: new Date("2026-09-12T00:00:00.000Z"),
          reason: null,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "70000000-0000-4000-8000-000000000018",
          productId: "60000000-0000-4000-8000-000000000017",
          type: "BLOCKED",
          startsAt: new Date("2026-09-11T00:00:00.000Z"),
          endsAt: new Date("2026-09-11T12:00:00.000Z"),
          reason: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });
    repository.products.set(available.id, available);
    repository.products.set(blocked.id, blocked);

    await expect(
      service.listPublishedProducts({
        availableOn: "2026-09-11T06:00:00.000Z",
        page: 1,
        limit: 12,
        sort: "newest",
      }),
    ).resolves.toMatchObject({
      products: [{ id: available.id }],
      pagination: { total: 1 },
    });
  });

  it("rejects invalid marketplace query parameters", () => {
    expect(
      marketplaceQuerySchema.safeParse({
        minPrice: "50",
        maxPrice: "10",
      }).success,
    ).toBe(false);
    expect(marketplaceQuerySchema.safeParse({ limit: "500" }).success).toBe(
      false,
    );
    expect(marketplaceQuerySchema.safeParse({ sort: "price" }).success).toBe(
      false,
    );
  });

  it("does not expose private marketplace product fields", async () => {
    const { repository, service } = createService();
    const item = product({
      status: "PUBLISHED",
      metadata: { internalScore: 10 },
      images: [
        {
          id: "80000000-0000-4000-8000-000000000001",
          productId: "60000000-0000-4000-8000-000000000001",
          fileName: "drill.jpg",
          storageKey: "private/storage/key.jpg",
          url: "https://example.com/drill.jpg",
          mimeType: "image/jpeg",
          fileSize: 1024,
          sortOrder: 0,
          altText: null,
          visibility: "PUBLIC",
          metadata: { internal: true },
          createdAt: now,
        },
      ],
      documents: [
        {
          id: "90000000-0000-4000-8000-000000000001",
          productId: "60000000-0000-4000-8000-000000000001",
          fileName: "manual.pdf",
          storageKey: "private/manual.pdf",
          url: null,
          mimeType: "application/pdf",
          fileSize: 2048,
          visibility: "PRIVATE",
          metadata: null,
          createdAt: now,
        },
      ],
    });
    repository.products.set(item.id, item);

    const detail = await service.getPublishedProduct(item.id);

    expect(detail.vendor).not.toHaveProperty("id");
    expect(detail).not.toHaveProperty("vendorId");
    expect(detail).not.toHaveProperty("documents");
    expect(detail).not.toHaveProperty("metadata");
    expect(detail.images[0]).not.toHaveProperty("storageKey");
    expect(detail.images[0]).not.toHaveProperty("metadata");
  });

  it("returns an empty marketplace result for unmatched searches", async () => {
    const { repository, service } = createService();
    const item = product({ status: "PUBLISHED" });
    repository.products.set(item.id, item);

    await expect(
      service.listPublishedProducts({
        query: "tractor",
        page: 1,
        limit: 12,
        sort: "newest",
      }),
    ).resolves.toMatchObject({
      products: [],
      pagination: { total: 0, totalPages: 0, hasNextPage: false },
    });
  });
});
