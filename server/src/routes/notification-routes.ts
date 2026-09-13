import { Router } from "express";

import {
  getNotification,
  getUnreadCount,
  listMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notification-controller.js";
import { requireAuthentication } from "../middleware/authentication.js";
import { validateRequest } from "../middleware/validate-request.js";
import { listNotificationQuerySchema } from "../schemas/notification-schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const notificationRouter = Router();

notificationRouter.use(requireAuthentication);

notificationRouter.get(
  "/",
  validateRequest("query", listNotificationQuerySchema),
  asyncHandler(listMyNotifications),
);

notificationRouter.get("/unread-count", asyncHandler(getUnreadCount));

notificationRouter.get("/:notificationId", asyncHandler(getNotification));

notificationRouter.post(
  "/:notificationId/read",
  asyncHandler(markNotificationAsRead),
);

notificationRouter.post("/read-all", asyncHandler(markAllNotificationsAsRead));
