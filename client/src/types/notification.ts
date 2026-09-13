export type NotificationType =
  | "BOOKING_CREATED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_REJECTED"
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "RENTAL_STARTED"
  | "RENTAL_COMPLETED";

export type NotificationStatus = "UNREAD" | "READ";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  body: string;
  payload?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
