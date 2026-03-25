import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MemberSummary {
    id: string;
    name: string;
    loanCount: bigint;
    email: string;
    savings: bigint;
}
export interface MemberDetail {
    user: User;
    loans: Array<Loan>;
    transactions: Array<Transaction>;
}
export interface User {
    id: string;
    name: string;
    role: string;
    email: string;
    savings: bigint;
    passwordHash: string;
    lastLogin: bigint;
}
export interface Loan {
    id: string;
    status: LoanStatus;
    interest: bigint;
    userId: string;
    timestamp: bigint;
    amount: bigint;
}
export interface UserProfile {
    id: string;
    name: string;
    role: string;
    email: string;
    savings: bigint;
    lastLogin: bigint;
}
export interface Transaction {
    id: string;
    userId: string;
    timestamp: bigint;
    amount: bigint;
}
export enum LoanStatus {
    pending = "pending",
    paid = "paid",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMember(name: string, email: string, password: string): Promise<{
        __kind__: "ok";
        ok: User;
    } | {
        __kind__: "err";
        err: string;
    }>;
    approveLoan(loanId: string): Promise<{
        __kind__: "ok";
        ok: Loan;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deposit(userId: string, amount: bigint): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAllMembers(): Promise<{
        __kind__: "ok";
        ok: Array<MemberSummary>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAllPendingLoans(): Promise<{
        __kind__: "ok";
        ok: Array<Loan>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMemberDetail(userId: string): Promise<{
        __kind__: "ok";
        ok: MemberDetail;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getMyLoans(userId: string): Promise<{
        __kind__: "ok";
        ok: Array<Loan>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getMyProfile(callerId: string): Promise<{
        __kind__: "ok";
        ok: User;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getMyTransactions(userId: string): Promise<{
        __kind__: "ok";
        ok: Array<Transaction>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getTotalSavings(): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    login(email: string, password: string): Promise<{
        __kind__: "ok";
        ok: User;
    } | {
        __kind__: "err";
        err: string;
    }>;
    markLoanPaid(loanId: string): Promise<{
        __kind__: "ok";
        ok: Loan;
    } | {
        __kind__: "err";
        err: string;
    }>;
    register(name: string, email: string, password: string): Promise<{
        __kind__: "ok";
        ok: User;
    } | {
        __kind__: "err";
        err: string;
    }>;
    rejectLoan(loanId: string): Promise<{
        __kind__: "ok";
        ok: Loan;
    } | {
        __kind__: "err";
        err: string;
    }>;
    removeMember(userId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    requestLoan(userId: string, amount: bigint): Promise<{
        __kind__: "ok";
        ok: Loan;
    } | {
        __kind__: "err";
        err: string;
    }>;
    resetMember(userId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
