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
export interface DepositRequest {
    id: string;
    status: DepositStatus;
    userId: string;
    timestamp: bigint;
    amount: bigint;
}
export interface WithdrawalRequest {
    id: string;
    status: WithdrawalStatus;
    userId: string;
    timestamp: bigint;
    amount: bigint;
    note: string;
}
export interface LoanPayment {
    id: string;
    loanId: string;
    userId: string;
    amount: bigint;
    timestamp: bigint;
}
export interface MonthlyContribution {
    id: string;
    userId: string;
    month: bigint;
    year: bigint;
    amount: bigint;
    timestamp: bigint;
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
export interface BroadcastNotification {
    id: string;
    title: string;
    body: string;
    timestamp: bigint;
}
export enum LoanStatus {
    pending = "pending",
    paid = "paid",
    approved = "approved",
    rejected = "rejected"
}
export enum DepositStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum WithdrawalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMember(adminId: string, name: string, email: string, password: string): Promise<{ __kind__: "ok"; ok: User } | { __kind__: "err"; err: string }>;
    approveLoan(adminId: string, loanId: string): Promise<{ __kind__: "ok"; ok: Loan } | { __kind__: "err"; err: string }>;
    approveDeposit(adminId: string, depositId: string): Promise<{ __kind__: "ok"; ok: DepositRequest } | { __kind__: "err"; err: string }>;
    rejectDeposit(adminId: string, depositId: string): Promise<{ __kind__: "ok"; ok: DepositRequest } | { __kind__: "err"; err: string }>;
    requestDeposit(userId: string, amount: bigint): Promise<{ __kind__: "ok"; ok: DepositRequest } | { __kind__: "err"; err: string }>;
    getAllPendingDeposits(adminId: string): Promise<{ __kind__: "ok"; ok: Array<DepositRequest> } | { __kind__: "err"; err: string }>;
    getMyDepositRequests(userId: string): Promise<{ __kind__: "ok"; ok: Array<DepositRequest> } | { __kind__: "err"; err: string }>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deposit(adminId: string, userId: string, amount: bigint): Promise<{ __kind__: "ok"; ok: bigint } | { __kind__: "err"; err: string }>;
    adminDeposit(adminId: string, memberId: string, amount: bigint): Promise<{ __kind__: "ok"; ok: bigint } | { __kind__: "err"; err: string }>;
    getAllMembers(adminId: string): Promise<{ __kind__: "ok"; ok: Array<MemberSummary> } | { __kind__: "err"; err: string }>;
    getAllPendingLoans(adminId: string): Promise<{ __kind__: "ok"; ok: Array<Loan> } | { __kind__: "err"; err: string }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMemberDetail(adminId: string, userId: string): Promise<{ __kind__: "ok"; ok: MemberDetail } | { __kind__: "err"; err: string }>;
    getMyLoans(userId: string): Promise<{ __kind__: "ok"; ok: Array<Loan> } | { __kind__: "err"; err: string }>;
    getMyProfile(callerId: string): Promise<{ __kind__: "ok"; ok: User } | { __kind__: "err"; err: string }>;
    getMyTransactions(userId: string): Promise<{ __kind__: "ok"; ok: Array<Transaction> } | { __kind__: "err"; err: string }>;
    getTotalSavings(adminId: string): Promise<{ __kind__: "ok"; ok: bigint } | { __kind__: "err"; err: string }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    login(email: string, password: string): Promise<{ __kind__: "ok"; ok: User } | { __kind__: "err"; err: string }>;
    markLoanPaid(adminId: string, loanId: string): Promise<{ __kind__: "ok"; ok: Loan } | { __kind__: "err"; err: string }>;
    register(name: string, email: string, password: string): Promise<{ __kind__: "ok"; ok: User } | { __kind__: "err"; err: string }>;
    rejectLoan(adminId: string, loanId: string): Promise<{ __kind__: "ok"; ok: Loan } | { __kind__: "err"; err: string }>;
    removeMember(adminId: string, userId: string): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
    requestLoan(userId: string, amount: bigint): Promise<{ __kind__: "ok"; ok: Loan } | { __kind__: "err"; err: string }>;
    resetMember(adminId: string, userId: string): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
    resetMemberPassword(adminId: string, memberId: string, newPassword: string): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ __kind__: "ok"; ok: string } | { __kind__: "err"; err: string }>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    makeRepayment(userId: string, loanId: string, amount: bigint): Promise<{ __kind__: "ok"; ok: LoanPayment } | { __kind__: "err"; err: string }>;
    getLoanPayments(loanId: string): Promise<{ __kind__: "ok"; ok: Array<LoanPayment> } | { __kind__: "err"; err: string }>;
    getMyLoanPayments(userId: string): Promise<{ __kind__: "ok"; ok: Array<LoanPayment> } | { __kind__: "err"; err: string }>;
    requestWithdrawal(userId: string, amount: bigint, note: string): Promise<{ __kind__: "ok"; ok: WithdrawalRequest } | { __kind__: "err"; err: string }>;
    approveWithdrawal(adminId: string, withdrawalId: string): Promise<{ __kind__: "ok"; ok: WithdrawalRequest } | { __kind__: "err"; err: string }>;
    rejectWithdrawal(adminId: string, withdrawalId: string): Promise<{ __kind__: "ok"; ok: WithdrawalRequest } | { __kind__: "err"; err: string }>;
    getAllPendingWithdrawals(adminId: string): Promise<{ __kind__: "ok"; ok: Array<WithdrawalRequest> } | { __kind__: "err"; err: string }>;
    getMyWithdrawalRequests(userId: string): Promise<{ __kind__: "ok"; ok: Array<WithdrawalRequest> } | { __kind__: "err"; err: string }>;
    setMonthlyContributionAmount(adminId: string, amount: bigint): Promise<{ __kind__: "ok"; ok: bigint } | { __kind__: "err"; err: string }>;
    getMonthlyContributionAmount(): Promise<bigint>;
    recordContribution(adminId: string, userId: string, month: bigint, year: bigint, amount: bigint): Promise<{ __kind__: "ok"; ok: MonthlyContribution } | { __kind__: "err"; err: string }>;
    getContributionSummary(adminId: string, month: bigint, year: bigint): Promise<{ __kind__: "ok"; ok: Array<MonthlyContribution> } | { __kind__: "err"; err: string }>;
    getMyContributions(userId: string): Promise<{ __kind__: "ok"; ok: Array<MonthlyContribution> } | { __kind__: "err"; err: string }>;
    sendBroadcastNotification(adminId: string, title: string, body: string): Promise<{ __kind__: "ok"; ok: BroadcastNotification } | { __kind__: "err"; err: string }>;
    getBroadcastNotifications(): Promise<Array<BroadcastNotification>>;
}
