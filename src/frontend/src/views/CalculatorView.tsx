import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

interface Props {
  onBack: () => void;
}

type CalcOp = "+" | "-" | "*" | "/" | null;

function formatKES(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function StandardCalculator() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<CalcOp>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : `${display}${digit}`);
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(`${display}.`);
    }
  };

  const handleOperator = (op: CalcOp) => {
    const current = Number.parseFloat(display);
    if (prevValue !== null && operator && !waitingForOperand) {
      const result = calculate(prevValue, current, operator);
      setDisplay(String(result));
      setPrevValue(result);
      setExpression(`${result} ${op}`);
    } else {
      setPrevValue(current);
      setExpression(`${current} ${op}`);
    }
    setOperator(op);
    setWaitingForOperand(true);
  };

  const calculate = (a: number, b: number, op: CalcOp): number => {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b !== 0 ? a / b : Number.NaN;
      default:
        return b;
    }
  };

  const handleEquals = () => {
    const current = Number.parseFloat(display);
    if (prevValue !== null && operator) {
      const result = calculate(prevValue, current, operator);
      const resultStr = Number.isNaN(result)
        ? "Error"
        : String(Number.parseFloat(result.toFixed(10)));
      setExpression(`${prevValue} ${operator} ${current} =`);
      setDisplay(resultStr);
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setExpression("");
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleBackspace = () => {
    if (waitingForOperand) return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handleToggleSign = () => {
    const value = Number.parseFloat(display);
    if (!Number.isNaN(value)) {
      setDisplay(String(-value));
    }
  };

  const handlePercent = () => {
    const value = Number.parseFloat(display);
    if (!Number.isNaN(value)) {
      setDisplay(String(value / 100));
    }
  };

  const displayNum = Number.parseFloat(display);
  const formattedDisplay =
    !Number.isNaN(displayNum) && display !== "Error"
      ? displayNum.toLocaleString("en-KE", { maximumFractionDigits: 10 })
      : display;

  type BtnDef = {
    label: string;
    action: () => void;
    variant: "number" | "operator" | "equals" | "function";
  };

  const buttons: BtnDef[] = [
    { label: "C", action: handleClear, variant: "function" },
    { label: "+/-", action: handleToggleSign, variant: "function" },
    { label: "%", action: handlePercent, variant: "function" },
    { label: "\u00f7", action: () => handleOperator("/"), variant: "operator" },
    { label: "7", action: () => handleDigit("7"), variant: "number" },
    { label: "8", action: () => handleDigit("8"), variant: "number" },
    { label: "9", action: () => handleDigit("9"), variant: "number" },
    { label: "\u00d7", action: () => handleOperator("*"), variant: "operator" },
    { label: "4", action: () => handleDigit("4"), variant: "number" },
    { label: "5", action: () => handleDigit("5"), variant: "number" },
    { label: "6", action: () => handleDigit("6"), variant: "number" },
    { label: "\u2212", action: () => handleOperator("-"), variant: "operator" },
    { label: "1", action: () => handleDigit("1"), variant: "number" },
    { label: "2", action: () => handleDigit("2"), variant: "number" },
    { label: "3", action: () => handleDigit("3"), variant: "number" },
    { label: "+", action: () => handleOperator("+"), variant: "operator" },
    { label: "\u232b", action: handleBackspace, variant: "function" },
    { label: "0", action: () => handleDigit("0"), variant: "number" },
    { label: ".", action: handleDecimal, variant: "number" },
    { label: "=", action: handleEquals, variant: "equals" },
  ];

  const variantClass = {
    number: "bg-card text-foreground hover:bg-muted active:scale-95 shadow-sm",
    operator:
      "bg-accent/15 text-accent font-bold hover:bg-accent/25 active:scale-95",
    equals:
      "bg-primary text-primary-foreground font-bold hover:bg-primary/90 active:scale-95",
    function:
      "bg-muted text-muted-foreground hover:bg-muted/80 active:scale-95",
  };

  return (
    <div className="px-4 py-4">
      {/* Display */}
      <div className="bg-card rounded-2xl p-4 mb-4 shadow-sm border">
        <p className="text-right text-xs text-muted-foreground h-4 overflow-hidden">
          {expression}
        </p>
        <p
          className="text-right font-bold text-foreground mt-1 overflow-hidden text-ellipsis"
          style={{
            fontSize:
              display.length > 10
                ? "1.5rem"
                : display.length > 7
                  ? "2rem"
                  : "2.5rem",
          }}
        >
          {formattedDisplay}
        </p>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2.5">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            className={`h-16 rounded-2xl text-lg font-semibold transition-all duration-100 ${variantClass[btn.variant]}`}
            data-ocid="calculator.button"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FinancialCalculator() {
  // Loan calculator
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [months, setMonths] = useState("");

  // Savings goal
  const [target, setTarget] = useState("");
  const [monthlySavings, setMonthlySavings] = useState("");

  const P = Number.parseFloat(principal) || 0;
  const annualRate = Number.parseFloat(rate) || 0;
  const n = Number.parseFloat(months) || 0;
  const r = annualRate / 100 / 12;

  let monthlyPayment = 0;
  let totalRepayment = 0;
  if (P > 0 && r > 0 && n > 0) {
    const factor = (1 + r) ** n;
    monthlyPayment = (P * r * factor) / (factor - 1);
    totalRepayment = monthlyPayment * n;
  } else if (P > 0 && r === 0 && n > 0) {
    monthlyPayment = P / n;
    totalRepayment = P;
  }

  const targetNum = Number.parseFloat(target) || 0;
  const monthlySavingsNum = Number.parseFloat(monthlySavings) || 0;
  const monthsToGoal =
    targetNum > 0 && monthlySavingsNum > 0
      ? Math.ceil(targetNum / monthlySavingsNum)
      : 0;
  const goalDate =
    monthsToGoal > 0
      ? (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + monthsToGoal);
          return d.toLocaleDateString("en-KE", {
            month: "long",
            year: "numeric",
          });
        })()
      : null;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Loan Calculator */}
      <Card className="border shadow-sm" data-ocid="calculator.card">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-xs font-bold">%</span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">
              Loan Calculator
            </h3>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">
              Principal Amount (KES)
            </Label>
            <Input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="e.g. 50000"
              className="mt-1"
              data-ocid="calculator.input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">
                Annual Interest Rate (%)
              </Label>
              <Input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 10"
                className="mt-1"
                data-ocid="calculator.input"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Duration (months)
              </Label>
              <Input
                type="number"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                placeholder="e.g. 12"
                className="mt-1"
                data-ocid="calculator.input"
              />
            </div>
          </div>

          {P > 0 && n > 0 && (
            <div className="bg-primary/5 rounded-xl p-3 space-y-2 mt-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Monthly Payment
                </span>
                <span className="text-sm font-bold text-primary">
                  {formatKES(monthlyPayment)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Total Repayment
                </span>
                <span className="text-sm font-bold text-accent">
                  {formatKES(totalRepayment)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Total Interest
                </span>
                <span className="text-sm font-semibold text-destructive">
                  {formatKES(totalRepayment - P)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Savings Goal */}
      <Card className="border shadow-sm" data-ocid="calculator.card">
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-accent text-xs font-bold">&#127919;</span>
            </div>
            <h3 className="font-semibold text-sm text-foreground">
              Savings Goal
            </h3>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">
              Target Amount (KES)
            </Label>
            <Input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 100000"
              className="mt-1"
              data-ocid="calculator.input"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Monthly Savings (KES)
            </Label>
            <Input
              type="number"
              value={monthlySavings}
              onChange={(e) => setMonthlySavings(e.target.value)}
              placeholder="e.g. 5000"
              className="mt-1"
              data-ocid="calculator.input"
            />
          </div>

          {monthsToGoal > 0 && goalDate && (
            <div className="bg-accent/5 rounded-xl p-3 space-y-2 mt-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Months to Goal
                </span>
                <span className="text-sm font-bold text-primary">
                  {monthsToGoal} months
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Estimated Date
                </span>
                <span className="text-sm font-bold text-accent">
                  {goalDate}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function CalculatorView({ onBack }: Props) {
  return (
    <div className="min-h-screen flex flex-col" data-ocid="calculator.page">
      <header className="bg-card border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-muted transition"
          aria-label="Back"
          data-ocid="calculator.button"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-sm font-bold">&plusmn;</span>
          </div>
          <h1 className="font-bold text-base text-foreground">Calculator</h1>
        </div>
      </header>

      <main className="flex-1">
        <Tabs defaultValue="standard" className="w-full">
          <div className="px-4 pt-3">
            <TabsList className="w-full" data-ocid="calculator.tab">
              <TabsTrigger
                value="standard"
                className="flex-1"
                data-ocid="calculator.tab"
              >
                Standard
              </TabsTrigger>
              <TabsTrigger
                value="financial"
                className="flex-1"
                data-ocid="calculator.tab"
              >
                Financial
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="standard">
            <StandardCalculator />
          </TabsContent>
          <TabsContent value="financial">
            <FinancialCalculator />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="text-center py-3 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()}. Built with &hearts; using{" "}
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
