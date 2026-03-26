import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { addNotification, useNotifications } from "../hooks/useNotifications";
import {
  useApproveLoan,
  useGetAllPendingLoans,
  useRejectLoan,
} from "../hooks/useQueries";
import { formatAmount, formatDate } from "../types";

interface Props {
  onBack: () => void;
}

export function AdminPendingLoansView({ onBack }: Props) {
  const { data: loans, isLoading } = useGetAllPendingLoans();
  const approveMutation = useApproveLoan();
  const rejectMutation = useRejectLoan();
  const { sendNotification } = useNotifications("admin");

  const handleApprove = async (loanId: string) => {
    const loan = loans?.find((l) => l.id === loanId);
    try {
      await approveMutation.mutateAsync(loanId);
      toast.success("Loan approved!");
      if (loan) {
        addNotification(
          loan.userId,
          "Loan Approved",
          `Your loan of ${formatAmount(loan.amount)} has been approved!`,
        );
        sendNotification(
          "Loan Approved",
          `Loan of ${formatAmount(loan.amount)} approved successfully.`,
        );
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  const handleReject = async (loanId: string) => {
    const loan = loans?.find((l) => l.id === loanId);
    try {
      await rejectMutation.mutateAsync(loanId);
      toast.success("Loan rejected.");
      if (loan) {
        addNotification(
          loan.userId,
          "Loan Rejected",
          `Your loan request of ${formatAmount(loan.amount)} was not approved.`,
        );
        sendNotification(
          "Loan Rejected",
          `Loan of ${formatAmount(loan.amount)} was rejected.`,
        );
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" data-ocid="pending_loans.page">
      <header className="bg-card border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0"
          data-ocid="pending_loans.button"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-bold text-base">Pending Loan Requests</h1>
      </header>

      <div
        className="px-4 py-3 text-white text-sm"
        style={{ background: "linear-gradient(to right, #0B4A37, #C6A24D)" }}
      >
        <p className="font-semibold">{loans?.length ?? 0} Pending Requests</p>
      </div>

      <main className="flex-1 px-4 py-4 space-y-3">
        {isLoading ? (
          <div
            className="flex justify-center py-10"
            data-ocid="pending_loans.loading_state"
          >
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !loans || loans.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="pending_loans.empty_state"
          >
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No pending requests</p>
            <p className="text-sm mt-1">All loan requests have been reviewed</p>
          </div>
        ) : (
          loans.map((loan, i) => (
            <Card
              key={loan.id}
              className="border-0 shadow-card"
              data-ocid={`pending_loans.item.${i + 1}`}
            >
              <CardContent className="pt-3 pb-3">
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Member ID: {loan.userId.slice(0, 12)}...
                  </p>
                  <p className="text-sm font-semibold">
                    Requested: {formatDate(loan.timestamp)}
                  </p>
                </div>
                <div className="space-y-1 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loan Amount</span>
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
                  <div className="flex justify-between font-bold border-t pt-1.5">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatAmount(loan.amount + loan.interest)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs bg-success/10 text-success hover:bg-success/20 border-0"
                    onClick={() => handleApprove(loan.id)}
                    disabled={approveMutation.isPending}
                    data-ocid="pending_loans.confirm_button"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs text-destructive border-destructive hover:bg-destructive hover:text-white"
                    onClick={() => handleReject(loan.id)}
                    disabled={rejectMutation.isPending}
                    data-ocid="pending_loans.cancel_button"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
