/* eslint-disable */

// @ts-nocheck

import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

export interface Loan {
  'id' : string,
  'status' : LoanStatus,
  'interest' : bigint,
  'userId' : string,
  'timestamp' : bigint,
  'amount' : bigint,
}
export type LoanStatus = { 'pending' : null } |
  { 'paid' : null } |
  { 'approved' : null } |
  { 'rejected' : null };
export interface DepositRequest {
  'id' : string,
  'status' : DepositStatus,
  'userId' : string,
  'timestamp' : bigint,
  'amount' : bigint,
}
export type DepositStatus = { 'pending' : null } |
  { 'approved' : null } |
  { 'rejected' : null };
export interface MemberDetail {
  'user' : User,
  'loans' : Array<Loan>,
  'transactions' : Array<Transaction>,
}
export interface MemberSummary {
  'id' : string,
  'name' : string,
  'loanCount' : bigint,
  'email' : string,
  'savings' : bigint,
}
export interface Transaction {
  'id' : string,
  'userId' : string,
  'timestamp' : bigint,
  'amount' : bigint,
}
export interface User {
  'id' : string,
  'name' : string,
  'role' : string,
  'email' : string,
  'savings' : bigint,
  'passwordHash' : string,
  'lastLogin' : bigint,
}
export interface UserProfile {
  'id' : string,
  'name' : string,
  'role' : string,
  'email' : string,
  'savings' : bigint,
  'lastLogin' : bigint,
}
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface LoanPayment {
  'id' : string,
  'loanId' : string,
  'userId' : string,
  'amount' : bigint,
  'timestamp' : bigint,
}
export type WithdrawalStatus = { 'pending' : null } |
  { 'approved' : null } |
  { 'rejected' : null };
export interface WithdrawalRequest {
  'id' : string,
  'status' : WithdrawalStatus,
  'userId' : string,
  'timestamp' : bigint,
  'amount' : bigint,
  'note' : string,
}
export interface MonthlyContribution {
  'id' : string,
  'userId' : string,
  'month' : bigint,
  'year' : bigint,
  'amount' : bigint,
  'timestamp' : bigint,
}
export interface BroadcastNotification {
  'id' : string,
  'title' : string,
  'body' : string,
  'timestamp' : bigint,
}
export interface _SERVICE {
  '_initializeAccessControlWithSecret' : ActorMethod<[string], undefined>,
  'addMember' : ActorMethod<
    [string, string, string, string],
    { 'ok' : User } | { 'err' : string }
  >,
  'adminDeposit' : ActorMethod<
    [string, string, bigint],
    { 'ok' : bigint } | { 'err' : string }
  >,
  'approveLoan' : ActorMethod<[string, string], { 'ok' : Loan } | { 'err' : string }>,
  'approveDeposit' : ActorMethod<[string, string], { 'ok' : DepositRequest } | { 'err' : string }>,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'deposit' : ActorMethod<
    [string, string, bigint],
    { 'ok' : bigint } | { 'err' : string }
  >,
  'getAllMembers' : ActorMethod<
    [string],
    { 'ok' : Array<MemberSummary> } | { 'err' : string }
  >,
  'getAllPendingDeposits' : ActorMethod<
    [string],
    { 'ok' : Array<DepositRequest> } | { 'err' : string }
  >,
  'getAllPendingLoans' : ActorMethod<
    [string],
    { 'ok' : Array<Loan> } | { 'err' : string }
  >,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getMemberDetail' : ActorMethod<
    [string, string],
    { 'ok' : MemberDetail } | { 'err' : string }
  >,
  'getMyDepositRequests' : ActorMethod<
    [string],
    { 'ok' : Array<DepositRequest> } | { 'err' : string }
  >,
  'getMyLoans' : ActorMethod<
    [string],
    { 'ok' : Array<Loan> } | { 'err' : string }
  >,
  'getMyProfile' : ActorMethod<[string], { 'ok' : User } | { 'err' : string }>,
  'getMyTransactions' : ActorMethod<
    [string],
    { 'ok' : Array<Transaction> } | { 'err' : string }
  >,
  'getTotalSavings' : ActorMethod<[string], { 'ok' : bigint } | { 'err' : string }>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'login' : ActorMethod<[string, string], { 'ok' : User } | { 'err' : string }>,
  'markLoanPaid' : ActorMethod<[string, string], { 'ok' : Loan } | { 'err' : string }>,
  'register' : ActorMethod<
    [string, string, string],
    { 'ok' : User } | { 'err' : string }
  >,
  'rejectDeposit' : ActorMethod<[string, string], { 'ok' : DepositRequest } | { 'err' : string }>,
  'rejectLoan' : ActorMethod<[string, string], { 'ok' : Loan } | { 'err' : string }>,
  'removeMember' : ActorMethod<
    [string, string],
    { 'ok' : string } | { 'err' : string }
  >,
  'requestDeposit' : ActorMethod<
    [string, bigint],
    { 'ok' : DepositRequest } | { 'err' : string }
  >,
  'requestLoan' : ActorMethod<
    [string, bigint],
    { 'ok' : Loan } | { 'err' : string }
  >,
  'resetMember' : ActorMethod<[string, string], { 'ok' : string } | { 'err' : string }>,
  'makeRepayment' : ActorMethod<[string, string, bigint], { 'ok' : LoanPayment } | { 'err' : string }>,
  'getLoanPayments' : ActorMethod<[string], { 'ok' : Array<LoanPayment> } | { 'err' : string }>,
  'getMyLoanPayments' : ActorMethod<[string], { 'ok' : Array<LoanPayment> } | { 'err' : string }>,
  'requestWithdrawal' : ActorMethod<[string, bigint, string], { 'ok' : WithdrawalRequest } | { 'err' : string }>,
  'approveWithdrawal' : ActorMethod<[string, string], { 'ok' : WithdrawalRequest } | { 'err' : string }>,
  'rejectWithdrawal' : ActorMethod<[string, string], { 'ok' : WithdrawalRequest } | { 'err' : string }>,
  'getAllPendingWithdrawals' : ActorMethod<[string], { 'ok' : Array<WithdrawalRequest> } | { 'err' : string }>,
  'getMyWithdrawalRequests' : ActorMethod<[string], { 'ok' : Array<WithdrawalRequest> } | { 'err' : string }>,
  'setMonthlyContributionAmount' : ActorMethod<[string, bigint], { 'ok' : bigint } | { 'err' : string }>,
  'getMonthlyContributionAmount' : ActorMethod<[], bigint>,
  'recordContribution' : ActorMethod<[string, string, bigint, bigint, bigint], { 'ok' : MonthlyContribution } | { 'err' : string }>,
  'getContributionSummary' : ActorMethod<[string, bigint, bigint], { 'ok' : Array<MonthlyContribution> } | { 'err' : string }>,
  'getMyContributions' : ActorMethod<[string], { 'ok' : Array<MonthlyContribution> } | { 'err' : string }>,
  'sendBroadcastNotification' : ActorMethod<[string, string, string], { 'ok' : BroadcastNotification } | { 'err' : string }>,
  'getBroadcastNotifications' : ActorMethod<[], Array<BroadcastNotification>>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];