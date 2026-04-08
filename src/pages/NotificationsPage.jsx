import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { useTranslation } from "../hooks/useTranslation";

const LOCALE_BY_LANGUAGE = {
  kk: "kk-KZ",
  ru: "ru-RU",
  en: "en-US",
};

const parseMetadata = (value) => {
  if (!value) {
    return {};
  }
  if (typeof value === "object") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const formatScheduleBrief = (scheduleItem) => {
  if (!scheduleItem) {
    return "";
  }

  const subgroup = String(scheduleItem.subgroup || "").trim().toUpperCase();
  const subgroupLabel = subgroup ? `, subgroup ${subgroup}` : "";
  return `${scheduleItem.course_name || ""} | ${scheduleItem.day || ""} ${scheduleItem.start_hour || ""}:00 | room ${scheduleItem.room_number || ""} | group ${scheduleItem.group_name || ""}${subgroupLabel}`;
};

const formatTimestamp = (value, language) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(LOCALE_BY_LANGUAGE[language] || "ru-RU");
};

const getNotificationContent = (item, t) => {
  const metadata = parseMetadata(item.metadata);

  if (item.notification_type === "schedule_changed") {
    const beforeItem = metadata.before;
    const afterItem = metadata.after;

    if (beforeItem && afterItem) {
      return {
        title: t("notificationScheduleChangedTitle"),
        message: `${t("notificationScheduleUpdated")}: ${t("notificationWas")}: ${formatScheduleBrief(beforeItem)}. ${t("notificationBecame")}: ${formatScheduleBrief(afterItem)}.`,
      };
    }

    if (afterItem) {
      return {
        title: t("notificationScheduleChangedTitle"),
        message: `${t("notificationScheduleAdded")}: ${formatScheduleBrief(afterItem)}.`,
      };
    }

    if (beforeItem) {
      return {
        title: t("notificationScheduleChangedTitle"),
        message: `${t("notificationScheduleRemoved")}: ${formatScheduleBrief(beforeItem)}.`,
      };
    }
  }

  if (item.notification_type === "schedule_regenerated") {
    return {
      title: t("notificationScheduleRegeneratedTitle"),
      message: `${t("notificationScheduleRegeneratedText")} ${metadata.semester || ""} ${t("semester").toLowerCase()} ${metadata.year || ""}.`,
    };
  }

  return {
    title: item.title,
    message: item.message,
  };
};

export default function NotificationsPage() {
  const { t, language } = useTranslation();
  const hasMarkedOnOpenRef = useRef(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const {
    items,
    unreadCount,
    isLoading,
    markAllAsRead,
    deleteOne,
    deleteAll,
  } = useNotifications();

  useEffect(() => {
    if (unreadCount > 0 && !hasMarkedOnOpenRef.current) {
      hasMarkedOnOpenRef.current = true;
      markAllAsRead().catch(() => {
        hasMarkedOnOpenRef.current = false;
      });
    }
    if (unreadCount === 0) {
      hasMarkedOnOpenRef.current = true;
    }
  }, [markAllAsRead, unreadCount]);

  const sortedItems = useMemo(
    () => [...items].sort((left, right) => new Date(right.created_at) - new Date(left.created_at)),
    [items],
  );

  const handleDeleteAll = async () => {
    try {
      setIsDeletingAll(true);
      await deleteAll();
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDeleteOne = async (notificationId) => {
    try {
      setDeletingId(notificationId);
      await deleteOne(notificationId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-[70vh]">
      <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[28px] border border-green-100 bg-gradient-to-br from-white via-[#f4fbf7] to-[#eef7f1] shadow-[0_24px_80px_rgba(1,69,49,0.12)] sm:rounded-[32px]">
        <div className="bg-[#014531] px-5 py-8 text-white sm:px-8 sm:py-10 lg:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-yellow-300">
                {t("notifications")}
              </p>
              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                {t("notificationsTitle")}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-green-50 sm:text-base">
                {unreadCount > 0
                  ? `${t("notificationsUnread")}: ${unreadCount}`
                  : t("notificationsNoUnread")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {sortedItems.length > 0 ? (
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={isDeletingAll}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  <Trash2 size={18} />
                  {isDeletingAll ? t("loading") : t("notificationsDeleteAll")}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-8 sm:py-8 lg:px-10">
          <div className="rounded-[28px] border border-green-100 bg-white shadow-sm">
            <div className="border-b border-green-100 px-5 py-5 sm:px-8">
              <p className="text-sm uppercase tracking-[0.28em] text-green-700">
                {t("notifications")}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {t("notificationsTitle")}
              </h2>
            </div>

            {isLoading && sortedItems.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-500 sm:px-8">
                {t("loading")}
              </div>
            ) : null}

            {!isLoading && sortedItems.length === 0 ? (
              <div className="px-5 py-14 text-center sm:px-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f4fbf7] text-[#014531]">
                  <Bell size={24} />
                </div>
                <p className="mt-4 text-lg font-semibold text-gray-900">
                  {t("notificationsEmpty")}
                </p>
              </div>
            ) : null}

            {sortedItems.length > 0 ? (
              <div className="divide-y divide-green-100">
                {sortedItems.map((item) => {
                  const isUnread = !Number(item.is_read || 0);
                  const content = getNotificationContent(item, t);
                  return (
                    <article
                      key={item.id}
                      className={`px-5 py-5 sm:px-8 ${isUnread ? "bg-[#f8fcfa]" : "bg-white"}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <h2 className="text-base font-semibold text-gray-900">
                              {content.title}
                            </h2>
                            {isUnread ? (
                              <span className="rounded-full bg-yellow-300 px-2.5 py-1 text-xs font-semibold text-[#014531]">
                                {t("notificationsUnreadBadge")}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-gray-600">
                            {content.message}
                          </p>
                          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-gray-400">
                            {formatTimestamp(item.created_at, language)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteOne(item.id)}
                            disabled={deletingId === item.id}
                            className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                          >
                            {deletingId === item.id ? t("loading") : t("delete")}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
