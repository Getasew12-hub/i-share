export type PaymentProvider =
  "CHAPA" | "STRIPE" | "PAYPAL" | "TELEBIRR" | "BANK_TRANSFER" | "OTHER";

export type PaymentStatus =
  | "PENDING"
  | "REQUIRES_ACTION"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type DecimalValue = string | number | { $numberDecimal: string };

export interface Payment {
  id: string;
  bookingId: string;
  provider: PaymentProvider;
  methodLabel?: string;
  status: PaymentStatus;
  amount: DecimalValue;
  currency: string;
  createdAt: string;
  updatedAt: string;
}
