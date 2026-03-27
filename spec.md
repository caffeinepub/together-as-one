# TogetherAsOne

## Current State
Mobile-first PWA for savings groups. Has member/admin dashboards, loans, deposits, transactions, notifications, PDF download.

## Requested Changes (Diff)

### Add
- CalculatorView with standard calculator + financial tabs (loan repayment, savings goal)
- `"calculator"` to ViewType

### Modify
- types.ts: add `"calculator"` to ViewType
- App.tsx: route calculator view
- MemberDashboardView: add Calculator link
- AdminDashboardView: add Calculator link

### Remove
- Nothing

## Implementation Plan
1. Add `"calculator"` to ViewType in types.ts
2. Create CalculatorView.tsx
3. Wire in App.tsx
4. Add Calculator links in both dashboards
5. Validate
