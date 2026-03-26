# Sultantech

## Current State
The auto-generated `backend.ts` file is out of sync with the actual Motoko backend (`main.mo`). Every admin function in the Motoko backend takes `adminUserId: Text` as its first argument (e.g. `getAllMembers(adminUserId)`, `addMember(adminUserId, name, email, password)`) but the `Backend` class in `backend.ts` was generated when those functions had no adminId parameter. As a result:
- Admin functions silently drop the adminId passed by `useQueries.ts` (cast via `as any`)
- The underlying Candid actor call has too few arguments, causing "too few arguments" / "Unauthorized" errors
- Deposit-related functions (`approveDeposit`, `rejectDeposit`, `getAllPendingDeposits`, `getMyDepositRequests`, `requestDeposit`, `adminDeposit`) are missing entirely from `backend.ts`
- Admin login appears to fail because after login, dashboard data calls all fail

## Requested Changes (Diff)

### Add
- `DepositRequest` and `DepositStatus` types to `backend.ts`
- Missing methods to `Backend` class: `adminDeposit`, `approveDeposit`, `rejectDeposit`, `getAllPendingDeposits`, `getMyDepositRequests`, `requestDeposit`
- Candid conversion helpers for DepositRequest/DepositStatus in `backend.ts`

### Modify
- `backend.ts` Backend class: fix all admin methods to accept and pass adminId as first arg:
  - `addMember(adminId, name, email, password)` -> calls `this.actor.addMember(adminId, name, email, password)`
  - `approveLoan(adminId, loanId)` -> calls `this.actor.approveLoan(adminId, loanId)`
  - `deposit(adminId, userId, amount)` -> calls `this.actor.deposit(adminId, userId, amount)`
  - `getAllMembers(adminId)` -> calls `this.actor.getAllMembers(adminId)`
  - `getAllPendingLoans(adminId)` -> calls `this.actor.getAllPendingLoans(adminId)`
  - `getMemberDetail(adminId, userId)` -> calls `this.actor.getMemberDetail(adminId, userId)`
  - `getTotalSavings(adminId)` -> calls `this.actor.getTotalSavings(adminId)`
  - `markLoanPaid(adminId, loanId)` -> calls `this.actor.markLoanPaid(adminId, loanId)`
  - `rejectLoan(adminId, loanId)` -> calls `this.actor.rejectLoan(adminId, loanId)`
  - `removeMember(adminId, userId)` -> calls `this.actor.removeMember(adminId, userId)`
  - `resetMember(adminId, userId)` -> calls `this.actor.resetMember(adminId, userId)`

### Remove
- Nothing

## Implementation Plan
1. Update `src/frontend/src/backend.ts`:
   - Add `DepositStatus` enum and `DepositRequest` interface
   - Fix all Backend class method signatures to include adminId where needed
   - Add all missing deposit-related Backend methods
   - Add from_candid conversion helpers for DepositRequest/DepositStatus
2. Validate build
