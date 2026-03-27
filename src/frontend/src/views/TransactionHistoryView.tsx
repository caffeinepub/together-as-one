import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowDownCircle,
  ArrowLeft,
  Clock,
  FileDown,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetMyContributions,
  useGetMyDepositRequests,
  useGetMyLoanPayments,
  useGetMyTransactions,
  useGetMyWithdrawalRequests,
} from "../hooks/useQueries";
import { formatAmount, formatDate } from "../types";

interface Props {
  userId: string;
  onBack: () => void;
}

type CombinedItem =
  | { kind: "transaction"; id: string; amount: bigint; timestamp: bigint }
  | {
      kind: "deposit_request";
      id: string;
      amount: bigint;
      timestamp: bigint;
      status: string;
    };

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function tsToDateStr(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-KE");
}

export function TransactionHistoryView({ userId, onBack }: Props) {
  const { data: transactions, isLoading: txLoading } =
    useGetMyTransactions(userId);
  const { data: depositRequests, isLoading: reqLoading } =
    useGetMyDepositRequests(userId);
  const { data: loanPayments, isLoading: lpLoading } =
    useGetMyLoanPayments(userId);
  const { data: withdrawalRequests, isLoading: wrLoading } =
    useGetMyWithdrawalRequests(userId);
  const { data: contributions, isLoading: contribLoading } =
    useGetMyContributions(userId);

  const isLoading =
    txLoading || reqLoading || lpLoading || wrLoading || contribLoading;

  const combined: CombinedItem[] = [
    ...(transactions ?? []).map(
      (tx): CombinedItem => ({
        kind: "transaction",
        id: tx.id,
        amount: tx.amount,
        timestamp: tx.timestamp,
      }),
    ),
    ...(depositRequests ?? [])
      .filter((r) => r.status !== "approved")
      .map(
        (r): CombinedItem => ({
          kind: "deposit_request",
          id: r.id,
          amount: r.amount,
          timestamp: r.timestamp,
          status: r.status,
        }),
      ),
  ].sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));

  const handleDownload = () => {
    const today = new Date().toISOString().slice(0, 10);
    const filename = `TogetherAsOne-Statement-${today}.csv`;
    const rows: string[][] = [
      ["Date", "Type", "Description", "Amount (KES)", "Status"],
    ];

    for (const tx of (transactions ?? []).sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : 1,
    )) {
      rows.push([
        tsToDateStr(tx.timestamp),
        "Deposit",
        "Confirmed deposit",
        String(Number(tx.amount)),
        "Approved",
      ]);
    }

    for (const r of (depositRequests ?? []).sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : 1,
    )) {
      if (r.status === "approved") continue;
      rows.push([
        tsToDateStr(r.timestamp),
        "Deposit Request",
        "M-Pesa / Airtel deposit",
        String(Number(r.amount)),
        r.status.charAt(0).toUpperCase() + r.status.slice(1),
      ]);
    }

    for (const lp of (loanPayments ?? []).sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : 1,
    )) {
      rows.push([
        tsToDateStr(lp.timestamp),
        "Loan Repayment",
        `Repayment for loan ${lp.loanId.slice(0, 8)}`,
        String(Number(lp.amount)),
        "Completed",
      ]);
    }

    for (const wr of (withdrawalRequests ?? []).sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : 1,
    )) {
      rows.push([
        tsToDateStr(wr.timestamp),
        "Withdrawal",
        wr.note || "Withdrawal request",
        String(Number(wr.amount)),
        wr.status.charAt(0).toUpperCase() + wr.status.slice(1),
      ]);
    }

    for (const c of (contributions ?? []).sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : 1,
    )) {
      rows.push([
        tsToDateStr(c.timestamp),
        "Monthly Contribution",
        `Contribution for ${c.month}/${c.year}`,
        String(Number(c.amount)),
        "Recorded",
      ]);
    }

    if (rows.length === 1) {
      toast.info("No transactions to export yet.");
      return;
    }

    downloadCSV(filename, rows);
    toast.success("Statement downloaded!");
  };

  return (
    <div className="min-h-screen flex flex-col" data-ocid="transactions.page">
      <header className="bg-card border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0"
          data-ocid="transactions.button"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-bold text-base flex-1">Transaction History</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="h-8 gap-1.5 text-xs border-primary text-primary hover:bg-primary/5"
          data-ocid="transactions.primary_button"
          disabled={isLoading}
        >
          <FileDown className="w-3.5 h-3.5" />
          Export CSV
        </Button>
      </header>

      <div
        className="px-4 py-4 text-white text-sm"
        style={{ background: "linear-gradient(to right, #0B4A37, #C6A24D)" }}
      >
        <p className="font-semibold">
          {(transactions ?? []).length} Confirmed Deposits
        </p>
        <p className="text-white/70 text-xs mt-0.5">All your deposit history</p>
      </div>

      <main className="flex-1 px-4 py-4">
        {isLoading ? (
          <div
            className="flex justify-center py-10"
            data-ocid="transactions.loading_state"
          >
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : combined.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="transactions.empty_state"
          >
            <ArrowDownCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No transactions yet</p>
            <p className="text-sm mt-1">
              Make your first deposit to get started
            </p>
          </div>
        ) : (
          <Card className="border-0 shadow-card">
            <CardContent className="pt-2 pb-2">
              {combined.map((item, i) => (
                <div key={item.id} data-ocid={`transactions.item.${i + 1}`}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {item.kind === "transaction" ? (
                        <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                          <ArrowDownCircle className="w-4 h-4 text-success" />
                        </div>
                      ) : item.status === "pending" ? (
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                          <XCircle className="w-4 h-4 text-destructive" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold">Deposit</p>
                          {item.kind === "deposit_request" && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                item.status === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {item.status === "pending"
                                ? "Pending"
                                : "Rejected"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.timestamp)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        item.kind === "transaction"
                          ? "text-success"
                          : item.status === "pending"
                            ? "text-amber-500"
                            : "text-destructive"
                      }`}
                    >
                      {item.kind === "transaction" ? "+" : ""}
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                  {i < combined.length - 1 && <div className="border-b" />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
