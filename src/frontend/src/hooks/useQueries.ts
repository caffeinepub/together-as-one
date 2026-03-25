import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Loan,
  MemberDetail,
  MemberSummary,
  Transaction,
  User,
} from "../backend.d";
import { useActor } from "./useActor";

export type { User, MemberSummary, MemberDetail, Transaction, Loan };

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
  });
}

export function useGetAllMembers() {
  const { actor, isFetching } = useActor();
  return useQuery<MemberSummary[]>({
    queryKey: ["members"],
    queryFn: async () => {
      if (!actor) return [];
      const res = await actor.getAllMembers();
      if (res.__kind__ === "ok") return res.ok;
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTotalSavings() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["totalSavings"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      const res = await actor.getTotalSavings();
      if (res.__kind__ === "ok") return res.ok;
      return BigInt(0);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllPendingLoans() {
  const { actor, isFetching } = useActor();
  return useQuery<Loan[]>({
    queryKey: ["pendingLoans"],
    queryFn: async () => {
      if (!actor) return [];
      const res = await actor.getAllPendingLoans();
      if (res.__kind__ === "ok") return res.ok;
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMemberDetail(userId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<MemberDetail | null>({
    queryKey: ["memberDetail", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      const res = await actor.getMemberDetail(userId);
      if (res.__kind__ === "ok") return res.ok;
      return null;
    },
    enabled: !!actor && !isFetching && !!userId,
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
      const res = await actor.deposit(userId, amount);
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
      const res = await actor.addMember(name, email, password);
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
      const res = await actor.removeMember(userId);
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
      const res = await actor.approveLoan(loanId);
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
      const res = await actor.rejectLoan(loanId);
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
      const res = await actor.markLoanPaid(loanId);
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
      const res = await actor.resetMember(userId);
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
