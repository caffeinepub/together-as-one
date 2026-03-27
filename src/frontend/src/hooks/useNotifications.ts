import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "./useActor";

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

function getSeenBroadcastsKey(userId: string) {
  return `seen_broadcasts_${userId}`;
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

function loadSeenBroadcasts(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(getSeenBroadcastsKey(userId));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSeenBroadcasts(userId: string, ids: Set<string>) {
  localStorage.setItem(getSeenBroadcastsKey(userId), JSON.stringify([...ids]));
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
  window.dispatchEvent(
    new StorageEvent("storage", { key: getStorageKey(userId) }),
  );
}

export function useNotifications(userId: string) {
  const { actor } = useActor();
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadNotifications(userId),
  );
  const seenRef = useRef<Set<string>>(loadSeenBroadcasts(userId));

  const refresh = useCallback(() => {
    setNotifications(loadNotifications(userId));
  }, [userId]);

  // Merge broadcast notifications from backend
  const fetchBroadcasts = useCallback(async () => {
    if (!actor || !userId) return;
    try {
      const broadcasts = await (actor as any).getBroadcastNotifications();
      const seen = seenRef.current;
      const newOnes: AppNotification[] = [];
      for (const b of broadcasts) {
        if (!seen.has(b.id)) {
          seen.add(b.id);
          newOnes.push({
            id: `broadcast_${b.id}`,
            title: b.title,
            body: b.body,
            timestamp: Number(b.timestamp) / 1_000_000,
            read: false,
          });
        }
      }
      if (newOnes.length > 0) {
        saveSeenBroadcasts(userId, seen);
        const existing = loadNotifications(userId);
        // Avoid duplicates by checking id prefix
        const existingIds = new Set(existing.map((n) => n.id));
        const toAdd = newOnes.filter((n) => !existingIds.has(n.id));
        if (toAdd.length > 0) {
          saveNotifications(userId, [...toAdd, ...existing]);
          setNotifications((prev) => [...toAdd, ...prev]);
        }
      }
    } catch {
      // silently ignore
    }
  }, [actor, userId]);

  useEffect(() => {
    refresh();
    const handler = (e: StorageEvent) => {
      if (e.key === getStorageKey(userId)) {
        refresh();
      }
    };
    window.addEventListener("storage", handler);
    const interval = setInterval(refresh, 3000);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, [userId, refresh]);

  // Poll broadcasts every 15 seconds
  useEffect(() => {
    if (!actor) return;
    fetchBroadcasts();
    const interval = setInterval(fetchBroadcasts, 15000);
    return () => clearInterval(interval);
  }, [actor, fetchBroadcasts]);

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
