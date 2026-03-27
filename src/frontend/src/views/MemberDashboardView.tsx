import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDownCircle,
  ArrowRight,
  Bell,
  Calculator,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Loader2,
  LogOut,
  Phone,
  PiggyBank,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { NotificationPanel } from "../components/NotificationPanel";
import { useActor } from "../hooks/useActor";
import { addNotification, useNotifications } from "../hooks/useNotifications";
import {
  useGetMyProfile,
  useGetMyTransactions,
  useRequestDeposit,
  useRequestLoan,
} from "../hooks/useQueries";
import {
  type StoredUser,
  formatAmount,
  formatDate,
  formatDateTime,
} from "../types";
import type { ViewType } from "../types";

interface Props {
  user: StoredUser;
  onLogout: () => void;
  onNavigate: (view: ViewType) => void;
}

type DepositStep = "amount" | "phone" | "processing" | "success";
type PaymentMethod = "mpesa" | "airtel";

export function MemberDashboardView({ user, onLogout, onNavigate }: Props) {
  const { data: profile, isLoading } = useGetMyProfile(user.id);
  const { data: transactions } = useGetMyTransactions(user.id);
  const requestDepositMutation = useRequestDeposit();
  const loanMutation = useRequestLoan();

  const [depositOpen, setDepositOpen] = useState(false);
  const [loanOpen, setLoanOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPwM, setShowNewPwM] = useState(false);
  const [showConfirmPwM, setShowConfirmPwM] = useState(false);
  const [changePwLoading, setChangePwLoading] = useState(false);
  const { actor } = useActor();

  // Mobile money flow state
  const [depositStep, setDepositStep] = useState<DepositStep>("amount");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");

  const { unreadCount, requestPermission } = useNotifications(user.id);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      setInstallPrompt(null);
    } else {
      setInstallDialogOpen(true);
    }
  };

  const savings = profile ? profile.savings : BigInt(user.savings);
  const recentTxs = (transactions ?? []).slice(0, 3);

  const loanAmountNum = Number.parseFloat(loanAmount) || 0;
  const interest = loanAmountNum * 0.1;
  const totalRepay = loanAmountNum + interest;

  const handleChangePassword = async () => {
    if (newPw.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmNewPw) {
      toast.error("Passwords do not match");
      return;
    }
    setChangePwLoading(true);
    try {
      const res = await (actor as any).changePassword(
        user.id,
        currentPw,
        newPw,
      );
      if (res.__kind__ === "ok") {
        toast.success("Password changed successfully");
        setChangePwOpen(false);
        setCurrentPw("");
        setNewPw("");
        setConfirmNewPw("");
      } else {
        toast.error(res.err ?? "Failed to change password");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed to change password");
    } finally {
      setChangePwLoading(false);
    }
  };

  const resetDepositDialog = () => {
    setDepositStep("amount");
    setDepositAmount("");
    setPhoneNumber("");
    setPaymentMethod("mpesa");
  };

  const handleDepositClose = (open: boolean) => {
    setDepositOpen(open);
    if (!open) resetDepositDialog();
  };

  const handleAmountNext = () => {
    const amount = Number.parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setDepositStep("phone");
  };

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("0") && digits.length === 10)
      return `254${digits.slice(1)}`;
    if (digits.startsWith("254") && digits.length === 12) return digits;
    if (digits.startsWith("7") && digits.length === 9) return `254${digits}`;
    if (digits.startsWith("+254")) return digits.slice(1);
    return digits;
  };

  const handleSendSTK = async () => {
    const formatted = formatPhone(phoneNumber);
    if (formatted.length !== 12 || !formatted.startsWith("254")) {
      toast.error("Enter a valid Kenyan phone number (e.g. 0712345678)");
      return;
    }
    setDepositStep("processing");

    await new Promise((r) => setTimeout(r, 2500));

    try {
      await requestDepositMutation.mutateAsync({
        userId: user.id,
        amount: BigInt(Math.round(Number.parseFloat(depositAmount))),
      });
      setDepositStep("success");
      addNotification(
        "admin",
        "New Deposit Request",
        `${user.name} requested a deposit of KES ${Number.parseFloat(depositAmount).toLocaleString()}`,
      );
    } catch (e: any) {
      toast.error(e.message ?? "Deposit request failed");
      setDepositStep("phone");
    }
  };

  const handleLoanRequest = async () => {
    if (!loanAmountNum || loanAmountNum <= 0) {
      toast.error("Enter a valid loan amount");
      return;
    }
    try {
      await loanMutation.mutateAsync({
        userId: user.id,
        amount: BigInt(Math.round(loanAmountNum)),
      });
      addNotification(
        "admin",
        "New Loan Request",
        `${user.name} requested a loan of KES ${loanAmountNum.toLocaleString()}`,
      );
      toast.success("Loan request submitted! Awaiting admin approval.");
      setLoanOpen(false);
      setLoanAmount("");
    } catch (e: any) {
      toast.error(e.message ?? "Loan request failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" data-ocid="member.page">
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
            data-ocid="member.open_modal_button"
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
            onClick={() => setChangePwOpen(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition"
            data-ocid="member.open_modal_button"
          >
            <KeyRound className="w-4 h-4" /> Password
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition"
            data-ocid="member.button"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <div
        className="px-4 py-5 text-white"
        style={{ background: "linear-gradient(to right, #0B4A37, #C6A24D)" }}
        data-ocid="member.panel"
      >
        <p className="text-white/70 text-xs font-medium uppercase tracking-widest">
          Member Dashboard
        </p>
        <h1 className="text-xl font-bold mt-1">
          Welcome back, {user.name.split(" ")[0]}! 👋
        </h1>
        <div className="flex items-center gap-1.5 mt-2 text-white/70 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>Last login: {formatDateTime(BigInt(user.lastLogin))}</span>
        </div>
      </div>

      <main className="flex-1 px-4 py-4 space-y-4">
        <Card
          className="shadow-card-md border-0 overflow-hidden"
          data-ocid="member.card"
        >
          <div className="bg-primary/5 px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <PiggyBank className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Savings Balance
              </p>
            </div>
            {isLoading ? (
              <div
                className="h-9 bg-muted rounded animate-pulse w-32"
                data-ocid="member.loading_state"
              />
            ) : (
              <p className="text-3xl font-bold text-primary">
                {formatAmount(savings)}
              </p>
            )}
          </div>
          <CardContent className="pt-3 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-sm"
                onClick={() => setDepositOpen(true)}
                data-ocid="member.primary_button"
              >
                <ArrowDownCircle className="w-4 h-4 mr-1.5" /> Deposit
              </Button>
              <Button
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm"
                onClick={() => setLoanOpen(true)}
                data-ocid="member.secondary_button"
              >
                <CreditCard className="w-4 h-4 mr-1.5" /> Request Loan
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onNavigate("transactions")}
            className="bg-card rounded-xl p-3 shadow-card text-left flex flex-col gap-1.5 hover:shadow-card-md transition"
            data-ocid="member.link"
          >
            <FileText className="w-5 h-5 text-primary" />
            <p className="text-xs font-semibold text-foreground leading-tight">
              Transactions
            </p>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("my-loans")}
            className="bg-card rounded-xl p-3 shadow-card text-left flex flex-col gap-1.5 hover:shadow-card-md transition"
            data-ocid="member.link"
          >
            <TrendingUp className="w-5 h-5 text-accent" />
            <p className="text-xs font-semibold text-foreground leading-tight">
              My Loans
            </p>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("calculator")}
            className="bg-card rounded-xl p-3 shadow-card text-left flex flex-col gap-1.5 hover:shadow-card-md transition"
            data-ocid="member.link"
          >
            <Calculator className="w-5 h-5 text-primary" />
            <p className="text-xs font-semibold text-foreground leading-tight">
              Calculator
            </p>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>

        {/* ─── GROUP CONSTITUTION DOWNLOAD ─── */}
        <a
          href="/assets/uploads/constitution-019d2a72-ba90-7596-85bc-cbc8b830ac2c-1.pdf"
          download="TogetherAsOne-Group-Constitution.pdf"
          className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-card hover:shadow-card-md transition"
          data-ocid="member.link"
        >
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Group Constitution
            </p>
            <p className="text-xs text-muted-foreground">
              Download PDF document
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </a>

        {/* ─── INSTALL APP CARD ─── */}
        <button
          type="button"
          onClick={handleInstall}
          className="w-full flex items-center gap-3 bg-card rounded-xl p-4 shadow-card hover:shadow-card-md transition text-left"
          data-ocid="member.link"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Download App
            </p>
            <p className="text-xs text-muted-foreground">
              Install TogetherAsOne on your phone
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </button>

        <Card className="shadow-card border-0" data-ocid="member.card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Recent Transactions</h3>
              <button
                type="button"
                className="text-xs text-primary font-medium hover:underline"
                onClick={() => onNavigate("transactions")}
                data-ocid="member.link"
              >
                View all
              </button>
            </div>
            {recentTxs.length === 0 ? (
              <div
                className="text-center py-6 text-muted-foreground text-sm"
                data-ocid="member.empty_state"
              >
                No transactions yet. Make your first deposit!
              </div>
            ) : (
              <div className="space-y-3">
                {recentTxs.map((tx, i) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between"
                    data-ocid={`member.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                        <ArrowDownCircle className="w-4 h-4 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Deposit</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.timestamp)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-success">
                      +{formatAmount(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* ─── DEPOSIT DIALOG ─── */}
      <Dialog open={depositOpen} onOpenChange={handleDepositClose}>
        <DialogContent
          className="max-w-[90vw] rounded-2xl"
          data-ocid="member.dialog"
        >
          {/* STEP 1: Amount */}
          {depositStep === "amount" && (
            <>
              <DialogHeader>
                <DialogTitle>Deposit Funds</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Amount (KES)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="mt-1"
                    data-ocid="member.input"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDepositOpen(false)}
                    data-ocid="member.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={handleAmountNext}
                    data-ocid="member.confirm_button"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Phone number + payment method */}
          {depositStep === "phone" && (
            <>
              <DialogHeader>
                <DialogTitle>Pay via Mobile Money</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="bg-muted rounded-lg px-3 py-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold text-primary">
                    KES {Number.parseFloat(depositAmount).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Send to: <span className="font-medium">+254 740 023 681</span>
                </p>

                <div>
                  <Label className="mb-2 block">Select Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("mpesa")}
                      className={`rounded-xl border-2 p-3 flex flex-col items-center gap-1 transition ${
                        paymentMethod === "mpesa"
                          ? "border-[#4CAF50] bg-[#4CAF50]/10"
                          : "border-border bg-card"
                      }`}
                    >
                      <span className="text-lg font-extrabold text-[#4CAF50]">
                        M
                      </span>
                      <span className="text-xs font-semibold text-[#4CAF50]">
                        M-PESA
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Safaricom
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("airtel")}
                      className={`rounded-xl border-2 p-3 flex flex-col items-center gap-1 transition ${
                        paymentMethod === "airtel"
                          ? "border-[#E0001A] bg-[#E0001A]/10"
                          : "border-border bg-card"
                      }`}
                    >
                      <span className="text-lg font-extrabold text-[#E0001A]">
                        A
                      </span>
                      <span className="text-xs font-semibold text-[#E0001A]">
                        Airtel Money
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Airtel
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Kenyan Phone Number
                  </Label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 0712345678"
                    className="mt-1"
                    data-ocid="member.input"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    You will receive an STK push on this number to enter your
                    PIN.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDepositStep("amount")}
                    data-ocid="member.cancel_button"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className={`flex-1 font-semibold ${
                      paymentMethod === "mpesa"
                        ? "bg-[#4CAF50] hover:bg-[#43A047] text-white"
                        : "bg-[#E0001A] hover:bg-[#C0001A] text-white"
                    }`}
                    onClick={handleSendSTK}
                    data-ocid="member.confirm_button"
                  >
                    Send STK Push
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* STEP 3: Processing */}
          {depositStep === "processing" && (
            <div className="py-6 flex flex-col items-center gap-4 text-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  paymentMethod === "mpesa"
                    ? "bg-[#4CAF50]/10"
                    : "bg-[#E0001A]/10"
                }`}
              >
                <Loader2
                  className={`w-8 h-8 animate-spin ${
                    paymentMethod === "mpesa"
                      ? "text-[#4CAF50]"
                      : "text-[#E0001A]"
                  }`}
                />
              </div>
              <div>
                <p className="font-bold text-base">
                  {paymentMethod === "mpesa" ? "M-PESA" : "Airtel Money"}{" "}
                  Request Sent
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Check your phone{" "}
                  <span className="font-semibold text-foreground">
                    {formatPhone(phoneNumber)}
                  </span>{" "}
                  for the STK push prompt.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your{" "}
                  <span className="font-semibold text-foreground">
                    {paymentMethod === "mpesa" ? "M-PESA" : "Airtel Money"} PIN
                  </span>{" "}
                  on your phone to complete the payment.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Please wait...</p>
              <p className="text-xs text-muted-foreground">
                Sending to:{" "}
                <span className="font-medium">+254 740 023 681</span>
              </p>
            </div>
          )}

          {/* STEP 4: Success */}
          {depositStep === "success" && (
            <div className="py-6 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-base">
                  Deposit Request Submitted!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  KES {Number.parseFloat(depositAmount).toLocaleString()} via{" "}
                  {paymentMethod === "mpesa" ? "M-PESA" : "Airtel Money"} is
                  pending admin approval.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Funds will reflect in your balance once the admin approves.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sent to: <span className="font-medium">+254 740 023 681</span>
                </p>
              </div>
              <Button
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                onClick={() => {
                  setDepositOpen(false);
                  resetDepositDialog();
                }}
                data-ocid="member.confirm_button"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── LOAN DIALOG ─── */}
      <Dialog open={loanOpen} onOpenChange={setLoanOpen}>
        <DialogContent
          className="max-w-[90vw] rounded-2xl"
          data-ocid="member.dialog"
        >
          <DialogHeader>
            <DialogTitle>Request a Loan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Loan Amount (KES)</Label>
              <Input
                type="number"
                min="1"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="Enter loan amount"
                className="mt-1"
                data-ocid="member.input"
              />
            </div>
            {loanAmountNum > 0 && (
              <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Principal</span>
                  <span className="font-medium">
                    {formatAmount(BigInt(Math.round(loanAmountNum)))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest (10%)</span>
                  <span className="font-medium text-destructive">
                    +{formatAmount(BigInt(Math.round(interest)))}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total Repayment</span>
                  <span className="text-primary">
                    {formatAmount(BigInt(Math.round(totalRepay)))}
                  </span>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setLoanOpen(false)}
                data-ocid="member.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleLoanRequest}
                disabled={loanMutation.isPending}
                data-ocid="member.confirm_button"
              >
                {loanMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── INSTALL APP DIALOG ─── */}
      <Dialog open={installDialogOpen} onOpenChange={setInstallDialogOpen}>
        <DialogContent
          className="max-w-[90vw] rounded-2xl"
          data-ocid="member.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Install TogetherAsOne
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="bg-muted rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm font-bold text-foreground mb-1">
                  Android (Chrome)
                </p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
                  <li>Open this app in Chrome browser</li>
                  <li>Tap the 3-dot menu (⋮) at the top right</li>
                  <li>Tap "Add to Home Screen"</li>
                  <li>Tap "Install"</li>
                </ol>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-bold text-foreground mb-1">
                  iPhone (Safari)
                </p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
                  <li>Open this app in Safari browser</li>
                  <li>Tap the Share button (box with arrow ↑)</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add"</li>
                </ol>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Once installed, TogetherAsOne opens like a native app — full
              screen with no browser bar.
            </p>
            <Button
              type="button"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setInstallDialogOpen(false)}
              data-ocid="member.confirm_button"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={changePwOpen}
        onOpenChange={(o) => {
          setChangePwOpen(o);
          if (!o) {
            setCurrentPw("");
            setNewPw("");
            setConfirmNewPw("");
          }
        }}
      >
        <DialogContent data-ocid="member.dialog">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="cur-pw">Current Password</Label>
              <div className="relative mt-1">
                <Input
                  id="cur-pw"
                  type={showCurrentPw ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  data-ocid="member.input"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrentPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="new-pw-m">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="new-pw-m"
                  type={showNewPwM ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  data-ocid="member.input"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwM((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNewPwM ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-pw-m">Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirm-pw-m"
                  type={showConfirmPwM ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmNewPw}
                  onChange={(e) => setConfirmNewPw(e.target.value)}
                  data-ocid="member.input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwM((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPwM ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setChangePwOpen(false)}
              data-ocid="member.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={
                changePwLoading || !currentPw || !newPw || !confirmNewPw
              }
              style={{ background: "#0B4A37" }}
              data-ocid="member.submit_button"
            >
              {changePwLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <KeyRound className="w-4 h-4 mr-2" />
              )}
              Change Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── NOTIFICATION PANEL ─── */}
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
              data-ocid="member.primary_button"
            >
              Install
            </Button>
            <button
              type="button"
              onClick={() => setInstallPrompt(null)}
              className="text-white/60 hover:text-white text-lg leading-none shrink-0"
              aria-label="Dismiss"
            >
              &times;
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
