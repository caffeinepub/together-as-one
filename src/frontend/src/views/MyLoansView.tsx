import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { LoanStatus } from "../backend.d";
import { useGetMyLoans } from "../hooks/useQueries";
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

export function MyLoansView({ userId, onBack }: Props) {
  const { data: loans, isLoading } = useGetMyLoans(userId);

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
          loans.map((loan, i) => (
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
                    <span>Total Repayment</span>
                    <span className="text-primary">
                      {formatAmount(loan.amount + loan.interest)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
