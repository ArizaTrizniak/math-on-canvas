# Email Verification Recovery — Design Spec

**Date:** 2026-04-26
**Repos affected:** math-on-canvas, math_poster_editor

## Problem

If a user closes the verification modal before entering the confirmation code, the `pendingConfirmEmail` state is cleared and there is no obvious way to complete verification. The account exists but does not work.

## Solution: Intercept `user_not_confirmed` on sign-in (Approach A)

When a user tries to sign in with an unverified account, the backend returns HTTP 403 with `error: "user_not_confirmed"`. Instead of displaying this as an error message, the frontend automatically sends a fresh code and transitions to the `confirmEmail` view.

The recovery path becomes: **try to sign in → automatically redirected to email verification**.

## Backend

No changes required.

- **Sign-in error:** `POST /auth/signin` → HTTP 403, `{ error: "user_not_confirmed" }`
- **Resend endpoint:** `POST /auth/resend-code` → `{ email: string }` → `{ sent: true }`
- **Code TTL:** AWS Cognito default — 24 hours. Each call to resend-code issues a fresh code with a new 24-hour window.

## Frontend changes

### Error detection

Both repos use `AuthNativeError` with a `.code` string field. Detection:

```typescript
err instanceof AuthNativeError && err.code === 'user_not_confirmed'
```

### math-on-canvas — `authContext.tsx`, `submitSignIn`

In the `catch` block of `submitSignIn`:

```
if err.code === 'user_not_confirmed':
  resendConfirmCode(email)        // best-effort, fire and forget
  dispatch SET_PENDING_EMAIL(email)
  dispatch SET_VIEW('confirmEmail')
  dispatch SET_LOADING(false)
else:
  dispatch SET_ERROR(mapNativeAuthError(err.code))  // unchanged
```

### math_poster_editor — `authSlice.ts`, `auth_signIn`

In the `catch` block of `auth_signIn` (Step 1):

```
if err.code === 'user_not_confirmed':
  auth_resendCode(email)          // existing slice action
  set pendingConfirmEmail = email
  set nativeAuthLoading = false
  // nativeAuthError stays null — no error shown
else:
  set nativeAuthError = mapNativeAuthError(err)  // unchanged
```

The modal view switch to `confirmEmail` is already triggered by `pendingConfirmEmail` being set (existing behaviour in `NativeAuthModal`).

## Edge cases

| Scenario | Behaviour |
|---|---|
| `resend-code` fails (rate limit) | `confirmEmail` view still shown; existing code (up to 24h old) still works; "resend" button inside the view is available |
| Wrong password + unverified account | Cognito raises `UserNotConfirmedException` before checking password — user goes to `confirmEmail`. After verifying they can sign in with correct password. |
| Already confirmed account | `user_not_confirmed` never returned — this code path is never triggered |

## No changes needed

- `NativeAuthModal` — no changes (already renders `confirmEmail` view correctly)
- `authApiClient` / `authApiClient.ts` — no changes
- i18n strings — no changes (existing `notConfirmed` / `userNotConfirmed` key remains but is no longer shown in the sign-in flow)
- Backend — no changes