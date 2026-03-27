import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ArrowDownCircle,
  Bell,
  Calculator,
  ChevronRight,
  Clock,
  Download,
  FileText,
  LogOut,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { NotificationPanel } from "../components/NotificationPanel";
import { useActor } from "../hooks/useActor";
import { useNotifications } from "../hooks/useNotifications";
import {
  useGetAllMembers,
  useGetAllPendingDeposits,
  useGetAllPendingLoans,
  useGetTotalSavings,
} from "../hooks/useQueries";
import { type StoredUser, formatAmount } from "../types";
import type { ViewType } from "../types";

interface Props {
  user: StoredUser;
  onLogout: () => void;
  onNavigate: (view: ViewType) => void;
}

function getStoredAdminId(): string {
  try {
    const stored = localStorage.getItem("tao_user");
    if (!stored) return "";
    return (JSON.parse(stored) as { id: string }).id ?? "";
  } catch {
    return "";
  }
}

export function AdminDashboardView({ user, onLogout, onNavigate }: Props) {
  const { data: members } = useGetAllMembers();
  const { data: totalSavings } = useGetTotalSavings();
  const { data: pendingLoans } = useGetAllPendingLoans();
  const { data: pendingDeposits } = useGetAllPendingDeposits();
  const { actor } = useActor();

  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount, requestPermission } = useNotifications(user.id);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Broadcast notification dialog state
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    setInstallPrompt(null);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      toast.error("Please enter both a title and message.");
      return;
    }
    if (!actor) {
      toast.error("Not connected to server.");
      return;
    }
    setSending(true);
    try {
      const adminId = getStoredAdminId();
      const res = await (actor as any).sendBroadcastNotification(
        adminId,
        broadcastTitle.trim(),
        broadcastBody.trim(),
      );
      if (res.__kind__ === "err") {
        toast.error(res.err);
      } else {
        toast.success("Notification sent to all members!");
        setBroadcastTitle("");
        setBroadcastBody("");
        setBroadcastOpen(false);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send notification.");
    } finally {
      setSending(false);
    }
  };

  const stats = [
    {
      label: "Total Members",
      value: members?.length ?? 0,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Group Savings",
      value: totalSavings != null ? formatAmount(totalSavings) : "—",
      icon: TrendingUp,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Pending Loans",
      value: pendingLoans?.length ?? 0,
      icon: Clock,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Pending Deposits",
      value: pendingDeposits?.length ?? 0,
      icon: ArrowDownCircle,
      color: "text-amber-500",
      bg: "bg-amber-100",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" data-ocid="admin.page">
      <header className="bg-card border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <img
            src="/assets/generated/together-icon-transparent.dim_512x512.png"
            alt="TogetherAsOne"
            className="w-6 h-6 object-contain"
          />
          <span className="font-bold text-sm text-primary">TogetherAsOne</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNotifOpen(true)}
            className="relative p-1.5 rounded-full hover:bg-muted transition"
            data-ocid="admin.open_modal_button"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition"
            data-ocid="admin.button"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <div
        className="px-4 py-5 text-white"
        style={{ background: "linear-gradient(to right, #0B4A37, #C6A24D)" }}
      >
        <p className="text-white/70 text-xs font-medium uppercase tracking-widest">
          Admin Overview
        </p>
        <h1 className="text-xl font-bold mt-1">Management Panel</h1>
        <p className="text-white/70 text-xs mt-1">Welcome, {user.name}</p>
      </div>

      <main className="flex-1 px-4 py-4 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="border-0 shadow-card"
              data-ocid="admin.card"
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center`}
                  >
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-xl font-bold mt-0.5">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          <button
            type="button"
            className="w-full bg-card rounded-xl px-4 py-4 shadow-card flex items-center justify-between hover:shadow-card-md transition"
            onClick={() => onNavigate("admin-members")}
            data-ocid="admin.link"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Manage Members</p>
                <p className="text-xs text-muted-foreground">
                  View, add, or remove members
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            className="w-full bg-card rounded-xl px-4 py-4 shadow-card flex items-center justify-between hover:shadow-card-md transition"
            onClick={() => onNavigate("admin-pending-loans")}
            data-ocid="admin.link"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-accent" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Pending Loan Requests</p>
                <p className="text-xs text-muted-foreground">
                  {pendingLoans?.length ?? 0} awaiting review
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            className="w-full bg-card rounded-xl px-4 py-4 shadow-card flex items-center justify-between hover:shadow-card-md transition"
            onClick={() => onNavigate("admin-pending-deposits")}
            data-ocid="admin.link"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                <ArrowDownCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">
                  Pending Deposit Requests
                </p>
                <p className="text-xs text-muted-foreground">
                  {pendingDeposits?.length ?? 0} awaiting review
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Send Notification to All Members */}
          <button
            type="button"
            className="w-full bg-card rounded-xl px-4 py-4 shadow-card flex items-center justify-between hover:shadow-card-md transition"
            onClick={() => setBroadcastOpen(true)}
            data-ocid="admin.link"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                <Send className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Send Notification</p>
                <p className="text-xs text-muted-foreground">
                  Broadcast a message to all members
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            className="w-full bg-card rounded-xl px-4 py-4 shadow-card flex items-center justify-between hover:shadow-card-md transition"
            onClick={() =>
              window.open(
                "/assets/uploads/constitution-019d2a72-ba90-7596-85bc-cbc8b830ac2c-1.pdf",
                "_blank",
              )
            }
            data-ocid="admin.primary_button"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Group Constitution</p>
                <p className="text-xs text-muted-foreground">
                  Download PDF document
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <button
            type="button"
            className="w-full bg-card rounded-xl px-4 py-4 shadow-card flex items-center justify-between hover:shadow-card-md transition"
            onClick={() => onNavigate("calculator")}
            data-ocid="admin.link"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Calculator</p>
                <p className="text-xs text-muted-foreground">
                  Loan &amp; savings calculator
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </main>

      {/* Broadcast Notification Dialog */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              Send Notification to All Members
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Title
              </p>
              <Input
                placeholder="e.g. Meeting Reminder"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Message
              </p>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary min-h-[90px]"
                placeholder="Type your message here..."
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {broadcastBody.length}/500
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setBroadcastOpen(false)}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary text-white"
                onClick={handleSendBroadcast}
                disabled={
                  sending || !broadcastTitle.trim() || !broadcastBody.trim()
                }
              >
                {sending ? "Sending..." : "Send to All"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NOTIFICATION PANEL */}
      <NotificationPanel
        userId={user.id}
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />

      {/* PWA Install Banner */}
      {installPrompt && (
        <div className="fixed bottom-16 left-4 right-4 z-50">
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg"
            style={{
              background: "linear-gradient(to right, #0B4A37, #1a6b52)",
            }}
          >
            <Download className="w-5 h-5 text-white shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold">
                Install TogetherAsOne
              </p>
              <p className="text-white/70 text-[11px]">
                Add to your home screen
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleInstall}
              className="h-8 text-xs bg-white text-primary hover:bg-white/90 font-semibold shrink-0"
              data-ocid="admin.primary_button"
            >
              Install
            </Button>
            <button
              type="button"
              onClick={() => setInstallPrompt(null)}
              className="text-white/60 hover:text-white text-lg leading-none shrink-0"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <footer className="text-center py-3 text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
