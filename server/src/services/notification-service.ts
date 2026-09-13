import type { NotificationType } from "@prisma/client";

import { AppError } from "../errors/app-error.js";
import type { NotificationRepository } from "../repositories/notification-repository.js";
import { prismaNotificationRepository } from "../repositories/notification-repository.js";
import { prisma } from "../config/prisma.js";

export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string,
    payload?: Record<string, unknown>,
  ) {
    const notification = await this.notificationRepository.create({
      user: { connect: { id: userId } },
      type,
      title,
      body: body || null,
      payload: payload || null,
      status: "UNREAD",
    });

    return notification;
  }

  async getNotification(userId: string, notificationId: string) {
    const notification =
      await this.notificationRepository.findById(notificationId);

    if (!notification) {
      throw new AppError(
        404,
        "NOTIFICATION_NOT_FOUND",
        "Notification not found.",
      );
    }

    if (notification.userId !== userId) {
      throw new AppError(
        403,
        "NOTIFICATION_ACCESS_DENIED",
        "You do not have access to this notification.",
      );
    }

    return notification;
  }

  async listMyNotifications(userId: string, page: number, limit: number) {
    await this.requireUser(userId);

    const offset = (page - 1) * limit;
    const { notifications, total } =
      await this.notificationRepository.listByUser(userId, limit, offset);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    await this.getNotification(userId, notificationId);

    const notification =
      await this.notificationRepository.markAsRead(notificationId);

    return notification;
  }

  async markAllAsRead(userId: string) {
    await this.requireUser(userId);

    const count = await this.notificationRepository.markAllAsRead(userId);

    return { markedAsReadCount: count };
  }

  async countUnread(userId: string) {
    await this.requireUser(userId);

    const count = await this.notificationRepository.countUnread(userId);

    return { unreadCount: count };
  }

  async notifyBookingCreated(
    customerId: string,
    vendorId: string,
    bookingId: string,
    productName: string,
  ) {
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      select: { userId: true },
    });

    if (customer) {
      await this.createNotification(
        customer.userId,
        "BOOKING_REQUEST",
        "Booking Created",
        `Your booking for "${productName}" has been created.`,
        { bookingId },
      );
    }

    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      select: { userId: true },
    });

    if (vendor) {
      await this.createNotification(
        vendor.userId,
        "BOOKING_REQUEST",
        "New Booking Request",
        `You have received a new booking request for "${productName}".`,
        { bookingId },
      );
    }
  }

  async notifyBookingConfirmed(customerId: string, bookingId: string) {
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      select: { userId: true },
    });

    if (customer) {
      await this.createNotification(
        customer.userId,
        "BOOKING_APPROVAL",
        "Booking Confirmed",
        "Your booking has been confirmed by the vendor.",
        { bookingId },
      );
    }
  }

  async notifyBookingRejected(
    customerId: string,
    bookingId: string,
    reason?: string,
  ) {
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      select: { userId: true },
    });

    if (customer) {
      const body = reason
        ? `Your booking has been rejected: ${reason}`
        : "Your booking has been rejected by the vendor.";

      await this.createNotification(
        customer.userId,
        "BOOKING_REJECTION",
        "Booking Rejected",
        body,
        { bookingId, reason },
      );
    }
  }

  async notifyPaymentSucceeded(
    customerId: string,
    vendorId: string,
    bookingId: string,
  ) {
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      select: { userId: true },
    });

    if (customer) {
      await this.createNotification(
        customer.userId,
        "PAYMENT_CONFIRMATION",
        "Payment Successful",
        "Your payment has been processed successfully.",
        { bookingId },
      );
    }

    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      select: { userId: true },
    });

    if (vendor) {
      await this.createNotification(
        vendor.userId,
        "PAYMENT_CONFIRMATION",
        "Payment Received",
        "Payment has been received for a booking.",
        { bookingId },
      );
    }
  }

  async notifyPaymentFailed(
    customerId: string,
    bookingId: string,
    reason?: string,
  ) {
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      select: { userId: true },
    });

    if (customer) {
      const body = reason
        ? `Payment failed: ${reason}`
        : "Your payment could not be processed. Please try again.";

      await this.createNotification(
        customer.userId,
        "PAYMENT_CONFIRMATION",
        "Payment Failed",
        body,
        { bookingId, reason },
      );
    }
  }

  async notifyRentalStarted(
    customerId: string,
    vendorId: string,
    bookingId: string,
  ) {
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      select: { userId: true },
    });

    if (customer) {
      await this.createNotification(
        customer.userId,
        "RENTAL_REMINDER",
        "Rental Started",
        "Your rental has started. Enjoy your experience!",
        { bookingId },
      );
    }

    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      select: { userId: true },
    });

    if (vendor) {
      await this.createNotification(
        vendor.userId,
        "RENTAL_REMINDER",
        "Rental Started",
        "A rental has been started by the customer.",
        { bookingId },
      );
    }
  }

  async notifyRentalCompleted(
    customerId: string,
    vendorId: string,
    bookingId: string,
  ) {
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      select: { userId: true },
    });

    if (customer) {
      await this.createNotification(
        customer.userId,
        "RETURN_REMINDER",
        "Rental Completed",
        "Your rental has been completed. Please leave a review!",
        { bookingId },
      );
    }

    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      select: { userId: true },
    });

    if (vendor) {
      await this.createNotification(
        vendor.userId,
        "RETURN_REMINDER",
        "Rental Completed",
        "A rental has been completed and returned by the customer.",
        { bookingId },
      );
    }
  }

  private async requireUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found.");
    }

    return user;
  }
}

export const notificationService = new NotificationService(
  prismaNotificationRepository,
);
