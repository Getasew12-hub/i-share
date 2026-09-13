import { type Notification, type NotificationType } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { prisma } from "../src/config/prisma.js";
import { AppError } from "../src/errors/app-error.js";
import { NotificationService } from "../src/services/notification-service.js";

const customerUserId = "20000000-0000-4000-8000-000000000001";
const vendorUserId = "10000000-0000-4000-8000-000000000001";
const customerId = "40000000-0000-4000-8000-000000000001";
const vendorId = "30000000-0000-4000-8000-000000000001";
const bookingId = "80000000-0000-4000-8000-000000000001";

function createNotification(
  overrides: Partial<Notification> = {},
): Notification {
  return {
    id: "notif_001",
    userId: customerUserId,
    type: "BOOKING_REQUEST",
    title: "Booking Created",
    body: "Your booking was created.",
    payload: { bookingId },
    status: "UNREAD",
    readAt: null,
    createdAt: new Date("2026-09-02T00:00:00.000Z"),
    updatedAt: new Date("2026-09-02T00:00:00.000Z"),
    ...overrides,
  };
}

class FakeNotificationRepository {
  notifications: Notification[] = [];

  async create(data: any) {
    const record = {
      id: `notif_${this.notifications.length + 1}`,
      userId: data.user.connect.id,
      type: data.type,
      title: data.title,
      body: data.body,
      payload: data.payload,
      status: data.status,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Notification;

    this.notifications.push(record);
    return record;
  }

  async findById(notificationId: string) {
    return (
      this.notifications.find(
        (notification) => notification.id === notificationId,
      ) ?? null
    );
  }

  async listByUser(userId: string, limit: number, offset: number) {
    const filtered = this.notifications.filter(
      (notification) => notification.userId === userId,
    );
    return {
      notifications: filtered.slice(offset, offset + limit),
      total: filtered.length,
    };
  }

  async countUnread(userId: string) {
    return this.notifications.filter(
      (notification) =>
        notification.userId === userId && notification.status === "UNREAD",
    ).length;
  }

  async markAsRead(notificationId: string) {
    const notification = this.notifications.find(
      (item) => item.id === notificationId,
    );
    if (notification) {
      notification.status = "READ";
      notification.readAt = new Date();
      notification.updatedAt = new Date();
    }
    return notification as Notification;
  }

  async markAllAsRead(userId: string) {
    let count = 0;
    for (const notification of this.notifications) {
      if (notification.userId === userId && notification.status === "UNREAD") {
        notification.status = "READ";
        notification.readAt = new Date();
        notification.updatedAt = new Date();
        count += 1;
      }
    }
    return count;
  }
}

describe("NotificationService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates notifications with the user, type, title, body, and payload", async () => {
    const repository = new FakeNotificationRepository();
    const service = new NotificationService(repository as any);

    const result = await service.createNotification(
      customerUserId,
      "PAYMENT_CONFIRMATION",
      "Payment Successful",
      "Your payment has been processed successfully.",
      { bookingId },
    );

    expect(result.userId).toBe(customerUserId);
    expect(result.type).toBe("PAYMENT_CONFIRMATION");
    expect(result.title).toBe("Payment Successful");
    expect(result.body).toBe("Your payment has been processed successfully.");
    expect(result.payload).toMatchObject({ bookingId });
    expect(result.status).toBe("UNREAD");
  });

  it("gets notifications only for the owning user and lists them with pagination", async () => {
    const repository = new FakeNotificationRepository();
    repository.notifications.push(
      createNotification({ id: "notif_1", userId: customerUserId }),
      createNotification({ id: "notif_2", userId: customerUserId }),
      createNotification({ id: "notif_3", userId: vendorUserId }),
    );
    const service = new NotificationService(repository as any);

    await expect(
      service.getNotification(customerUserId, "notif_1"),
    ).resolves.toMatchObject({
      id: "notif_1",
      userId: customerUserId,
    });

    await expect(
      service.getNotification(vendorUserId, "notif_1"),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "NOTIFICATION_ACCESS_DENIED",
    });

    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: customerUserId,
    } as any);
    await expect(
      service.listMyNotifications(customerUserId, 1, 2),
    ).resolves.toMatchObject({
      pagination: {
        page: 1,
        limit: 2,
        total: 2,
        totalPages: 1,
      },
    });
  });

  it("marks a notification as read and marks all unread notifications as read", async () => {
    const repository = new FakeNotificationRepository();
    repository.notifications.push(
      createNotification({
        id: "notif_1",
        userId: customerUserId,
        status: "UNREAD",
      }),
      createNotification({
        id: "notif_2",
        userId: customerUserId,
        status: "UNREAD",
      }),
      createNotification({
        id: "notif_3",
        userId: vendorUserId,
        status: "UNREAD",
      }),
    );
    const service = new NotificationService(repository as any);

    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: customerUserId,
    } as any);

    await expect(
      service.markNotificationAsRead(customerUserId, "notif_1"),
    ).resolves.toMatchObject({
      id: "notif_1",
      status: "READ",
    });

    await expect(service.markAllAsRead(customerUserId)).resolves.toMatchObject({
      markedAsReadCount: 1,
    });
  });

  it("counts unread notifications by user", async () => {
    const repository = new FakeNotificationRepository();
    repository.notifications.push(
      createNotification({
        id: "notif_1",
        userId: customerUserId,
        status: "UNREAD",
      }),
      createNotification({
        id: "notif_2",
        userId: customerUserId,
        status: "READ",
      }),
      createNotification({
        id: "notif_3",
        userId: vendorUserId,
        status: "UNREAD",
      }),
    );
    const service = new NotificationService(repository as any);

    vi.spyOn(prisma.user, "findUnique").mockResolvedValue({
      id: customerUserId,
    } as any);

    await expect(service.countUnread(customerUserId)).resolves.toMatchObject({
      unreadCount: 1,
    });
  });

  it("creates the expected event notifications with correct payloads", async () => {
    const repository = new FakeNotificationRepository();
    const service = new NotificationService(repository as any);
    const createSpy = vi.spyOn(service, "createNotification");

    vi.spyOn(prisma.customerProfile, "findUnique").mockResolvedValue({
      userId: customerUserId,
    } as any);
    vi.spyOn(prisma.vendorProfile, "findUnique").mockResolvedValue({
      userId: vendorUserId,
    } as any);

    await service.notifyBookingCreated(
      customerId,
      vendorId,
      bookingId,
      "Cordless Drill",
    );
    expect(createSpy).toHaveBeenCalledWith(
      customerUserId,
      "BOOKING_REQUEST",
      "Booking Created",
      'Your booking for "Cordless Drill" has been created.',
      { bookingId },
    );
    expect(createSpy).toHaveBeenCalledWith(
      vendorUserId,
      "BOOKING_REQUEST",
      "New Booking Request",
      'You have received a new booking request for "Cordless Drill".',
      { bookingId },
    );

    createSpy.mockClear();
    await service.notifyPaymentSucceeded(customerId, vendorId, bookingId);
    expect(createSpy).toHaveBeenCalledWith(
      customerUserId,
      "PAYMENT_CONFIRMATION",
      "Payment Successful",
      "Your payment has been processed successfully.",
      { bookingId },
    );
    expect(createSpy).toHaveBeenCalledWith(
      vendorUserId,
      "PAYMENT_CONFIRMATION",
      "Payment Received",
      "Payment has been received for a booking.",
      { bookingId },
    );

    createSpy.mockClear();
    await service.notifyRentalCompleted(customerId, vendorId, bookingId);
    expect(createSpy).toHaveBeenCalledWith(
      customerUserId,
      "RETURN_REMINDER",
      "Rental Completed",
      "Your rental has been completed. Please leave a review!",
      { bookingId },
    );
    expect(createSpy).toHaveBeenCalledWith(
      vendorUserId,
      "RETURN_REMINDER",
      "Rental Completed",
      "A rental has been completed and returned by the customer.",
      { bookingId },
    );
  });
});
