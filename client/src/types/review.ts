export type ReviewStatus = "PENDING" | "PUBLISHED";

export interface Review {
  id: string;
  rentalId: string;
  productId: string;
  vendorId: string;
  customerId: string;
  rating: number;
  comment?: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}
