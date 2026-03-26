import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Cpu, Loader2 } from "lucide-react";
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

export function RegisterView({ onLogin, onNavigate }: Props) {
  const { actor } = useActor();
  const [name, setName] = useState("");
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
      const res = await actor.register(name, email, password);
      if (res.__kind__ === "ok") {
        toast.success("Account created! Welcome to the group.");
        onLogin(userToStored(res.ok));
      } else {
        toast.error(res.err);
      }
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" data-ocid="register.page">
      <div
        className="px-6 py-6 flex items-center gap-3 text-white"
        style={{
          background:
            "linear-gradient(135deg, #0B4A37 0%, #1a6b52 60%, #C6A24D 100%)",
        }}
      >
        <button
          type="button"
          onClick={() => onNavigate("login")}
          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
          data-ocid="register.link"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          <span className="text-lg font-bold">Sultantech</span>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <Card className="shadow-card-md border-0">
          <CardContent className="pt-6">
            <h2 className="text-lg font-bold text-foreground mb-1">
              Create Account
            </h2>
            <p className="text-muted-foreground text-sm mb-5">
              Join the savings group today
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="mt-1"
                  data-ocid="register.input"
                />
              </div>
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
                  data-ocid="register.input"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  className="mt-1"
                  data-ocid="register.input"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                disabled={loading}
                data-ocid="register.submit_button"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5">
              Already have an account?{" "}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => onNavigate("login")}
                data-ocid="register.link"
              >
                Sign in
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
