import type { PricingModel } from "./product";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "ACTIVE"
  | "COMPLETED";

export type RentalStatus =
  | "CONFIRMED"
  | "PAID"
  | "ACTIVE"
  | "IN_PROGRESS"
  | "RETURNED"
  | "COMPLETED"
  | "CANCELLED";

export type RentalEvent = {
  id: string;
  eventType: string;
  occurredAt: string;
  notes: string | null;
};

export type Booking = {
  id: string;
  productId: string;
  vendorId: string;
  customerId: string;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  rentalDuration: number;
  pricingModelSnapshot: PricingModel;
  unitPriceSnapshot: string;
  quantity: number;
  rentalSubtotal: string;
  deliveryCharge: string;
  securityDeposit: string;
  promotionalDiscount: string;
  totalAmount: string;
  currency: string;
  cancellationReason: string | null;
  cancelledAt: string | null;
  rejectedReason: string | null;
  rejectedAt: string | null;
  expiresAt: string | null;
  product: {
    id: string;
    name: string;
    pricingModel: PricingModel;
    city: string | null;
    country: string | null;
    imageUrl: string | null;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  };
  vendor: {
    id: string;
    displayName: string;
  };
  customer: {
    id: string;
    displayName: string;
  };
  rental: {
    id: string;
    bookingId: string;
    status: RentalStatus;
    pickupDate: string | null;
    expectedReturnDate: string;
    actualReturnDate: string | null;
    isLateReturn: boolean;
    damageNotes: string | null;
    additionalCharges: string;
    additionalChargeReason: string | null;
    events: RentalEvent[];
    createdAt: string;
    updatedAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateBookingPayload = {
  productId: string;
  startsAt: string;
  endsAt: string;
  quantity: number;
};

export type CompleteRentalPayload = {
  actualReturnDate?: string;
  damageNotes?: string;
  additionalCharges?: string;
  additionalChargeReason?: string;
};
