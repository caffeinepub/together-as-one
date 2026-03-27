import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDownCircle,
  ArrowLeft,
  CheckCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  PiggyBank,
  RotateCcw,
  TrendingDown,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LoanStatus } from "../backend.d";
import {
  useAdminDeposit,
  useApproveLoan,
  useGetLoanPayments,
  useGetMemberDetail,
  useMarkLoanPaid,
  useRejectLoan,
  useResetMember,
} from "../hooks/useQueries";
import { formatAmount, formatDate } from "../types";

interface Props {
  memberId: string;
  onBack: () => void;
}

function LoanBadge({ status }: { status: LoanStatus }) {
  switch (status) {
    case LoanStatus.pending:
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-0 text-xs">
          Pending
        </Badge>
      );
    case LoanStatus.approved:
      return (
        <Badge className="bg-success/10 text-success border-0 text-xs">
          Active
        </Badge>
      );
    case LoanStatus.rejected:
      return (
        <Badge className="bg-destructive/10 text-destructive border-0 text-xs">
          Rejected
        </Badge>
      );
    case LoanStatus.paid:
      return (
        <Badge className="bg-muted text-muted-foreground border-0 text-xs">
          Cleared
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          {status}
        </Badge>
      );
  }
}

function LoanRepaymentDetails({
  loanId,
  totalDue,
  status,
  onMarkPaid,
  isMarkingPaid,
}: {
  loanId: string;
  totalDue: bigint;
  status: LoanStatus;
  onMarkPaid: () => void;
  isMarkingPaid: boolean;
}) {
  const { data: payments } = useGetLoanPayments(loanId);

  const paidTotal = (payments ?? []).reduce(
    (sum, p) => sum + p.amount,
    BigInt(0),
  );
  const remaining = totalDue > paidTotal ? totalDue - paidTotal : BigInt(0);
  const pct =
    totalDue > 0
      ? Math.min(100, Math.round((Number(paidTotal) / Number(totalDue)) * 100))
      : 0;

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
        <TrendingDown className="w-3 h-3" /> Repayment Progress
      </p>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Paid so far</span>
        <span className="font-semibold text-success">
          {formatAmount(paidTotal)}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-success h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Outstanding</span>
        <span className="font-semibold text-destructive">
          {formatAmount(remaining)}
        </span>
      </div>

      {payments && payments.length > 0 && (
        <div className="mt-1 space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground">
            Payment records:
          </p>
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {formatDate(p.timestamp)}
              </span>
              <span className="font-medium text-success">
                +{formatAmount(p.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {status === LoanStatus.approved && (
        <Button
          size="sm"
          className="w-full h-7 text-xs mt-1 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={onMarkPaid}
          disabled={isMarkingPaid}
          data-ocid="admin_detail.primary_button"
        >
          {isMarkingPaid ? (
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
          ) : (
            <CheckCircle2 className="w-3 h-3 mr-1" />
          )}
          Mark as Cleared
        </Button>
      )}

      {status === LoanStatus.paid && (
        <div className="flex items-center gap-1.5 text-xs text-success font-medium mt-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Fully cleared
        </div>
      )}
    </div>
  );
}

export function AdminMemberDetailView({ memberId, onBack }: Props) {
  const { data: detail, isLoading } = useGetMemberDetail(memberId);
  const approveMutation = useApproveLoan();
  const rejectMutation = useRejectLoan();
  const markPaidMutation = useMarkLoanPaid();
  const resetMutation = useResetMember();
  const adminDepositMutation = useAdminDeposit();

  const [savingsDialogOpen, setSavingsDialogOpen] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState("");

  const handleApprove = async (loanId: string) => {
    try {
      await approveMutation.mutateAsync(loanId);
      toast.success("Loan approved!");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  const handleReject = async (loanId: string) => {
    try {
      await rejectMutation.mutateAsync(loanId);
      toast.success("Loan rejected.");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  const handleMarkPaid = async (loanId: string) => {
    try {
      await markPaidMutation.mutateAsync(loanId);
      toast.success("Loan marked as cleared!");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  const handleReset = async () => {
    try {
      await resetMutation.mutateAsync(memberId);
      toast.success("Member account reset.");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  const handleAddSavings = async () => {
    const amt = Number(savingsAmount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      await adminDepositMutation.mutateAsync({ memberId, amount: BigInt(amt) });
      toast.success("Savings added successfully!");
      setSavingsDialogOpen(false);
      setSavingsAmount("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to add savings");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" data-ocid="admin_detail.page">
      <header className="bg-card border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0"
          data-ocid="admin_detail.button"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-bold text-base flex-1">Member Detail</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs text-primary border-primary hover:bg-primary hover:text-white"
            onClick={() => setSavingsDialogOpen(true)}
            data-ocid="admin_detail.open_modal_button"
          >
            <PiggyBank className="w-3.5 h-3.5 mr-1" />
            Add Savings
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs text-destructive border-destructive hover:bg-destructive hover:text-white"
            onClick={handleReset}
            disabled={resetMutation.isPending}
            data-ocid="admin_detail.delete_button"
          >
            {resetMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
            )}
            Reset
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div
          className="flex justify-center py-16"
          data-ocid="admin_detail.loading_state"
        >
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !detail ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="admin_detail.error_state"
        >
          Member not found
        </div>
      ) : (
        <main className="flex-1 px-4 py-4 space-y-4">
          {/* Profile */}
          <Card className="border-0 shadow-card" data-ocid="admin_detail.card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {detail.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{detail.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {detail.user.email}
                  </p>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Savings</span>
                <span className="font-bold text-success">
                  {formatAmount(detail.user.savings)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <div>
            <h3 className="text-sm font-bold mb-2 px-1">
              Transactions ({detail.transactions.length})
            </h3>
            {detail.transactions.length === 0 ? (
              <div
                className="text-center py-6 text-muted-foreground text-sm"
                data-ocid="admin_detail.empty_state"
              >
                No transactions
              </div>
            ) : (
              <Card className="border-0 shadow-card">
                <CardContent className="py-2">
                  {detail.transactions.slice(0, 5).map((tx, i) => (
                    <div key={tx.id} data-ocid={`admin_detail.item.${i + 1}`}>
                      <div className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2">
                          <ArrowDownCircle className="w-4 h-4 text-success" />
                          <div>
                            <p className="text-xs font-medium">Deposit</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(tx.timestamp)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-success">
                          +{formatAmount(tx.amount)}
                        </span>
                      </div>
                      {i < Math.min(detail.transactions.length, 5) - 1 && (
                        <div className="border-b" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Loans */}
          <div>
            <h3 className="text-sm font-bold mb-2 px-1">
              Loans ({detail.loans.length})
            </h3>
            {detail.loans.length === 0 ? (
              <div
                className="text-center py-6 text-muted-foreground text-sm"
                data-ocid="admin_detail.empty_state"
              >
                No loans
              </div>
            ) : (
              <div className="space-y-2">
                {detail.loans.map((loan, i) => {
                  const totalDue = loan.amount + loan.interest;
                  return (
                    <Card
                      key={loan.id}
                      className="border-0 shadow-card"
                      data-ocid={`admin_detail.item.${i + 1}`}
                    >
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-xs font-semibold">
                              {formatDate(loan.timestamp)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatAmount(loan.amount)} +{" "}
                              {formatAmount(loan.interest)} interest
                            </p>
                          </div>
                          <LoanBadge status={loan.status} />
                        </div>
                        <div className="flex justify-between text-xs border-t pt-1.5">
                          <span className="text-muted-foreground">
                            Total Due
                          </span>
                          <span className="font-bold text-primary">
                            {formatAmount(totalDue)}
                          </span>
                        </div>

                        {loan.status === LoanStatus.pending && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              className="flex-1 h-7 text-xs bg-success/10 text-success hover:bg-success/20 border-0"
                              onClick={() => handleApprove(loan.id)}
                              disabled={approveMutation.isPending}
                              data-ocid="admin_detail.confirm_button"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-7 text-xs text-destructive border-destructive hover:bg-destructive hover:text-white"
                              onClick={() => handleReject(loan.id)}
                              disabled={rejectMutation.isPending}
                              data-ocid="admin_detail.cancel_button"
                            >
                              <XCircle className="w-3 h-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )}

                        {(loan.status === LoanStatus.approved ||
                          loan.status === LoanStatus.paid) && (
                          <LoanRepaymentDetails
                            loanId={loan.id}
                            totalDue={totalDue}
                            status={loan.status}
                            onMarkPaid={() => handleMarkPaid(loan.id)}
                            isMarkingPaid={markPaidMutation.isPending}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      )}

      {/* Add Savings Dialog */}
      <Dialog open={savingsDialogOpen} onOpenChange={setSavingsDialogOpen}>
        <DialogContent data-ocid="admin_detail.dialog">
          <DialogHeader>
            <DialogTitle>Add Savings</DialogTitle>
            <DialogDescription>
              Manually credit savings to this member's account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="savings-amount">Amount (KES)</Label>
            <Input
              id="savings-amount"
              type="number"
              min="1"
              placeholder="e.g. 5000"
              value={savingsAmount}
              onChange={(e) => setSavingsAmount(e.target.value)}
              data-ocid="admin_detail.input"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSavingsDialogOpen(false);
                setSavingsAmount("");
              }}
              data-ocid="admin_detail.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSavings}
              disabled={adminDepositMutation.isPending || !savingsAmount}
              style={{ background: "#0B4A37" }}
              data-ocid="admin_detail.submit_button"
            >
              {adminDepositMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <PiggyBank className="w-4 h-4 mr-2" />
              )}
              Add Savings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
