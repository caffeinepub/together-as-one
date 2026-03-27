# TogetherAsOne

## Current State
The app has full member/admin authentication. There is no password reset or change password feature. Admin can reset a member's savings via `resetMember` but cannot change passwords. Members have no way to change their password.

## Requested Changes (Diff)

### Add
- `resetMemberPassword(adminUserId, memberId, newPassword)` backend function — admin sets a new password for any member
- `changePassword(userId, currentPassword, newPassword)` backend function — member changes their own password
- Admin: "Reset Password" button in AdminMemberDetailView (opens dialog to enter new password)
- Member: "Change Password" option in MemberDashboardView (opens dialog for current + new password)
- Login screen: subtle "Forgot password? Contact your group admin" hint below the login button

### Modify
- `backend.d.ts` and `backend.did.*` — add the two new functions
- AdminMemberDetailView — add reset password dialog
- MemberDashboardView — add change password dialog
- LoginView — add forgot password hint

### Remove
Nothing removed.

## Implementation Plan
1. Add `resetMemberPassword` and `changePassword` to `main.mo`
2. Update Candid declarations (`backend.did.d.ts`, `backend.did.js`, `backend.d.ts`)
3. Add Reset Password dialog in AdminMemberDetailView
4. Add Change Password dialog in MemberDashboardView
5. Add forgot password hint in LoginView
