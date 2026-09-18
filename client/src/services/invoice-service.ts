import type { Invoice } from "../types/invoice";
import { apiClient } from "./api-client";

type Envelope<T> = { data: T };

type InvoiceListResult = {
  invoices: BackendInvoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type BackendInvoice = {
  id: string;
  bookingId: string;
  paymentId: string;
  invoiceNumber: string;
  status: Invoice["status"];
  customerSnapshot: { id: string; displayName: string; email: string };
  vendorSnapshot: { id: string; displayName: string; email: string };
  productSnapshot: { id: string; name: string; slug: string };
  pricingSnapshot: {
    pricingModel: string;
    unitPrice: string;
    rentalDuration: number;
    rentalSubtotal: string;
    deliveryCharge: string;
    securityDeposit: string;
    promotionalDiscount: string;
    currency: string;
  };
  subtotalAmount: string | { $numberDecimal: string };
  discountAmount: string | { $numberDecimal: string };
  totalAmount: string | { $numberDecimal: string };
  currency: string;
  issuedAt: string;
  createdAt: string;
  updatedAt: string;
};

function decimal(value: string | { $numberDecimal: string }) {
  return typeof value === "string" ? value : value.$numberDecimal;
}

function normalizeInvoice(invoice: BackendInvoice): Invoice {
  return {
    id: invoice.id,
    bookingId: invoice.bookingId,
    paymentId: invoice.paymentId,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    snapshots: {
      customerId: invoice.customerSnapshot.id,
      customerName: invoice.customerSnapshot.displayName,
      vendorId: invoice.vendorSnapshot.id,
      vendorName: invoice.vendorSnapshot.displayName,
      productId: invoice.productSnapshot.id,
      productName: invoice.productSnapshot.name,
      unitPrice: invoice.pricingSnapshot.unitPrice,
      quantity: 1,
      rentalDuration: invoice.pricingSnapshot.rentalDuration,
      pricingModel: invoice.pricingSnapshot.pricingModel,
    },
    subtotalAmount: decimal(invoice.subtotalAmount),
    discountAmount: decimal(invoice.discountAmount),
    totalAmount: decimal(invoice.totalAmount),
    currency: invoice.currency,
    issuedAt: invoice.issuedAt,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
}

function normalizeInvoiceList(result: InvoiceListResult) {
  return {
    invoices: result.invoices.map(normalizeInvoice),
    total: result.pagination.total,
    page: result.pagination.page,
    totalPages: result.pagination.totalPages,
  };
}

export const invoiceService = {
  async getMyInvoice(invoiceId: string): Promise<{ invoice: Invoice }> {
    const response = await apiClient.get<Envelope<{ invoice: BackendInvoice }>>(
      `/invoices/me/${invoiceId}`,
    );
    return { invoice: normalizeInvoice(response.data.data.invoice) };
  },

  async listMyInvoices(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    invoices: Invoice[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await apiClient.get<Envelope<InvoiceListResult>>(
      `/invoices/me?page=${page}&limit=${limit}`,
    );
    return normalizeInvoiceList(response.data.data);
  },

  async getVendorInvoice(invoiceId: string): Promise<{ invoice: Invoice }> {
    const response = await apiClient.get<Envelope<{ invoice: BackendInvoice }>>(
      `/invoices/vendor/${invoiceId}`,
    );
    return { invoice: normalizeInvoice(response.data.data.invoice) };
  },

  async listVendorInvoices(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    invoices: Invoice[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await apiClient.get<Envelope<InvoiceListResult>>(
      `/invoices/vendor?page=${page}&limit=${limit}`,
    );
    return normalizeInvoiceList(response.data.data);
  },
};
