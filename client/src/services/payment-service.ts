import type { Payment, PaymentProvider } from "../types/payment";
import { apiClient } from "./api-client";

export const paymentService = {
  async createBookingPayment(
    bookingId: string,
    input: {
      provider: PaymentProvider;
      methodLabel?: string;
    },
  ): Promise<{ payment: Payment }> {
    const response = await apiClient.post(
      `/payments/bookings/${bookingId}`,
      input,
    );
    return response.data;
  },

  async getMyPayment(paymentId: string): Promise<{ payment: Payment }> {
    const response = await apiClient.get(`/payments/me/${paymentId}`);
    return response.data;
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
    const response = await apiClient.get(
      `/payments/me?page=${page}&limit=${limit}`,
    );
    return response.data;
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
    const response = await apiClient.get(
      `/payments/vendor?page=${page}&limit=${limit}`,
    );
    return response.data;
  },
};
