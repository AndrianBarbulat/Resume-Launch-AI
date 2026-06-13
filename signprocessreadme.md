# Sign-Up Process: Detailed Code Trace & Bug Analysis

## Overview

This document performs a step-by-step trace of the sign-up code path, identifying exactly where sign-up can fail silently, produce confusing states, or behave incorrectly. Every line of the execution path has been analyzed.

---

## Sign-Up Flow: Email/Password Path

### Code Trace

The following trace follows a user filling in **Full Name**, **Email**, and **Password** on the sign-up form and clicking **"Create Account"**.

---

**Step 1: Form Submit → `handleEmailSubmit`**

```typescript
// src/app/sign-in/page.tsx, line 77-97
async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;                          // ⬅ Guard: blocks if googlePending or emailPending
    setError("");
    setEmailPending(true);                       // ⬅ Button changes to "Creating account…"
    try {
      if (mode === "signup") {
        await signUpWithEmail(name.trim(), email.trim(), password);
        //                 ^^^^^^^^^^^  ^^^^^^^^^^^  ^^^^^^^^
        //                 ✅ trimmed   ✅ trimmed   ❌ NOT trimmed
      } else {
        await signInWithEmail(email.trim(), password);
      }
      // success — useEffect above handles redirect
      // ⚠️ setEmailPending(false) is NEVER called on success
    } catch (err) {
      if (err instanceof FirebaseError) {
        const msg =
          FIREBASE_ERRORS[err.code] ?? "Something went wrong. Please try again.";
        if (msg) setError(msg);
      }
      // ⚠️ If err is NOT a FirebaseError → NO error message shown
      setEmailPending(false);                    // Only reset on error, never on success
    }
  }
```

---

**Step 2: `signUpWithEmail` in AuthContext**

```typescript
// src/context/AuthContext.tsx, line 63-66
async function signUpWithEmail(name: string, email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    //                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //                   Firebase creates the user account here.
    //                   onAuthStateChanged fires → user state updates.

    await updateProfile(credential.user, { displayName: name });
    //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //     If this FAILS: account exists but displayName is unset.
    //     Error propagates to handleEmailSubmit's catch block.
}
```

---

**Step 3: Auth State Change → Redirect**

```typescript
// src/app/sign-in/page.tsx, line 37-41
useEffect(() => {
    if (authReady && user) {
      router.replace("/dashboard");               // Redirects to dashboard
    }
  }, [authReady, user, router]);
```

---

## Bugs Found — Email/Password Sign-Up

### Bug 1 — `emailPending` Never Reset on Success

**File:** `src/app/sign-in/page.tsx`, lines 77-97  
**Severity:** 🔴 Critical

`setEmailPending(false)` is **only called in the `catch` block** (line 95). On successful sign-up, `emailPending` stays `true` forever.

**Consequence:**
- If the redirect to `/dashboard` is delayed or blocked (e.g., slow network, browser tab suspended), the user sees the "Creating account…" spinner indefinitely.
- If the user navigates back to `/sign-in` without a full page reload (client-side navigation), `emailPending` is still `true`, so `pending` blocks all subsequent `handleEmailSubmit` and `handleGoogleSignIn` calls.
- The user is effectively locked out of the form until a full page refresh.

**Evidence:**
```typescript
try {
  // ... sign up ...
  // ❌ No setEmailPending(false) here
} catch (err) {
  // ...
  setEmailPending(false);  // ← Only reset on error
}
```

**Fix:**
```typescript
try {
  if (mode === "signup") {
    await signUpWithEmail(name.trim(), email.trim(), password);
  } else {
    await signInWithEmail(email.trim(), password);
  }
  // Redirect is handled by useEffect — but we should still reset pending
  // in case redirect doesn't happen immediately
} catch (err) {
  // ... error handling ...
} finally {
  setEmailPending(false);   // ← Reset in finally block
}
```

---

### Bug 2 — Non-FirebaseError Exceptions Are Silently Swallowed

**File:** `src/app/sign-in/page.tsx`, lines 89-96  
**Severity:** 🔴 Critical

If `signUpWithEmail` throws an error that is **not** an instance of `FirebaseError`, the error is completely invisible:

```typescript
catch (err) {
  if (err instanceof FirebaseError) {
    // Show error message
  }
  // ❌ If err is NOT a FirebaseError, nothing happens.
  // No error message, but emailPending IS reset (so form returns to idle).
  setEmailPending(false);
}
```

**When could this happen?**
- `updateProfile` throws a network error re-wrapped differently
- Firebase SDK version mismatch or initialization error
- Memory/promise rejection that isn't a FirebaseError
- Security rules rejections wrapped as plain `Error`

In these cases, the form simply resets to its idle state with **no indication anything went wrong**. The user clicks "Create Account", sees a spinner briefly, then the form goes back to normal — account not created.

**Fix:**
```typescript
catch (err) {
  if (err instanceof FirebaseError) {
    const msg = FIREBASE_ERRORS[err.code] ?? "Something went wrong. Please try again.";
    if (msg) setError(msg);
  } else {
    setError("Something went wrong. Please try again.");  // ← Fallback message
    console.error("Sign-up error:", err);                  // ← Log for debugging
  }
  setEmailPending(false);
}
```

---

### Bug 3 — `createUserWithEmailAndPassword` and `updateProfile` Not Atomic

**File:** `src/context/AuthContext.tsx`, lines 63-66  
**Severity:** 🟡 Moderate

The two operations are not wrapped in a transaction or rollback:

```typescript
async function signUpWithEmail(name: string, email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // ⚠️ Account is now created in Firebase Auth.
    await updateProfile(credential.user, { displayName: name });
    // ⚠️ If this throws → account exists but has no displayName.
}
```

**Consequence if `updateProfile` fails:**
1. User account exists in Firebase Auth (with email/password)
2. `updateProfile` throws → error propagates to `handleEmailSubmit`
3. Error is displayed: "Something went wrong"
4. `onAuthStateChanged` has ALREADY fired with the new user (after step 1)
5. `useEffect` sees `user` is non-null → redirects to `/dashboard`
6. User is on the dashboard, account works, but has no display name

This creates a confusing situation where the user sees an error message AND gets redirected. The account is partially functional.

**Fix:**
Option A — Wrap both in a try/catch and delete the user on profile failure:
```typescript
async function signUpWithEmail(name: string, email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    try {
      await updateProfile(credential.user, { displayName: name });
    } catch (profileErr) {
      // Clean up: delete the account since profile setup failed
      await credential.user.delete();
      throw profileErr;
    }
}
```

Option B — Defer `updateProfile` to after sign-up completes, treat it as non-critical:
```typescript
async function signUpWithEmail(name: string, email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // Fire-and-forget: profile update is best-effort
    updateProfile(credential.user, { displayName: name }).catch(() => null);
}
```

---

### Bug 4 — Password Is Not Trimmed (Inconsistency)

**File:** `src/app/sign-in/page.tsx`, line 84  
**Severity:** 🟢 Minor

```typescript
await signUpWithEmail(name.trim(), email.trim(), password);
//                     ^^^^^^^^^^    ^^^^^^^^^^^  ^^^^^^^^
//                     Trimmed       Trimmed       NOT trimmed
```

`name` and `email` are trimmed but `password` is not. While passwords can legitimately contain leading/trailing spaces (e.g., passphrases), the inconsistency is likely an oversight. If the user copies their email from another source with a trailing space, it's cleaned. If they copy a password with a trailing space, it's silently included — potentially causing confusion when they try to sign in later without the space.

**Fix:**
Either document this behavior or add a visual indicator that leading/trailing spaces matter. The safest approach is to **not trim password** but add a validation warning if the password starts or ends with whitespace.

---

## Sign-Up Flow: Google OAuth Path

### Code Trace

```
User clicks "Continue with Google"
  → handleGoogleSignIn()
    → signInWithGoogle()
      → signInWithRedirect(auth, googleProvider)
        → Browser navigates to Google OAuth consent screen (full page)
        → User authorizes (or cancel)
        → Browser redirects back to the app
          → AuthProvider mounts
            → getRedirectResult(auth).catch(() => null)  ⬅ Error swallowed!
            → onAuthStateChanged(auth, callback)
              → If success: user = firebaseUser, redirect to /dashboard
              → If cancel/fail: user = null, stays on /sign-in
```

---

### Bug 5 — All Google OAuth Errors Are Swallowed

**File:** `src/context/AuthContext.tsx`, line 44  
**Severity:** 🔴 Critical

```typescript
useEffect(() => {
    // Pick up the result if the user is returning from a Google redirect
    getRedirectResult(auth).catch(() => null);  // ❌ ALL errors silently discarded
    // ...
}, []);
```

**What's swallowed:**
- `auth/account-exists-with-different-credential` — User previously signed up with email/password, now tries Google with the same email
- `auth/credential-already-in-use` — Credential linked to another account
- `auth/network-request-failed` — Network error during redirect processing
- `auth/popup-closed-by-user` — User dismissed (legitimate, but should still be tracked)
- Any other Firebase error during redirect handoff

**Consequence:**
The user returns from Google OAuth, the page loads, and:
- If OAuth failed: user stays on `/sign-in` with no error message. The form looks normal. They have no idea what went wrong.
- If account linking is needed: the user is never prompted about it.

**Fix:**
```typescript
useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // Successfully signed in via redirect
          // result.additionalUserInfo?.isNewUser tells us if this is first sign-in
          // Could create Firestore user doc here
        }
      })
      .catch((err) => {
        // Log the error for debugging
        console.error("Redirect sign-in error:", err.code, err.message);
        // The UI will show nothing — consider storing the error in a ref or
        // providing it via context so the sign-in page can display it
      });
    // ...
}, []);
```

---

### Bug 6 — `googlePending` Is Never Reset After Redirect Return

**File:** `src/app/sign-in/page.tsx`, lines 61-75  
**Severity:** 🟡 Moderate

When the user clicks "Continue with Google":

1. `setGooglePending(true)` — button shows spinner
2. `signInWithGoogle()` calls `signInWithRedirect` — page navigates away
3. The component **unmounts** as the browser leaves the page
4. The `handleGoogleSignIn` function's `catch` block never runs (no error thrown)
5. User completes (or cancels) OAuth and returns to the app
6. The component **re-mounts** fresh — all state is reset
7. `googlePending` is now `false` (initial state)

**This works correctly in the normal case because the component remounts.** However:

- If for some reason the page navigation fails (e.g., popup blocked on redirect, browser prevents navigation), `signInWithRedirect` throws and the catch block resets `googlePending`.
- If the redirect happens in the SAME tab but the app uses client-side routing (Next.js `router`), the component might NOT unmount/remount properly. In that case, `googlePending` stays `true` forever.

This is harder to trigger than Bug 1, but the pattern is the same: no `finally` block to reset pending state.

---

### Bug 7 — `signInWithRedirect` vs `signInWithPopup` Mistmatch

**File:** `src/context/AuthContext.tsx`, line 55-57  
**Severity:** 🔴 Critical (UX)

The code uses `signInWithRedirect` exclusively:

```typescript
async function signInWithGoogle() {
    await signInWithRedirect(auth, googleProvider);
}
```

However, the sign-in page contains error messages for **popup** operations:
```typescript
"auth/popup-blocked": "Pop-up was blocked. Please allow pop-ups for this site.",
"auth/popup-closed-by-user": "",
"auth/cancelled-popup-request": "",
```

These popup error codes will **never** be triggered because `signInWithRedirect` doesn't use popups. Conversely, redirect-specific errors (like mismatched redirect domains) are not handled at all.

**Fix:**
Switch to `signInWithPopup` for desktop browsers:
```typescript
import { signInWithPopup, signInWithRedirect, isSignInWithEmailLink } from "firebase/auth";

async function signInWithGoogle() {
    // Use popup on desktop, redirect on mobile
    const isMobileDevice = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
    if (isMobileDevice) {
      await signInWithRedirect(auth, googleProvider);
    } else {
      await signInWithPopup(auth, googleProvider);
    }
}
```

---

## Sign-In Flow (for comparison)

The sign-in code path shares the same bugs:

```typescript
async function signInWithEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
}
```

Called from:
```typescript
} else {
    await signInWithEmail(email.trim(), password);
}
```

Same issues apply: `emailPending` not reset on success, non-FirebaseError swallowed.

---

## Root Causes Summary

All failures in the sign-up process that result in "account not created" fall into these categories:

| Category | Cause | User Experience |
|----------|-------|-----------------|
| **Firebase rejection** | Invalid email, weak password, email already in use, too many requests | Error message shown (correct) |
| **Network failure** | `auth/network-request-failed` | Error message shown (correct) |
| **Non-FirebaseError throw** | Unexpected exception type from SDK | **Silent failure** — form resets, no error, no account (Bug 2) |
| **Google OAuth failure** | `getRedirectResult` error swallowed | **Silent failure** — returns to form, no account, no error (Bug 5) |
| **Stale pending state** | `emailPending` stuck on `true` | **Form blocked** — can't retry sign-up without page refresh (Bug 1) |
| **Partial account state** | `updateProfile` failed after `createUser` | Account exists, confusing error shown (Bug 3) |

---

## Quickest Fix (Minimal Change)

A single `finally` block in `handleEmailSubmit` fixes the most impactful issues:

```typescript
async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError("");
    setEmailPending(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(name.trim(), email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err) {
      if (err instanceof FirebaseError) {
        const msg = FIREBASE_ERRORS[err.code] ?? "Something went wrong. Please try again.";
        if (msg) setError(msg);
      } else {
        // Catch-all for unexpected error types
        setError("Something went wrong. Please try again.");
        console.error("Auth error:", err);
      }
    } finally {
      setEmailPending(false);   // ← Always reset pending state
    }
  }
```

And properly handle `getRedirectResult`:

```typescript
useEffect(() => {
    getRedirectResult(auth)
      .catch((err) => {
        console.error("Redirect sign-in failed:", err.code);
        // Store error for the sign-in page to display
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);
```

---

## Recommended Full Fix Priority

1. **Add `finally` block** to reset `emailPending` after every attempt (Bug 1)
2. **Add fallback error message** for non-FirebaseError exceptions (Bug 2)
3. **Properly handle `getRedirectResult`** — don't swallow errors (Bug 5)
4. **Switch to `signInWithPopup`** for desktop Google sign-in (Bug 7)
5. **Make sign-up atomic** — roll back if `updateProfile` fails (Bug 3)
6. **Add input validation** (password strength, email format, password confirmation)