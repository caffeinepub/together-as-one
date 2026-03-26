import { useCallback, useEffect, useState } from "react";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
}

function getStorageKey(userId: string) {
  return `notifications_${userId}`;
}

function loadNotifications(userId: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return [];
  }
}

function saveNotifications(userId: string, notifications: AppNotification[]) {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(notifications));
}

export function addNotification(userId: string, title: string, body: string) {
  const existing = loadNotifications(userId);
  const newNotif: AppNotification = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    title,
    body,
    timestamp: Date.now(),
    read: false,
  };
  saveNotifications(userId, [newNotif, ...existing]);
  // Dispatch storage event so other tabs/components can react
  window.dispatchEvent(
    new StorageEvent("storage", { key: getStorageKey(userId) }),
  );
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadNotifications(userId),
  );

  const refresh = useCallback(() => {
    setNotifications(loadNotifications(userId));
  }, [userId]);

  useEffect(() => {
    refresh();
    const handler = (e: StorageEvent) => {
      if (e.key === getStorageKey(userId)) {
        refresh();
      }
    };
    window.addEventListener("storage", handler);
    // Poll every 3 seconds to catch same-tab updates
    const interval = setInterval(refresh, 3000);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, [userId, refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    saveNotifications(userId, updated);
    setNotifications(updated);
  }, [notifications, userId]);

  const sendNotification = useCallback((title: string, body: string) => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    markAllRead,
    sendNotification,
    addNotification,
    requestPermission,
  };
}
