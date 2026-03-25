import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useGetMyTransactions } from "../hooks/useQueries";
import { formatAmount, formatDate } from "../types";

interface Props {
  userId: string;
  onBack: () => void;
}

export function TransactionHistoryView({ userId, onBack }: Props) {
  const { data: transactions, isLoading } = useGetMyTransactions(userId);

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
        <h1 className="font-bold text-base">Transaction History</h1>
      </header>

      <div
        className="px-4 py-4 text-white text-sm"
        style={{ background: "linear-gradient(to right, #0B4A37, #C6A24D)" }}
      >
        <p className="font-semibold">
          {transactions?.length ?? 0} Transactions
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
        ) : !transactions || transactions.length === 0 ? (
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
              {transactions.map((tx, i) => (
                <div key={tx.id} data-ocid={`transactions.item.${i + 1}`}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                        <ArrowDownCircle className="w-4 h-4 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Deposit</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.timestamp)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-success">
                      +{formatAmount(tx.amount)}
                    </span>
                  </div>
                  {i < transactions.length - 1 && <div className="border-b" />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
