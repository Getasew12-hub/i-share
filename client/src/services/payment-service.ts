import type { Payment, PaymentProvider } from "../types/payment";
import { apiClient } from "./api-client";

type Envelope<T> = { data: T };

type PaymentListResult = {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

function normalizePaymentList(result: PaymentListResult) {
  return {
    payments: result.payments,
    total: result.pagination.total,
    page: result.pagination.page,
    totalPages: result.pagination.pages,
  };
}

export const paymentService = {
  async createBookingPayment(
    bookingId: string,
    input: {
      provider: PaymentProvider;
      methodLabel?: string;
    },
  ): Promise<{ payment: Payment }> {
    const response = await apiClient.post<Envelope<{ payment: Payment }>>(
      `/payments/bookings/${bookingId}`,
      { bookingId, ...input },
    );
    return response.data.data;
  },

  async getMyPayment(paymentId: string): Promise<{ payment: Payment }> {
    const response = await apiClient.get<Envelope<{ payment: Payment }>>(
      `/payments/me/${paymentId}`,
    );
    return response.data.data;
  },

  async listMyPayments(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await apiClient.get<Envelope<PaymentListResult>>(
      `/payments/me?page=${page}&limit=${limit}`,
    );
    return normalizePaymentList(response.data.data);
  },

  async listVendorPayments(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await apiClient.get<Envelope<PaymentListResult>>(
      `/payments/vendor?page=${page}&limit=${limit}`,
    );
    return normalizePaymentList(response.data.data);
  },
};
