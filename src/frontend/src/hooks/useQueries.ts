import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DepositRequest,
  backendInterface as ExtendedBackendInterface,
  Loan,
  MemberDetail,
  MemberSummary,
  Transaction,
  User,
} from "../backend.d";
import { useActor } from "./useActor";

export type {
  User,
  MemberSummary,
  MemberDetail,
  Transaction,
  Loan,
  DepositRequest,
};

function getStoredAdminId(): string {
  try {
    const stored = localStorage.getItem("tao_user");
    if (!stored) return "";
    return (JSON.parse(stored) as { id: string }).id ?? "";
  } catch {
    return "";
  }
}

export function useGetMyTransactions(userId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["transactions", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      const res = await actor.getMyTransactions(userId);
      if (res.__kind__ === "ok") return res.ok;
      return [];
    },
    enabled: !!actor && !isFetching && !!userId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useGetMyLoans(userId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Loan[]>({
    queryKey: ["loans", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      const res = await actor.getMyLoans(userId);
      if (res.__kind__ === "ok") return res.ok;
      return [];
    },
    enabled: !!actor && !isFetching && !!userId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useGetMyProfile(userId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<User | null>({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      const res = await actor.getMyProfile(userId);
      if (res.__kind__ === "ok") return res.ok;
      return null;
    },
    enabled: !!actor && !isFetching && !!userId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useGetAllMembers() {
  const { actor } = useActor();
  return useQuery<MemberSummary[]>({
    queryKey: ["members"],
    queryFn: async () => {
      if (!actor) return [];
      const adminId = getStoredAdminId();
      const res = await (actor as any).getAllMembers(adminId);
      if (res.__kind__ === "ok") return res.ok;
      // Throw the error so it surfaces instead of silently returning empty
      throw new Error(res.err ?? "Failed to load members");
    },
    enabled: !!actor,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
    retry: 2,
  });
}

export function useGetTotalSavings() {
  const { actor } = useActor();
  return useQuery<bigint>({
    queryKey: ["totalSavings"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      const res = await (actor as any).getTotalSavings(getStoredAdminId());
      if (res.__kind__ === "ok") return res.ok;
      return BigInt(0);
    },
    enabled: !!actor,
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 10000,
  });
}

export function useGetAllPendingLoans() {
  const { actor } = useActor();
  return useQuery<Loan[]>({
    queryKey: ["pendingLoans"],
    queryFn: async () => {
      if (!actor) return [];
      const res = await (actor as any).getAllPendingLoans(getStoredAdminId());
      if (res.__kind__ === "ok") return res.ok;
      return [];
    },
    enabled: !!actor,
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 10000,
  });
}

export function useGetAllPendingDeposits() {
  const { actor } = useActor();
  return useQuery<DepositRequest[]>({
    queryKey: ["pendingDeposits"],
    queryFn: async () => {
      if (!actor) return [];
      const extActor = actor as unknown as ExtendedBackendInterface;
      const res = await extActor.getAllPendingDeposits(getStoredAdminId());
      if (res.__kind__ === "ok") return res.ok;
      return [];
    },
    enabled: !!actor,
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 10000,
  });
}

export function useGetMyDepositRequests(userId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<DepositRequest[]>({
    queryKey: ["depositRequests", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      const extActor = actor as unknown as ExtendedBackendInterface;
      const res = await extActor.getMyDepositRequests(userId);
      if (res.__kind__ === "ok") return res.ok;
      return [];
    },
    enabled: !!actor && !isFetching && !!userId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useGetMemberDetail(userId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<MemberDetail | null>({
    queryKey: ["memberDetail", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      const res = await (actor as any).getMemberDetail(
        getStoredAdminId(),
        userId,
      );
      if (res.__kind__ === "ok") return res.ok;
      return null;
    },
    enabled: !!actor && !isFetching && !!userId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useRequestDeposit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      amount,
    }: { userId: string; amount: bigint }) => {
      if (!actor) throw new Error("No actor");
      const extActor = actor as unknown as ExtendedBackendInterface;
      const res = await extActor.requestDeposit(userId, amount);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["depositRequests", vars.userId] });
      qc.invalidateQueries({ queryKey: ["pendingDeposits"] });
    },
  });
}

export function useApproveDeposit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (depositId: string) => {
      if (!actor) throw new Error("No actor");
      const res = await (actor as any).approveDeposit(
        getStoredAdminId(),
        depositId,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendingDeposits"] });
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["totalSavings"] });
      qc.invalidateQueries({ queryKey: ["memberDetail"] });
    },
  });
}

export function useRejectDeposit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (depositId: string) => {
      if (!actor) throw new Error("No actor");
      const res = await (actor as any).rejectDeposit(
        getStoredAdminId(),
        depositId,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendingDeposits"] });
    },
  });
}

export function useDeposit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      amount,
    }: { userId: string; amount: bigint }) => {
      if (!actor) throw new Error("No actor");
      const res = await (actor as any).deposit(
        getStoredAdminId(),
        userId,
        amount,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["profile", vars.userId] });
      qc.invalidateQueries({ queryKey: ["transactions", vars.userId] });
      qc.invalidateQueries({ queryKey: ["totalSavings"] });
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useAdminDeposit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberId,
      amount,
    }: { memberId: string; amount: bigint }) => {
      if (!actor) throw new Error("No actor");
      const adminId = getStoredAdminId();
      const res = await (actor as any).adminDeposit(adminId, memberId, amount);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: (_data: unknown, vars: { memberId: string; amount: bigint }) => {
      qc.invalidateQueries({ queryKey: ["memberDetail", vars.memberId] });
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["totalSavings"] });
    },
  });
}

export function useRequestLoan() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      amount,
    }: { userId: string; amount: bigint }) => {
      if (!actor) throw new Error("No actor");
      const res = await actor.requestLoan(userId, amount);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["loans", vars.userId] });
      qc.invalidateQueries({ queryKey: ["pendingLoans"] });
    },
  });
}

export function useAddMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      email,
      password,
    }: { name: string; email: string; password: string }) => {
      if (!actor) throw new Error("No actor");
      const res = await (actor as any).addMember(
        getStoredAdminId(),
        name,
        email,
        password,
      );
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useRemoveMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("No actor");
      const res = await (actor as any).removeMember(getStoredAdminId(), userId);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["totalSavings"] });
    },
  });
}

export function useApproveLoan() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (loanId: string) => {
      if (!actor) throw new Error("No actor");
      const res = await (actor as any).approveLoan(getStoredAdminId(), loanId);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendingLoans"] });
      qc.invalidateQueries({ queryKey: ["memberDetail"] });
    },
  });
}

export function useRejectLoan() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (loanId: string) => {
      if (!actor) throw new Error("No actor");
      const res = await (actor as any).rejectLoan(getStoredAdminId(), loanId);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendingLoans"] });
      qc.invalidateQueries({ queryKey: ["memberDetail"] });
    },
  });
}

export function useMarkLoanPaid() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (loanId: string) => {
      if (!actor) throw new Error("No actor");
      const res = await (actor as any).markLoanPaid(getStoredAdminId(), loanId);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["memberDetail"] });
    },
  });
}

export function useResetMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("No actor");
      const res = await (actor as any).resetMember(getStoredAdminId(), userId);
      if (res.__kind__ === "err") throw new Error(res.err);
      return res.ok;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["memberDetail"] });
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["totalSavings"] });
    },
  });
}
