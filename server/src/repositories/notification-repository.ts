import type { Notification, Prisma } from "@prisma/client";

import { prisma } from "../config/prisma.js";
import type { AuditInput } from "./vendor-repository.js";

export type NotificationRepository = {
  findById(notificationId: string): Promise<Notification | null>;
  listByUser(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ notifications: Notification[]; total: number }>;
  countUnread(userId: string): Promise<number>;
  create(
    data: Prisma.NotificationCreateInput,
    audit?: AuditInput,
  ): Promise<Notification>;
  markAsRead(notificationId: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<number>;
};

export const prismaNotificationRepository: NotificationRepository = {
  async findById(notificationId) {
    return prisma.notification.findUnique({
      where: { id: notificationId },
    });
  },

  async listByUser(userId, limit, offset) {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);
    return { notifications, total };
  },

  async countUnread(userId) {
    return prisma.notification.count({
      where: {
        userId,
        status: "UNREAD",
      },
    });
  },

  async create(data) {
    return prisma.notification.create({
      data,
    });
  },

  async markAsRead(notificationId) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: "READ",
        readAt: new Date(),
      },
    });
  },

  async markAllAsRead(userId) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        status: "UNREAD",
      },
      data: {
        status: "READ",
        readAt: new Date(),
      },
    });
    return result.count;
  },
};
