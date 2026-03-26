import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddMember,
  useGetAllMembers,
  useRemoveMember,
} from "../hooks/useQueries";
import { formatAmount } from "../types";

interface Props {
  onBack: () => void;
  onManageMember: (userId: string) => void;
}

export function AdminMembersView({ onBack, onManageMember }: Props) {
  const {
    data: members,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetAllMembers();
  const addMutation = useAddMember();
  const removeMutation = useRemoveMember();
  const qc = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRefresh = async () => {
    await qc.invalidateQueries({ queryKey: ["members"] });
    await refetch();
  };

  const handleAdd = async () => {
    if (!name || !email || !password) {
      toast.error("Fill all fields");
      return;
    }
    try {
      await addMutation.mutateAsync({ name, email, password });
      toast.success("Member added successfully!");
      setAddOpen(false);
      setName("");
      setEmail("");
      setPassword("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to add member");
    }
  };

  const handleRemove = async (userId: string) => {
    setRemovingId(userId);
    try {
      await removeMutation.mutateAsync(userId);
      toast.success("Member removed.");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" data-ocid="admin_members.page">
      <header className="bg-card border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 w-8 p-0"
          data-ocid="admin_members.button"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-bold text-base flex-1">Members</h1>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleRefresh}
          disabled={isFetching || isLoading}
          data-ocid="admin_members.secondary_button"
        >
          <RefreshCw
            className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
          />
        </Button>
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs"
          onClick={() => setAddOpen(true)}
          data-ocid="admin_members.open_modal_button"
        >
          <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Add
        </Button>
      </header>

      <div
        className="px-4 py-3 text-white text-sm"
        style={{ background: "linear-gradient(to right, #0B4A37, #C6A24D)" }}
      >
        <p className="font-semibold">
          {isFetching && !members
            ? "Loading..."
            : `${members?.length ?? 0} Members`}
        </p>
      </div>

      <main className="flex-1 px-4 py-4 space-y-2">
        {isLoading ? (
          <div
            className="flex justify-center py-10"
            data-ocid="admin_members.loading_state"
          >
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive text-sm font-medium mb-2">
              Failed to load members
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {(error as Error).message}
            </p>
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
            </Button>
          </div>
        ) : !members || members.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="admin_members.empty_state"
          >
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No members yet</p>
            <p className="text-xs mt-1">
              Members who register will appear here
            </p>
            {isFetching && (
              <p className="text-xs mt-2 text-primary">
                Checking for new members...
              </p>
            )}
          </div>
        ) : (
          members.map((m, i) => (
            <Card
              key={m.id}
              className="border-0 shadow-card"
              data-ocid={`admin_members.item.${i + 1}`}
            >
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {m.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {m.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Savings:{" "}
                      <span className="text-success font-medium">
                        {formatAmount(m.savings)}
                      </span>
                      {" · "}
                      {Number(m.loanCount)} loan
                      {Number(m.loanCount) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => onManageMember(m.id)}
                      data-ocid="admin_members.edit_button"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(m.id)}
                      disabled={removingId === m.id}
                      data-ocid="admin_members.delete_button"
                    >
                      {removingId === m.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* Add Member Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          className="max-w-[90vw] rounded-2xl"
          data-ocid="admin_members.dialog"
        >
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label>Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="mt-1"
                data-ocid="admin_members.input"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="mt-1"
                data-ocid="admin_members.input"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="mt-1"
                data-ocid="admin_members.input"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAddOpen(false)}
                data-ocid="admin_members.cancel_button"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleAdd}
                disabled={addMutation.isPending}
                data-ocid="admin_members.confirm_button"
              >
                {addMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Add Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
