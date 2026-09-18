export type NotificationType =
  | "ACCOUNT_VERIFICATION"
  | "BOOKING_REQUEST"
  | "BOOKING_APPROVAL"
  | "BOOKING_REJECTION"
  | "PAYMENT_CONFIRMATION"
  | "RENTAL_REMINDER"
  | "RETURN_REMINDER"
  | "SUBSCRIPTION_EXPIRATION"
  | "NEW_MESSAGE"
  | "SYSTEM_ANNOUNCEMENT";

export type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  body: string | null;
  payload?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
