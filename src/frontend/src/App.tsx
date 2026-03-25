import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import type { StoredUser, ViewType } from "./types";
import { AdminDashboardView } from "./views/AdminDashboardView";
import { AdminMemberDetailView } from "./views/AdminMemberDetailView";
import { AdminMembersView } from "./views/AdminMembersView";
import { AdminPendingLoansView } from "./views/AdminPendingLoansView";
import { LoginView } from "./views/LoginView";
import { MemberDashboardView } from "./views/MemberDashboardView";
import { MyLoansView } from "./views/MyLoansView";
import { RegisterView } from "./views/RegisterView";
import { TransactionHistoryView } from "./views/TransactionHistoryView";

const STORAGE_KEY = "tao_user";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("login");
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as StoredUser;
        setCurrentUser(user);
        if (user.role === "admin") {
          setCurrentView("admin-dashboard");
        } else {
          setCurrentView("member-dashboard");
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleLogin = (user: StoredUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
    if (user.role === "admin") {
      setCurrentView("admin-dashboard");
    } else {
      setCurrentView("member-dashboard");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
    setCurrentView("login");
  };

  const navigate = (view: ViewType, memberId?: string) => {
    if (memberId) setSelectedMemberId(memberId);
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[430px] mx-auto min-h-screen relative">
        {currentView === "login" && (
          <LoginView onLogin={handleLogin} onNavigate={navigate} />
        )}
        {currentView === "register" && (
          <RegisterView onLogin={handleLogin} onNavigate={navigate} />
        )}
        {currentView === "member-dashboard" && currentUser && (
          <MemberDashboardView
            user={currentUser}
            onLogout={handleLogout}
            onNavigate={navigate}
          />
        )}
        {currentView === "transactions" && currentUser && (
          <TransactionHistoryView
            userId={currentUser.id}
            onBack={() => navigate("member-dashboard")}
          />
        )}
        {currentView === "my-loans" && currentUser && (
          <MyLoansView
            userId={currentUser.id}
            onBack={() => navigate("member-dashboard")}
          />
        )}
        {currentView === "admin-dashboard" && currentUser && (
          <AdminDashboardView
            user={currentUser}
            onLogout={handleLogout}
            onNavigate={navigate}
          />
        )}
        {currentView === "admin-members" && currentUser && (
          <AdminMembersView
            onBack={() => navigate("admin-dashboard")}
            onManageMember={(id) => navigate("admin-member-detail", id)}
          />
        )}
        {currentView === "admin-member-detail" && currentUser && (
          <AdminMemberDetailView
            memberId={selectedMemberId}
            onBack={() => navigate("admin-members")}
          />
        )}
        {currentView === "admin-pending-loans" && currentUser && (
          <AdminPendingLoansView onBack={() => navigate("admin-dashboard")} />
        )}
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
