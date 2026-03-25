# Together As One

## Current State
Full app with auth, dashboards, deposits, loans, admin management. Bug: ensureAdminExists() runs in actor body before postupgrade, then postupgrade Map.add() silently fails on existing keys.

## Requested Changes (Diff)

### Add
- Nothing

### Modify
- Fix ensureAdminExists: fixed ID admin-0, remove+add, preserve savings
- Remove ensureAdminExists from actor body, only call in postupgrade

### Remove
- Duplicate init call

## Implementation Plan
1. Fix ensureAdminExists with remove+add and fixed ID
2. Remove from actor body
3. Keep in postupgrade only
