import { useCallback, useEffect, useMemo, useState } from "react";
import { notificationsAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { NotificationsContext } from "./NotificationsContextValue";

const NOTIFICATION_POLL_INTERVAL_MS = 30000;

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const isEnabled = user?.role === "teacher" || user?.role === "student";

  const loadNotifications = useCallback(async () => {
    if (!isEnabled) {
      setItems([]);
      setUnreadCount(0);
      return { items: [], unreadCount: 0 };
    }

    setIsLoading(true);
    try {
      const payload = await notificationsAPI.getAll();
      const nextItems = Array.isArray(payload?.items) ? payload.items : [];
      setItems(nextItems);
      setUnreadCount(Number(payload?.unreadCount || 0));
      return { items: nextItems, unreadCount: Number(payload?.unreadCount || 0) };
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);

  useEffect(() => {
    loadNotifications().catch(() => {});
  }, [loadNotifications]);

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadNotifications().catch(() => {});
    }, NOTIFICATION_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [isEnabled, loadNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    const updated = await notificationsAPI.markRead(notificationId);
    let decremented = false;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== notificationId) {
          return item;
        }
        if (!Number(item.is_read || 0)) {
          decremented = true;
        }
        return updated;
      }),
    );
    if (decremented) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    return updated;
  }, []);

  const markAllAsRead = useCallback(async () => {
    const payload = await notificationsAPI.markAllRead();
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        is_read: 1,
        read_at: item.read_at || new Date().toISOString(),
      })),
    );
    setUnreadCount(Number(payload?.unreadCount || 0));
    return payload;
  }, []);

  const deleteOne = useCallback(async (notificationId) => {
    const payload = await notificationsAPI.deleteOne(notificationId);
    setItems((prev) => prev.filter((item) => item.id !== notificationId));
    setUnreadCount(Number(payload?.unreadCount || 0));
    return payload;
  }, []);

  const deleteAll = useCallback(async () => {
    const payload = await notificationsAPI.deleteAll();
    setItems([]);
    setUnreadCount(Number(payload?.unreadCount || 0));
    return payload;
  }, []);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      isLoading,
      isEnabled,
      loadNotifications,
      markAsRead,
      markAllAsRead,
      deleteOne,
      deleteAll,
    }),
    [items, unreadCount, isLoading, isEnabled, loadNotifications, markAsRead, markAllAsRead, deleteOne, deleteAll],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
