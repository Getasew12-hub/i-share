export type PaymentProvider =
  "CHAPA" | "STRIPE" | "PAYPAL" | "TELEBIRR" | "BANK_TRANSFER" | "OTHER";

export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED";

export interface Payment {
  id: string;
  bookingId: string;
  provider: PaymentProvider;
  methodLabel?: string;
  status: PaymentStatus;
  amount: {
    $numberDecimal: string;
  };
  currency: string;
  createdAt: string;
  updatedAt: string;
}
