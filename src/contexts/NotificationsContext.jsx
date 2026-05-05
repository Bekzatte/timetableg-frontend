import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { queryKeys } from "../api/queryKeys";
import { NotificationsContext } from "./NotificationsContextValue";

const NOTIFICATION_POLL_INTERVAL_MS = 30000;

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEnabled = user?.role === "teacher" || user?.role === "student";
  const queryKey = useMemo(() => queryKeys.notifications.all(user), [user]);

  const notificationsQuery = useQuery({
    queryKey,
    queryFn: notificationsAPI.getAll,
    enabled: isEnabled,
    refetchInterval: isEnabled ? NOTIFICATION_POLL_INTERVAL_MS : false,
    refetchIntervalInBackground: false,
    initialData: { items: [], unreadCount: 0 },
  });

  const { items, unreadCount } = useMemo(() => {
    const normalizedData = notificationsQuery.data || {
      items: [],
      unreadCount: 0,
    };

    return {
      items:
        isEnabled && Array.isArray(normalizedData.items)
          ? normalizedData.items
          : [],
      unreadCount: isEnabled ? Number(normalizedData.unreadCount || 0) : 0,
    };
  }, [isEnabled, notificationsQuery.data]);
  const isLoading = notificationsQuery.isLoading || notificationsQuery.isFetching;

  const setNotificationCache = useCallback(
    (updater) => {
      queryClient.setQueryData(queryKey, (current) =>
        updater(current || { items: [], unreadCount: 0 }),
      );
    },
    [queryClient, queryKey],
  );

  const loadNotifications = useCallback(async () => {
    if (!isEnabled) {
      return { items: [], unreadCount: 0 };
    }

    const result = await notificationsQuery.refetch();
    return result.data || { items: [], unreadCount: 0 };
  }, [isEnabled, notificationsQuery]);

  const markReadMutation = useMutation({
    mutationFn: notificationsAPI.markRead,
    onSuccess: (updated, notificationId) => {
      setNotificationCache((current) => {
        let decremented = false;
        const nextItems = (current.items || []).map((item) => {
          if (item.id !== notificationId) {
            return item;
          }
          if (!Number(item.is_read || 0)) {
            decremented = true;
          }
          return updated;
        });

        return {
          items: nextItems,
          unreadCount: decremented
            ? Math.max(0, Number(current.unreadCount || 0) - 1)
            : Number(current.unreadCount || 0),
        };
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsAPI.markAllRead,
    onSuccess: (payload) => {
      setNotificationCache((current) => ({
        items: (current.items || []).map((item) => ({
          ...item,
          is_read: 1,
          read_at: item.read_at || new Date().toISOString(),
        })),
        unreadCount: Number(payload?.unreadCount || 0),
      }));
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: notificationsAPI.deleteOne,
    onSuccess: (payload, notificationId) => {
      setNotificationCache((current) => ({
        items: (current.items || []).filter((item) => item.id !== notificationId),
        unreadCount: Number(payload?.unreadCount || 0),
      }));
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: notificationsAPI.deleteAll,
    onSuccess: (payload) => {
      setNotificationCache(() => ({
        items: [],
        unreadCount: Number(payload?.unreadCount || 0),
      }));
    },
  });

  const markAsRead = useCallback(
    (notificationId) => markReadMutation.mutateAsync(notificationId),
    [markReadMutation],
  );
  const markAllAsRead = useCallback(
    () => markAllReadMutation.mutateAsync(),
    [markAllReadMutation],
  );
  const deleteOne = useCallback(
    (notificationId) => deleteOneMutation.mutateAsync(notificationId),
    [deleteOneMutation],
  );
  const deleteAll = useCallback(
    () => deleteAllMutation.mutateAsync(),
    [deleteAllMutation],
  );

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
    [
      items,
      unreadCount,
      isLoading,
      isEnabled,
      loadNotifications,
      markAsRead,
      markAllAsRead,
      deleteOne,
      deleteAll,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
