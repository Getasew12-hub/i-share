import type { Notification } from "../types/notification";
import { apiClient } from "./api-client";

export const notificationService = {
  async listMyNotifications(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await apiClient.get(
      `/notifications?page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  async getNotification(
    notificationId: string,
  ): Promise<{ notification: Notification }> {
    const response = await apiClient.get(`/notifications/${notificationId}`);
    return response.data;
  },

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await apiClient.get("/notifications/unread-count");
    return response.data;
  },

  async markAsRead(
    notificationId: string,
  ): Promise<{ notification: Notification }> {
    const response = await apiClient.post(
      `/notifications/${notificationId}/read`,
      {},
    );
    return response.data;
  },

  async markAllAsRead(): Promise<{ count: number }> {
    const response = await apiClient.post("/notifications/read-all", {});
    return response.data;
  },
};
