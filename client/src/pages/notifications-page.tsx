import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "../hooks/use-auth";
import { notificationService } from "../services/notification-service";
import type { Notification } from "../types/notification";

function notificationTypeLabel(type: Notification["type"]): string {
  switch (type) {
    case "BOOKING_CREATED":
      return "Booking Created";
    case "BOOKING_CONFIRMED":
      return "Booking Confirmed";
    case "BOOKING_REJECTED":
      return "Booking Rejected";
    case "PAYMENT_SUCCEEDED":
      return "Payment Succeeded";
    case "PAYMENT_FAILED":
      return "Payment Failed";
    case "RENTAL_STARTED":
      return "Rental Started";
    case "RENTAL_COMPLETED":
      return "Rental Completed";
    default:
      return "Notification";
  }
}

function notificationTypeColor(type: Notification["type"]): string {
  switch (type) {
    case "BOOKING_CREATED":
      return "bg-blue-100 text-blue-800";
    case "BOOKING_CONFIRMED":
      return "bg-green-100 text-green-800";
    case "BOOKING_REJECTED":
      return "bg-red-100 text-red-800";
    case "PAYMENT_SUCCEEDED":
      return "bg-green-100 text-green-800";
    case "PAYMENT_FAILED":
      return "bg-red-100 text-red-800";
    case "RENTAL_STARTED":
      return "bg-purple-100 text-purple-800";
    case "RENTAL_COMPLETED":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function NotificationsPage() {
  const { accessToken } = useAuth();
  const [page, setPage] = useState(1);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => notificationService.listMyNotifications(page, 20),
    enabled: Boolean(accessToken),
  });

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: Boolean(accessToken),
    refetchInterval: 5000,
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markAsRead(notificationId),
    onSuccess: () => {
      notificationsQuery.refetch();
      unreadQuery.refetch();
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      notificationsQuery.refetch();
      unreadQuery.refetch();
    },
  });

  const handleMarkRead = (notificationId: string) => {
    markReadMutation.mutate(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <section className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              Notifications
            </h1>
            <p className="mt-2 text-muted-foreground">
              Stay updated on your rental activity.
            </p>
          </div>
          {unreadQuery.data && unreadQuery.data.unreadCount > 0 && (
            <div className="text-right">
              <div className="mb-2 inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                {unreadQuery.data.unreadCount} unread
              </div>
              {notificationsQuery.data?.notifications?.some(
                (n) => n.status === "UNREAD",
              ) && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markAllReadMutation.isPending}
                  className="block text-sm text-primary hover:underline disabled:opacity-50"
                >
                  Mark all as read
                </button>
              )}
            </div>
          )}
        </div>

        {notificationsQuery.isLoading && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((index) => (
              <div
                className="h-20 animate-pulse rounded-lg border border-border bg-white"
                key={index}
              />
            ))}
          </div>
        )}

        {notificationsQuery.isError && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-white p-6 text-sm text-destructive">
            Your notifications could not be loaded.
          </div>
        )}

        {notificationsQuery.data?.notifications &&
          notificationsQuery.data.notifications.length === 0 && (
            <div className="mt-8 rounded-lg border border-border bg-white p-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-3 font-medium">No notifications yet</p>
              <p className="text-sm text-muted-foreground">
                You'll see notifications here when you have booking or payment
                updates.
              </p>
            </div>
          )}

        {notificationsQuery.data?.notifications && (
          <div className="mt-6 space-y-3">
            {notificationsQuery.data.notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg border border-border bg-white p-4 transition-colors ${
                  notification.status === "UNREAD" ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${notificationTypeColor(
                          notification.type,
                        )}`}
                      >
                        {notificationTypeLabel(notification.type)}
                      </span>
                      {notification.status === "UNREAD" && (
                        <span className="inline-block h-2 w-2 rounded-full bg-primary"></span>
                      )}
                    </div>
                    <h3 className="mt-2 font-medium">{notification.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.body}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {notification.status === "UNREAD" && (
                    <button
                      onClick={() => handleMarkRead(notification.id)}
                      disabled={markReadMutation.isPending}
                      className="ml-4 rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                  {notification.status === "READ" && (
                    <div className="ml-4 rounded-lg p-2">
                      <CheckCheck className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {notificationsQuery.data && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of{" "}
              {Math.ceil((notificationsQuery.data.total || 0) / 20) || 1}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) =>
                    p < Math.ceil((notificationsQuery.data?.total || 0) / 20)
                      ? p + 1
                      : p,
                  )
                }
                disabled={
                  page >= Math.ceil((notificationsQuery.data?.total || 0) / 20)
                }
                className="rounded-lg border border-border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
