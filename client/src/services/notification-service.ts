import type { Notification } from "../types/notification";
import { apiClient } from "./api-client";

type Envelope<T> = { data: T };

type NotificationListResult = {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function normalizeNotificationList(result: NotificationListResult) {
  return {
    notifications: result.notifications,
    total: result.pagination.total,
    page: result.pagination.page,
    totalPages: result.pagination.totalPages,
  };
}

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
    const response = await apiClient.get<Envelope<NotificationListResult>>(
      `/notifications?page=${page}&limit=${limit}`,
    );
    return normalizeNotificationList(response.data.data);
  },

  async getNotification(
    notificationId: string,
  ): Promise<{ notification: Notification }> {
    const response = await apiClient.get<
      Envelope<{ notification: Notification }>
    >(`/notifications/${notificationId}`);
    return response.data.data;
  },

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await apiClient.get<Envelope<{ unreadCount: number }>>(
      "/notifications/unread-count",
    );
    return response.data.data;
  },

  async markAsRead(
    notificationId: string,
  ): Promise<{ notification: Notification }> {
    const response = await apiClient.post<
      Envelope<{ notification: Notification }>
    >(
      `/notifications/${notificationId}/read`,
      {},
    );
    return response.data.data;
  },

  async markAllAsRead(): Promise<{ count: number }> {
    const response = await apiClient.post<
      Envelope<{ markedAsReadCount: number }>
    >("/notifications/read-all", {});
    return { count: response.data.data.markedAsReadCount };
  },
};
