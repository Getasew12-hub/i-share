import type { Request, Response } from "express";

import { notificationService } from "../services/notification-service.js";
import { sendSuccess } from "../utils/http.js";

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

function query(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

export async function listMyNotifications(
  request: Request,
  response: Response,
) {
  const page = Number.parseInt(query(request.query.page as string)) || 1;
  const limit = Number.parseInt(query(request.query.limit as string)) || 20;

  const result = await notificationService.listMyNotifications(
    request.user!.id,
    page,
    limit,
  );

  sendSuccess(response, result);
}

export async function getNotification(request: Request, response: Response) {
  const notification = await notificationService.getNotification(
    request.user!.id,
    param(request.params.notificationId),
  );

  sendSuccess(response, { notification });
}

export async function markNotificationAsRead(
  request: Request,
  response: Response,
) {
  const notification = await notificationService.markNotificationAsRead(
    request.user!.id,
    param(request.params.notificationId),
  );

  sendSuccess(response, { notification });
}

export async function markAllNotificationsAsRead(
  request: Request,
  response: Response,
) {
  const count = await notificationService.markAllAsRead(request.user!.id);

  sendSuccess(response, { count });
}

export async function getUnreadCount(request: Request, response: Response) {
  const count = await notificationService.countUnread(request.user!.id);

  sendSuccess(response, { unreadCount: count });
}
