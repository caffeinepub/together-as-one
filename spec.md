# TogetherAsOne

## Current State
The app has savings groups management with login/registration, admin and member dashboards, deposit requests (pending/approve/reject), loan requests (pending/approve/reject/paid), push notifications, M-Pesa payment simulation, PDF constitution download, and PWA install support.

## Requested Changes (Diff)

### Add
- **Loan Repayment Tracking**: Members can make partial payments toward approved loans. Backend tracks each payment, calculates remaining balance. Loan auto-marked as paid when balance hits zero.
- **Withdrawal Requests**: Members can request to withdraw savings. Admin approves (deducts savings) or rejects. Flow mirrors deposit requests.
- **Monthly Contribution Schedule**: Admin can set a monthly contribution target amount. Admin records monthly contributions per member. Admin sees a summary of who has paid each month. Members see their contribution history.

### Modify
- Admin Member Detail view: add loan repayment section showing payments made and remaining balance.
- Admin dashboard: add withdrawal requests pending count and tab.
- Member dashboard: add withdrawal request button and monthly contribution status.
- MyLoans view: show remaining balance and repayment button for approved loans.

### Remove
- Nothing removed.

## Implementation Plan
1. Update `main.mo`: add `LoanPayment`, `WithdrawalRequest`, `MonthlyContribution` types and stable storage. Add functions: `makeRepayment`, `getLoanPayments`, `requestWithdrawal`, `approveWithdrawal`, `rejectWithdrawal`, `getAllPendingWithdrawals`, `getMyWithdrawalRequests`, `setMonthlyContributionAmount`, `getMonthlyContributionAmount`, `recordContribution`, `getContributionSummary`, `getMyContributions`.
2. Update `backend.d.ts` and `backend.ts` with new types and methods.
3. Add frontend views: `WithdrawView.tsx`, `MonthlyContributionsView.tsx`, `AdminWithdrawalsView.tsx`, `AdminContributionsView.tsx`.
4. Update existing views to show repayment UI, withdrawal button, contribution status.
5. Update `useQueries.ts` with new hooks.
