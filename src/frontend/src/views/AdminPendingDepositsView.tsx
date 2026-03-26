import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowDownCircle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { addNotification, useNotifications } from "../hooks/useNotifications";
import {
  useApproveDeposit,
  useGetAllPendingDeposits,
  useRejectDeposit,
} from "../hooks/useQueries";
import { formatAmount, formatDate } from "../types";

interface Props {
  onBack: () => void;
}

export function AdminPendingDepositsView({ onBack }: Props) {
  const { data: deposits, isLoading } = useGetAllPendingDeposits();
  const approveMutation = useApproveDeposit();
  const rejectMutation = useRejectDeposit();
  const { sendNotification } = useNotifications("admin");

  const handleApprove = async (depositId: string) => {
    const deposit = deposits?.find((d) => d.id === depositId);
    try {
      await approveMutation.mutateAsync(depositId);
      toast.success("Deposit approved!");
      if (deposit) {
        addNotification(
          deposit.userId,
          "Deposit Approved",
          `Your deposit of ${formatAmount(deposit.amount)} has been approved!`,
        );
        sendNotification(
          "Deposit Approved",
          `Deposit of ${formatAmount(deposit.amount)} approved successfully.`,
        );
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  const handleReject = async (depositId: string) => {
    const deposit = deposits?.find((d) => d.id === depositId);
    try {
      await rejectMutation.mutateAsync(depositId);
      toast.success("Deposit rejected.");
      if (deposit) {
        addNotification(
          deposit.userId,
          "Deposit Rejected",
          `Your deposit request of ${formatAmount(deposit.amount)} was not approved.`,
        );
        sendNotification(
          "Deposit Rejected",
          `Deposit of ${formatAmount(deposit.amount)} was rejected.`,
        );
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      data-ocid="pending_deposits.page"
    >
      <header className="bg-card border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0"
          data-ocid="pending_deposits.button"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-bold text-base">Pending Deposit Requests</h1>
      </header>

      <div
        className="px-4 py-3 text-white text-sm"
        style={{ background: "linear-gradient(to right, #0B4A37, #C6A24D)" }}
      >
        <p className="font-semibold">
          {deposits?.length ?? 0} Pending Requests
        </p>
      </div>

      <main className="flex-1 px-4 py-4 space-y-3">
        {isLoading ? (
          <div
            className="flex justify-center py-10"
            data-ocid="pending_deposits.loading_state"
          >
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !deposits || deposits.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="pending_deposits.empty_state"
          >
            <ArrowDownCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No pending deposit requests</p>
            <p className="text-sm mt-1">
              All deposit requests have been reviewed
            </p>
          </div>
        ) : (
          deposits.map((deposit, i) => (
            <Card
              key={deposit.id}
              className="border-0 shadow-card"
              data-ocid={`pending_deposits.item.${i + 1}`}
            >
              <CardContent className="pt-3 pb-3">
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    Member ID: {deposit.userId.slice(0, 12)}...
                  </p>
                  <p className="text-sm font-semibold">
                    Requested: {formatDate(deposit.timestamp)}
                  </p>
                </div>
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-muted-foreground">Deposit Amount</span>
                  <span className="font-bold text-primary text-base">
                    {formatAmount(deposit.amount)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs bg-success/10 text-success hover:bg-success/20 border-0"
                    onClick={() => handleApprove(deposit.id)}
                    disabled={approveMutation.isPending}
                    data-ocid="pending_deposits.confirm_button"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs text-destructive border-destructive hover:bg-destructive hover:text-white"
                    onClick={() => handleReject(deposit.id)}
                    disabled={rejectMutation.isPending}
                    data-ocid="pending_deposits.cancel_button"
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
