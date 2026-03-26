import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cpu, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { User } from "../backend.d";
import { useActor } from "../hooks/useActor";
import type { StoredUser, ViewType } from "../types";

interface Props {
  onLogin: (user: StoredUser) => void;
  onNavigate: (view: ViewType) => void;
}

function userToStored(u: User): StoredUser {
  return {
    id: u.id,
    name: u.name,
    role: u.role,
    email: u.email,
    savings: u.savings.toString(),
    lastLogin: u.lastLogin.toString(),
  };
}

export function LoginView({ onLogin, onNavigate }: Props) {
  const { actor } = useActor();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) {
      toast.error("Connecting to server...");
      return;
    }
    setLoading(true);
    try {
      const res = await actor.login(email, password);
      if (res.__kind__ === "ok") {
        toast.success("Welcome back! Login successful.");
        onLogin(userToStored(res.ok));
      } else {
        toast.error(res.err);
      }
    } catch {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" data-ocid="login.page">
      <div
        className="px-6 py-8 flex flex-col items-center text-white"
        style={{
          background:
            "linear-gradient(135deg, #0B4A37 0%, #1a6b52 60%, #C6A24D 100%)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Sultantech</span>
        </div>
        <p className="text-white/80 text-sm italic mt-1">
          "World of Technology"
        </p>
        <p className="text-white/60 text-xs mt-4">Savings Group Management</p>
      </div>

      <div className="flex-1 px-4 py-6">
        <Card className="shadow-card-md border-0">
          <CardContent className="pt-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Sign In</h2>
            <p className="text-muted-foreground text-sm mb-5">
              Welcome back to your savings group
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="mt-1"
                  data-ocid="login.input"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="mt-1"
                  data-ocid="login.input"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-2.5"
                disabled={loading}
                data-ocid="login.submit_button"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5">
              Not a member yet?{" "}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => onNavigate("register")}
                data-ocid="login.link"
              >
                Register here
              </button>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Admin? Use <span className="font-mono text-xs">admin@gmail.com</span>
        </p>
      </div>

      <footer className="text-center py-4 px-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
