export interface InvoiceSnapshot {
  customerId: string;
  customerName: string;
  vendorId: string;
  vendorName: string;
  productId: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  rentalDuration: number;
  pricingModel: string;
}

export type InvoiceStatus = "PENDING" | "PAID" | "REFUNDED";

export interface Invoice {
  id: string;
  bookingId: string;
  paymentId: string;
  invoiceNumber: string;
  snapshots: InvoiceSnapshot;
  totalAmount: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}
