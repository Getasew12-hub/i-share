export type ReviewStatus = "PENDING" | "PUBLISHED" | "HIDDEN" | "REPORTED";

export interface Review {
  id: string;
  rentalId: string;
  productId: string;
  vendorId: string;
  customerId: string;
  rating: number;
  comment?: string;
  customer?: { id: string; displayName: string };
  product?: { id: string; name: string };
  vendor?: { id: string; displayName: string };
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}
