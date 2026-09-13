import type { Invoice } from "../types/invoice";
import { apiClient } from "./api-client";

export const invoiceService = {
  async getMyInvoice(invoiceId: string): Promise<{ invoice: Invoice }> {
    const response = await apiClient.get(`/invoices/me/${invoiceId}`);
    return response.data;
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
    const response = await apiClient.get(
      `/invoices/me?page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  async getVendorInvoice(invoiceId: string): Promise<{ invoice: Invoice }> {
    const response = await apiClient.get(`/invoices/vendor/${invoiceId}`);
    return response.data;
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
    const response = await apiClient.get(
      `/invoices/vendor?page=${page}&limit=${limit}`,
    );
    return response.data;
  },
};
