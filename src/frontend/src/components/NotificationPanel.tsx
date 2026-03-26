import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Bell, BellOff } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";

interface Props {
  userId: string;
  open: boolean;
  onClose: () => void;
}

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationPanel({ userId, open, onClose }: Props) {
  const { notifications, unreadCount, markAllRead } = useNotifications(userId);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-[320px] p-0 flex flex-col"
        data-ocid="notifications.sheet"
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Bell className="w-4 h-4 text-primary" />
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-7 px-2 text-primary hover:text-primary"
                onClick={markAllRead}
                data-ocid="notifications.button"
              >
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {notifications.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
              data-ocid="notifications.empty_state"
            >
              <BellOff className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs mt-1 text-center px-6">
                You'll see updates about deposits and loans here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif, i) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 relative ${
                    !notif.read ? "bg-primary/5" : ""
                  }`}
                  data-ocid={`notifications.item.${i + 1}`}
                >
                  {!notif.read && (
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r" />
                  )}
                  <p className="text-sm font-semibold text-foreground">
                    {notif.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {notif.body}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {relativeTime(notif.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
