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
  Clock,
  CreditCard,
  FileText,
  Leaf,
  Loader2,
  LogOut,
  PiggyBank,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useDeposit,
  useGetMyProfile,
  useGetMyTransactions,
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

export function MemberDashboardView({ user, onLogout, onNavigate }: Props) {
  const { data: profile, isLoading } = useGetMyProfile(user.id);
  const { data: transactions } = useGetMyTransactions(user.id);
  const depositMutation = useDeposit();
  const loanMutation = useRequestLoan();

  const [depositOpen, setDepositOpen] = useState(false);
  const [loanOpen, setLoanOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [loanAmount, setLoanAmount] = useState("");

  const savings = profile ? profile.savings : BigInt(user.savings);
  const recentTxs = (transactions ?? []).slice(0, 3);

  const loanAmountNum = Number.parseFloat(loanAmount) || 0;
  const interest = loanAmountNum * 0.1;
  const totalRepay = loanAmountNum + interest;

  const handleDeposit = async () => {
    const amount = Number.parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await depositMutation.mutateAsync({
        userId: user.id,
        amount: BigInt(Math.round(amount)),
      });
      toast.success(
        `Successfully deposited ${formatAmount(BigInt(Math.round(amount)))}`,
      );
      setDepositOpen(false);
      setDepositAmount("");
    } catch (e: any) {
      toast.error(e.message ?? "Deposit failed");
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
      toast.success("Loan request submitted successfully!");
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
          <Leaf className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm text-primary">
            Together As One
          </span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition"
          data-ocid="member.button"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
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

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onNavigate("transactions")}
            className="bg-card rounded-xl p-4 shadow-card text-left flex flex-col gap-2 hover:shadow-card-md transition"
            data-ocid="member.link"
          >
            <FileText className="w-5 h-5 text-primary" />
            <p className="text-sm font-semibold text-foreground">
              Transactions
            </p>
            <p className="text-xs text-muted-foreground">View history</p>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-1" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("my-loans")}
            className="bg-card rounded-xl p-4 shadow-card text-left flex flex-col gap-2 hover:shadow-card-md transition"
            data-ocid="member.link"
          >
            <TrendingUp className="w-5 h-5 text-accent" />
            <p className="text-sm font-semibold text-foreground">My Loans</p>
            <p className="text-xs text-muted-foreground">View all loans</p>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-1" />
          </button>
        </div>

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

      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent
          className="max-w-[90vw] rounded-2xl"
          data-ocid="member.dialog"
        >
          <DialogHeader>
            <DialogTitle>Deposit Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Amount (₦)</Label>
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
                onClick={handleDeposit}
                disabled={depositMutation.isPending}
                data-ocid="member.confirm_button"
              >
                {depositMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Deposit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <Label>Loan Amount (₦)</Label>
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
