import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDownCircle,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { LoanStatus } from "../backend.d";
import {
  useApproveLoan,
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
          Paid
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

export function AdminMemberDetailView({ memberId, onBack }: Props) {
  const { data: detail, isLoading } = useGetMemberDetail(memberId);
  const approveMutation = useApproveLoan();
  const rejectMutation = useRejectLoan();
  const markPaidMutation = useMarkLoanPaid();
  const resetMutation = useResetMember();

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
      toast.success("Loan marked as paid!");
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
                {detail.loans.map((loan, i) => (
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
                      {loan.status === LoanStatus.approved && (
                        <Button
                          size="sm"
                          className="w-full h-7 text-xs mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => handleMarkPaid(loan.id)}
                          disabled={markPaidMutation.isPending}
                          data-ocid="admin_detail.primary_button"
                        >
                          <CreditCard className="w-3 h-3 mr-1" /> Mark as Paid
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
