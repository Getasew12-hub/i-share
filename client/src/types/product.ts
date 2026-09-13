export type PricingModel = "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY";
export type ProductStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "SUSPENDED"
  | "ARCHIVED";
export type AvailabilityPeriodType =
  "AVAILABLE" | "RESERVED" | "MAINTENANCE" | "BLOCKED";

export type Category = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  status: string;
};

export type ProductImage = {
  id: string;
  productId: string;
  fileName: string;
  storageKey?: string;
  url: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  altText: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export type ProductDocument = {
  id: string;
  productId: string;
  fileName: string;
  storageKey: string;
  url: string | null;
  mimeType: string;
  fileSize: number;
  visibility: "PUBLIC" | "PRIVATE";
  createdAt: string;
};

export type AvailabilityPeriod = {
  id: string;
  productId: string;
  type: AvailabilityPeriodType;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  vendorId?: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  pricingModel: PricingModel;
  hourlyRate: string | null;
  dailyRate: string | null;
  weeklyRate: string | null;
  monthlyRate: string | null;
  currency: string;
  securityDeposit: string;
  deliveryAvailable: boolean;
  deliveryCharge: string;
  city: string | null;
  country: string | null;
  status: ProductStatus;
  publishedAt: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  vendor: {
    id?: string;
    displayName: string;
    city: string | null;
    country: string | null;
  };
  images: ProductImage[];
  documents?: ProductDocument[];
  availabilityPeriods: AvailabilityPeriod[];
  availabilitySummary: {
    hasAvailability: boolean;
    nextAvailableAt: string | null;
    availablePeriods: number;
    maintenancePeriods: number;
    blockedPeriods: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type MarketplaceSort = "newest" | "name_asc" | "name_desc";

export type MarketplaceFilters = {
  query?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  location?: string;
  availableOn?: string;
  page?: number;
  limit?: number;
  sort?: MarketplaceSort;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type MarketplaceProductsResult = {
  products: Product[];
  pagination: Pagination;
};

export type ProductPayload = {
  categoryId: string;
  name: string;
  description: string;
  pricingModel: PricingModel;
  hourlyRate?: string;
  dailyRate?: string;
  weeklyRate?: string;
  monthlyRate?: string;
  currency: string;
  securityDeposit: string;
  deliveryAvailable: boolean;
  deliveryCharge: string;
  city?: string;
  country?: string;
  status?: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
};

export type AvailabilityPayload = {
  type: "AVAILABLE" | "MAINTENANCE" | "BLOCKED";
  startsAt: string;
  endsAt: string;
  reason?: string;
};
