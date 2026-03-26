/* eslint-disable */

// @ts-nocheck

import { IDL } from '@icp-sdk/core/candid';

export const User = IDL.Record({
  'id' : IDL.Text,
  'name' : IDL.Text,
  'role' : IDL.Text,
  'email' : IDL.Text,
  'savings' : IDL.Nat,
  'passwordHash' : IDL.Text,
  'lastLogin' : IDL.Int,
});
export const LoanStatus = IDL.Variant({
  'pending' : IDL.Null,
  'paid' : IDL.Null,
  'approved' : IDL.Null,
  'rejected' : IDL.Null,
});
export const DepositStatus = IDL.Variant({
  'pending' : IDL.Null,
  'approved' : IDL.Null,
  'rejected' : IDL.Null,
});
export const Loan = IDL.Record({
  'id' : IDL.Text,
  'status' : LoanStatus,
  'interest' : IDL.Nat,
  'userId' : IDL.Text,
  'timestamp' : IDL.Int,
  'amount' : IDL.Nat,
});
export const DepositRequest = IDL.Record({
  'id' : IDL.Text,
  'status' : DepositStatus,
  'userId' : IDL.Text,
  'timestamp' : IDL.Int,
  'amount' : IDL.Nat,
});
export const UserRole = IDL.Variant({
  'admin' : IDL.Null,
  'user' : IDL.Null,
  'guest' : IDL.Null,
});
export const MemberSummary = IDL.Record({
  'id' : IDL.Text,
  'name' : IDL.Text,
  'loanCount' : IDL.Nat,
  'email' : IDL.Text,
  'savings' : IDL.Nat,
});
export const UserProfile = IDL.Record({
  'id' : IDL.Text,
  'name' : IDL.Text,
  'role' : IDL.Text,
  'email' : IDL.Text,
  'savings' : IDL.Nat,
  'lastLogin' : IDL.Int,
});
export const Transaction = IDL.Record({
  'id' : IDL.Text,
  'userId' : IDL.Text,
  'timestamp' : IDL.Int,
  'amount' : IDL.Nat,
});
export const MemberDetail = IDL.Record({
  'user' : User,
  'loans' : IDL.Vec(Loan),
  'transactions' : IDL.Vec(Transaction),
});

export const idlService = IDL.Service({
  '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
  'addMember' : IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Text],
      [IDL.Variant({ 'ok' : User, 'err' : IDL.Text })],
      [],
    ),
  'adminDeposit' : IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat],
      [IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text })],
      [],
    ),
  'approveLoan' : IDL.Func(
      [IDL.Text, IDL.Text],
      [IDL.Variant({ 'ok' : Loan, 'err' : IDL.Text })],
      [],
    ),
  'approveDeposit' : IDL.Func(
      [IDL.Text, IDL.Text],
      [IDL.Variant({ 'ok' : DepositRequest, 'err' : IDL.Text })],
      [],
    ),
  'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
  'deposit' : IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat],
      [IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text })],
      [],
    ),
  'getAllMembers' : IDL.Func(
      [IDL.Text],
      [IDL.Variant({ 'ok' : IDL.Vec(MemberSummary), 'err' : IDL.Text })],
      ['query'],
    ),
  'getAllPendingDeposits' : IDL.Func(
      [IDL.Text],
      [IDL.Variant({ 'ok' : IDL.Vec(DepositRequest), 'err' : IDL.Text })],
      ['query'],
    ),
  'getAllPendingLoans' : IDL.Func(
      [IDL.Text],
      [IDL.Variant({ 'ok' : IDL.Vec(Loan), 'err' : IDL.Text })],
      ['query'],
    ),
  'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
  'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
  'getMemberDetail' : IDL.Func(
      [IDL.Text, IDL.Text],
      [IDL.Variant({ 'ok' : MemberDetail, 'err' : IDL.Text })],
      ['query'],
    ),
  'getMyDepositRequests' : IDL.Func(
      [IDL.Text],
      [IDL.Variant({ 'ok' : IDL.Vec(DepositRequest), 'err' : IDL.Text })],
      ['query'],
    ),
  'getMyLoans' : IDL.Func(
      [IDL.Text],
      [IDL.Variant({ 'ok' : IDL.Vec(Loan), 'err' : IDL.Text })],
      ['query'],
    ),
  'getMyProfile' : IDL.Func(
      [IDL.Text],
      [IDL.Variant({ 'ok' : User, 'err' : IDL.Text })],
      ['query'],
    ),
  'getMyTransactions' : IDL.Func(
      [IDL.Text],
      [IDL.Variant({ 'ok' : IDL.Vec(Transaction), 'err' : IDL.Text })],
      ['query'],
    ),
  'getTotalSavings' : IDL.Func(
      [IDL.Text],
      [IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text })],
      ['query'],
    ),
  'getUserProfile' : IDL.Func(
      [IDL.Principal],
      [IDL.Opt(UserProfile)],
      ['query'],
    ),
  'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
  'login' : IDL.Func(
      [IDL.Text, IDL.Text],
      [IDL.Variant({ 'ok' : User, 'err' : IDL.Text })],
      [],
    ),
  'markLoanPaid' : IDL.Func(
      [IDL.Text, IDL.Text],
      [IDL.Variant({ 'ok' : Loan, 'err' : IDL.Text })],
      [],
    ),
  'register' : IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text],
      [IDL.Variant({ 'ok' : User, 'err' : IDL.Text })],
      [],
    ),
  'rejectDeposit' : IDL.Func(
      [IDL.Text, IDL.Text],
      [IDL.Variant({ 'ok' : DepositRequest, 'err' : IDL.Text })],
      [],
    ),
  'rejectLoan' : IDL.Func(
      [IDL.Text, IDL.Text],
      [IDL.Variant({ 'ok' : Loan, 'err' : IDL.Text })],
      [],
    ),
  'removeMember' : IDL.Func(
      [IDL.Text, IDL.Text],
      [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })],
      [],
    ),
  'requestDeposit' : IDL.Func(
      [IDL.Text, IDL.Nat],
      [IDL.Variant({ 'ok' : DepositRequest, 'err' : IDL.Text })],
      [],
    ),
  'requestLoan' : IDL.Func(
      [IDL.Text, IDL.Nat],
      [IDL.Variant({ 'ok' : Loan, 'err' : IDL.Text })],
      [],
    ),
  'resetMember' : IDL.Func(
      [IDL.Text, IDL.Text],
      [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })],
      [],
    ),
  'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const User = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Text,
    'role' : IDL.Text,
    'email' : IDL.Text,
    'savings' : IDL.Nat,
    'passwordHash' : IDL.Text,
    'lastLogin' : IDL.Int,
  });
  const LoanStatus = IDL.Variant({
    'pending' : IDL.Null,
    'paid' : IDL.Null,
    'approved' : IDL.Null,
    'rejected' : IDL.Null,
  });
  const DepositStatus = IDL.Variant({
    'pending' : IDL.Null,
    'approved' : IDL.Null,
    'rejected' : IDL.Null,
  });
  const Loan = IDL.Record({
    'id' : IDL.Text,
    'status' : LoanStatus,
    'interest' : IDL.Nat,
    'userId' : IDL.Text,
    'timestamp' : IDL.Int,
    'amount' : IDL.Nat,
  });
  const DepositRequest = IDL.Record({
    'id' : IDL.Text,
    'status' : DepositStatus,
    'userId' : IDL.Text,
    'timestamp' : IDL.Int,
    'amount' : IDL.Nat,
  });
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'user' : IDL.Null,
    'guest' : IDL.Null,
  });
  const MemberSummary = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Text,
    'loanCount' : IDL.Nat,
    'email' : IDL.Text,
    'savings' : IDL.Nat,
  });
  const UserProfile = IDL.Record({
    'id' : IDL.Text,
    'name' : IDL.Text,
    'role' : IDL.Text,
    'email' : IDL.Text,
    'savings' : IDL.Nat,
    'lastLogin' : IDL.Int,
  });
  const Transaction = IDL.Record({
    'id' : IDL.Text,
    'userId' : IDL.Text,
    'timestamp' : IDL.Int,
    'amount' : IDL.Nat,
  });
  const MemberDetail = IDL.Record({
    'user' : User,
    'loans' : IDL.Vec(Loan),
    'transactions' : IDL.Vec(Transaction),
  });

  return IDL.Service({
    '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
    'addMember' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text],
        [IDL.Variant({ 'ok' : User, 'err' : IDL.Text })],
        [],
      ),
    'adminDeposit' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat],
        [IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text })],
        [],
      ),
    'approveLoan' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Variant({ 'ok' : Loan, 'err' : IDL.Text })],
        [],
      ),
    'approveDeposit' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Variant({ 'ok' : DepositRequest, 'err' : IDL.Text })],
        [],
      ),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'deposit' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Nat],
        [IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text })],
        [],
      ),
    'getAllMembers' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Vec(MemberSummary), 'err' : IDL.Text })],
        ['query'],
      ),
    'getAllPendingDeposits' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Vec(DepositRequest), 'err' : IDL.Text })],
        ['query'],
      ),
    'getAllPendingLoans' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Vec(Loan), 'err' : IDL.Text })],
        ['query'],
      ),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getMemberDetail' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Variant({ 'ok' : MemberDetail, 'err' : IDL.Text })],
        ['query'],
      ),
    'getMyDepositRequests' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Vec(DepositRequest), 'err' : IDL.Text })],
        ['query'],
      ),
    'getMyLoans' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Vec(Loan), 'err' : IDL.Text })],
        ['query'],
      ),
    'getMyProfile' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'ok' : User, 'err' : IDL.Text })],
        ['query'],
      ),
    'getMyTransactions' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Vec(Transaction), 'err' : IDL.Text })],
        ['query'],
      ),
    'getTotalSavings' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text })],
        ['query'],
      ),
    'getUserProfile' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'login' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Variant({ 'ok' : User, 'err' : IDL.Text })],
        [],
      ),
    'markLoanPaid' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Variant({ 'ok' : Loan, 'err' : IDL.Text })],
        [],
      ),
    'register' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [IDL.Variant({ 'ok' : User, 'err' : IDL.Text })],
        [],
      ),
    'rejectDeposit' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Variant({ 'ok' : DepositRequest, 'err' : IDL.Text })],
        [],
      ),
    'rejectLoan' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Variant({ 'ok' : Loan, 'err' : IDL.Text })],
        [],
      ),
    'removeMember' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })],
        [],
      ),
    'requestDeposit' : IDL.Func(
        [IDL.Text, IDL.Nat],
        [IDL.Variant({ 'ok' : DepositRequest, 'err' : IDL.Text })],
        [],
      ),
    'requestLoan' : IDL.Func(
        [IDL.Text, IDL.Nat],
        [IDL.Variant({ 'ok' : Loan, 'err' : IDL.Text })],
        [],
      ),
    'resetMember' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })],
        [],
      ),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
  });
};

export const init = ({ IDL }) => { return []; };