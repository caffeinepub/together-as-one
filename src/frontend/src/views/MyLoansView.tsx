import { Badge } from "@/components/ui/badge";
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
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LoanStatus } from "../backend.d";
import {
  useGetLoanPayments,
  useGetMyLoans,
  useMakeRepayment,
} from "../hooks/useQueries";
import { formatAmount, formatDate } from "../types";

interface Props {
  userId: string;
  onBack: () => void;
}

function loanBadge(status: LoanStatus) {
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
          Approved
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

function LoanPaymentsSection({
  loanId,
  totalDue,
}: { loanId: string; totalDue: bigint }) {
  const { data: payments, isLoading } = useGetLoanPayments(loanId);

  if (isLoading) {
    return (
      <div className="mt-2 text-xs text-muted-foreground animate-pulse">
        Loading payments...
      </div>
    );
  }

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
    <div className="mt-3 space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Repaid</span>
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
        <span className="text-muted-foreground">Remaining</span>
        <span className="font-semibold text-destructive">
          {formatAmount(remaining)}
        </span>
      </div>
      {payments && payments.length > 0 && (
        <div className="mt-2 border-t pt-2 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">
            Payment History
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
    </div>
  );
}

export function MyLoansView({ userId, onBack }: Props) {
  const { data: loans, isLoading } = useGetMyLoans(userId);
  const repayMutation = useMakeRepayment();

  const [repayOpen, setRepayOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [repayAmount, setRepayAmount] = useState("");

  const openRepay = (loanId: string) => {
    setSelectedLoanId(loanId);
    setRepayAmount("");
    setRepayOpen(true);
  };

  const handleRepay = async () => {
    const amt = Number(repayAmount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await repayMutation.mutateAsync({
        userId,
        loanId: selectedLoanId,
        amount: BigInt(Math.round(amt)),
      });
      toast.success("Repayment recorded successfully!");
      setRepayOpen(false);
      setRepayAmount("");
    } catch (e: any) {
      toast.error(e.message ?? "Repayment failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" data-ocid="loans.page">
      <header className="bg-card border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0"
          data-ocid="loans.button"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-bold text-base">My Loans</h1>
      </header>

      <div
        className="px-4 py-4 text-white"
        style={{ background: "linear-gradient(to right, #0B4A37, #C6A24D)" }}
      >
        <p className="font-semibold text-sm">
          {loans?.length ?? 0} Loan Records
        </p>
        <p className="text-white/70 text-xs mt-0.5">All your loan requests</p>
      </div>

      <main className="flex-1 px-4 py-4 space-y-3">
        {isLoading ? (
          <div
            className="flex justify-center py-10"
            data-ocid="loans.loading_state"
          >
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !loans || loans.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="loans.empty_state"
          >
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No loans yet</p>
            <p className="text-sm mt-1">Request a loan from your dashboard</p>
          </div>
        ) : (
          loans.map((loan, i) => {
            const totalDue = loan.amount + loan.interest;
            return (
              <Card
                key={loan.id}
                className="border-0 shadow-card"
                data-ocid={`loans.item.${i + 1}`}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold">Loan Request</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(loan.timestamp)}
                      </p>
                    </div>
                    {loanBadge(loan.status)}
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Principal</span>
                      <span className="font-medium">
                        {formatAmount(loan.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Interest (10%)
                      </span>
                      <span className="font-medium text-destructive">
                        +{formatAmount(loan.interest)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1.5 mt-1">
                      <span>Total Due</span>
                      <span className="text-primary">
                        {formatAmount(totalDue)}
                      </span>
                    </div>
                  </div>

                  {/* Repayment progress for approved loans */}
                  {loan.status === LoanStatus.approved && (
                    <>
                      <LoanPaymentsSection
                        loanId={loan.id}
                        totalDue={totalDue}
                      />
                      <Button
                        size="sm"
                        className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                        onClick={() => openRepay(loan.id)}
                        data-ocid="loans.primary_button"
                      >
                        <TrendingDown className="w-3.5 h-3.5 mr-1.5" /> Make
                        Repayment
                      </Button>
                    </>
                  )}

                  {/* Show payment history for paid/cleared loans */}
                  {loan.status === LoanStatus.paid && (
                    <>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-success font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        This loan has been fully cleared
                      </div>
                      <LoanPaymentsSection
                        loanId={loan.id}
                        totalDue={totalDue}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </main>

      {/* Repayment Dialog */}
      <Dialog open={repayOpen} onOpenChange={setRepayOpen}>
        <DialogContent
          className="max-w-[90vw] rounded-2xl"
          data-ocid="loans.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-primary" /> Make a Repayment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Amount (KES)</Label>
              <Input
                type="number"
                min="1"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder="Enter repayment amount"
                className="mt-1"
                data-ocid="loans.input"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You can make partial or full repayments. The loan will be marked
              as cleared once fully paid by admin.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setRepayOpen(false)}
                data-ocid="loans.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleRepay}
                disabled={repayMutation.isPending}
                data-ocid="loans.confirm_button"
              >
                {repayMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Confirm Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
