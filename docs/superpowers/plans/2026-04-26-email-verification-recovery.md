# Email Verification Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user tries to sign in with an unverified account, automatically send a fresh confirmation code and redirect them to the email confirmation view instead of showing an error.

**Architecture:** Intercept `user_not_confirmed` (HTTP 403) in the `signIn` action of each repo's state layer. On detection, call `resend-code` (fire-and-forget) and switch the modal to the `confirmEmail` view. No changes needed in components, API clients, or the backend.

**Tech Stack:** TypeScript, React Context (math-on-canvas), Zustand + Immer (math_poster_editor), Vitest (math_poster_editor only)

---

## Task 1: math_poster_editor — update failing test

**Files:**
- Modify: `tests/store/slices/authSlice.nativeAuth.test.ts:203-209`

The existing test at line 203 asserts the OLD behaviour (error shown). Update it to assert the NEW behaviour, then add a second assertion for `resendCode` being called.

- [ ] **Step 1: Update the existing `user_not_confirmed` test**

Replace the test at lines 203-209 with:

```typescript
it('on AuthNativeError with code user_not_confirmed: calls resendCode and sets pendingConfirmEmail', async () => {
    mockSignIn.mockRejectedValue(new AuthNativeError('user_not_confirmed', 'Email not confirmed'))
    mockResendCode.mockResolvedValue({ sent: true })

    await store.getState().auth_signIn('test@example.com', 'pass')

    const state = store.getState()
    expect(mockResendCode).toHaveBeenCalledWith('test@example.com')
    expect(state.pendingConfirmEmail).toBe('test@example.com')
    expect(state.nativeAuthError).toBeNull()
    expect(state.nativeAuthLoading).toBe(false)
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /a/Coding/math_poster_editor
npx vitest run tests/store/slices/authSlice.nativeAuth.test.ts --reporter=verbose 2>&1 | grep -A 5 "user_not_confirmed"
```

Expected: FAIL — `expect(state.nativeAuthError).toBeNull()` fails because current code sets the error.

---

## Task 2: math_poster_editor — implement fix in authSlice.ts

**Files:**
- Modify: `src/store/slices/authSlice.ts:156-163`

`AuthNativeError` is already imported at line 14. `resendCode` is already imported at line 19.

- [ ] **Step 3: Replace the catch block in `auth_signIn` (Step 1 section)**

Find this block (lines 156-163):

```typescript
        } catch (err) {
            set((s) => {
                s.nativeAuthError = mapNativeAuthError(err)
                s.nativeAuthLoading = false
            })
            return
        }
```

Replace with:

```typescript
        } catch (err) {
            if (err instanceof AuthNativeError && err.code === 'user_not_confirmed') {
                void resendCode(email).catch(() => {})
                set((s) => {
                    s.pendingConfirmEmail = email
                    s.nativeAuthLoading = false
                })
                return
            }
            set((s) => {
                s.nativeAuthError = mapNativeAuthError(err)
                s.nativeAuthLoading = false
            })
            return
        }
```

---

## Task 3: math_poster_editor — verify tests pass and commit

**Files:**
- No new files

- [ ] **Step 4: Run the full auth test suite**

```bash
cd /a/Coding/math_poster_editor
npx vitest run tests/store/slices/authSlice.nativeAuth.test.ts --reporter=verbose
```

Expected: all tests PASS. Particularly:
- `on AuthNativeError with code user_not_confirmed: calls resendCode and sets pendingConfirmEmail` — PASS
- `on AuthNativeError with code unauthorized: sets nativeAuthError to invalidCredentials key` — still PASS (unchanged path)

- [ ] **Step 5: TypeScript check**

```bash
cd /a/Coding/math_poster_editor
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd /a/Coding/math_poster_editor
git add src/store/slices/authSlice.ts tests/store/slices/authSlice.nativeAuth.test.ts
git commit -m "feat: redirect to email confirmation when signing in with unverified account"
```

---

## Task 4: math-on-canvas — implement fix in authContext.tsx

**Files:**
- Modify: `src/lib/auth/authContext.tsx:177-184`

`AuthNativeError` is already imported at line 19. `authApiClient.resendCode` is available (confirmed in `src/lib/auth/authApiClient.ts`). This repo has no test framework — TypeScript check is the verification step.

- [ ] **Step 7: Replace the catch block in `submitSignIn`**

Find this block (lines 177-184):

```typescript
        } catch (err) {
            const key = err instanceof AuthNativeError
                ? mapNativeAuthError(err.code)
                : 'auth:errors.network'
            dispatch({ type: 'SET_ERROR', error: key })
        } finally {
            dispatch({ type: 'SET_LOADING', loading: false })
        }
```

Replace with:

```typescript
        } catch (err) {
            if (err instanceof AuthNativeError && err.code === 'user_not_confirmed') {
                void authApiClient.resendCode(email).catch(() => {})
                dispatch({ type: 'SET_PENDING_EMAIL', email })
                dispatch({ type: 'SET_VIEW', view: 'confirmEmail' })
                return
            }
            const key = err instanceof AuthNativeError
                ? mapNativeAuthError(err.code)
                : 'auth:errors.network'
            dispatch({ type: 'SET_ERROR', error: key })
        } finally {
            dispatch({ type: 'SET_LOADING', loading: false })
        }
```

Note: `return` inside `catch` still triggers `finally` — `SET_LOADING(false)` fires automatically.

---

## Task 5: math-on-canvas — TypeScript check and commit

**Files:**
- No new files

- [ ] **Step 8: TypeScript check**

```bash
cd /a/Coding/math-on-canvas
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
cd /a/Coding/math-on-canvas
git add src/lib/auth/authContext.tsx
git commit -m "feat: redirect to email confirmation when signing in with unverified account"
```