# Sign-In / Sign-Up Functionality: Analysis & Findings

## Overview

This document provides a comprehensive analysis of the authentication system in **ResuLaunchAI**. It covers the sign-in and sign-up flows, identifies problems ranging from critical to minor, and offers actionable recommendations.

**Files Analyzed:**

| File | Purpose |
|------|---------|
| `src/app/sign-in/page.tsx` | Sign-in / sign-up UI with Google OAuth and email/password flows |
| `src/app/sign-in/layout.tsx` | Layout for sign-in page (metadata only) |
| `src/context/AuthContext.tsx` | Firebase Auth context provider — all auth logic |
| `src/hooks/useAuth.ts` | Re-export of `useAuth` from AuthContext |
| `src/lib/firebase.ts` | Firebase initialization (Auth, Firestore, Storage) |
| `src/lib/firestore.ts` | Firestore CRUD for resumes |
| `src/lib/rateLimit.ts` | In-memory rate limiter (used only for AI routes) |
| `src/lib/types.ts` | TypeScript type definitions |
| `src/components/AuthGuard.tsx` | Route guard — redirects unauthenticated users to `/sign-in` |
| `src/components/Navbar.tsx` | Navigation bar with auth state awareness |
| `src/app/layout.tsx` | Root layout wrapping app in `AuthProvider` |
| `firebase-rules/firestore.rules` | Firestore security rules |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  AuthProvider (src/context/AuthContext.tsx)      │
│  ┌───────────────────────────────────────────┐  │
│  │  Firebase Auth SDK (v12.11.0)             │  │
│  │  - Google OAuth → signInWithRedirect      │  │
│  │  - Email/Password → signIn / createUser   │  │
│  │  - onAuthStateChanged listener            │  │
│  │  - getRedirectResult on mount             │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  Exports: user, loading, authReady,             │
│           signInWithGoogle, signInWithEmail,    │
│           signUpWithEmail, signOut              │
└─────────────────────────────────────────────────┘
         │
         ├──► sign-in/page.tsx   (SignInPage)
         ├──► AuthGuard.tsx      (Protected route wrapper)
         ├──► Navbar.tsx         (Auth-aware navigation)
         └──► dashboard/         (Protected pages via AuthGuard)
```

---

## Critical Issues

### 1. No Firestore User Document Created on Sign-Up

**Severity:** 🔴 Critical  
**Files:** `src/context/AuthContext.tsx`, `src/lib/firestore.ts`

When a user signs up (either via Google OAuth or email/password), **no user profile document is written to Firestore**. The `users` collection does not exist in the codebase at all.

**`signUpWithEmail` current implementation:**
```typescript
async function signUpWithEmail(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  // ❌ No Firestore user document created
}
```

**`signInWithGoogle` current implementation:**
```typescript
async function signInWithGoogle() {
  await signInWithRedirect(auth, googleProvider);
  // ❌ No Firestore user document created on first sign-in
}
```

**Impact:**
- No way to store user preferences, settings, or metadata
- No way to track account creation date or last login
- Cannot implement profile management (update name, delete account, etc.)
- Cannot distinguish between brand-new and returning users
- No `users` collection in Firestore security rules

**Recommendation:**
Create a `users/{uid}` document on first sign-in containing at minimum: `uid`, `email`, `displayName`, `photoURL`, `createdAt`, `updatedAt`. Use a Firestore `setDoc` with `merge: false` or check `getDoc` first to avoid overwriting on subsequent logins. Update the Firestore security rules to include a `users` collection.

---

### 2. Google Sign-In Uses `signInWithRedirect` Instead of `signInWithPopup`

**Severity:** 🔴 Critical (UX)  
**Files:** `src/context/AuthContext.tsx`

The Google sign-in flow uses `signInWithRedirect`, which performs a **full-page navigation** to Google's OAuth consent screen. On desktop browsers, this is a jarring experience compared to the popup-based flow (`signInWithPopup`).

**Problems with redirect flow:**
1. Full page navigation on desktop (poor UX — popups are the standard for desktop OAuth)
2. The `googlePending` loading state becomes **permanently stuck** if the user navigates back from the OAuth page without completing sign-in (the redirect never "returns" so no code path resets `googlePending`)
3. Error handling is virtually impossible — if Google's OAuth fails, the error occurs on a different domain and the user returns to the app with no error message displayed
4. `getRedirectResult` is called on mount but its result is discarded (`.catch(() => null)`), so any credential or additional user info from the redirect is lost
5. Race condition: `signInWithRedirect` resolves immediately (before navigation), but `onAuthStateChanged` fires later. If the component re-renders between these two events, the state may be inconsistent

**Recommendation:**
Use `signInWithPopup` for desktop browsers and fall back to `signInWithRedirect` only for mobile/Cordova environments, as recommended by Firebase:

```typescript
import { isMobile } from "@/lib/utils"; // or similar detection

async function signInWithGoogle() {
  if (isMobile()) {
    await signInWithRedirect(auth, googleProvider);
  } else {
    await signInWithPopup(auth, googleProvider);
  }
}
```

---

### 3. No Email Verification

**Severity:** 🔴 Critical (Security)  
**Files:** `src/context/AuthContext.tsx`

After email/password sign-up, there is **no email verification step**. Users can create accounts with any email address (including fake or non-existent ones).

**Impact:**
- Spam/bot accounts can be created freely
- Users who mistype their email cannot recover their accounts
- No way to verify legitimate user identity
- Violates security best practices for user-facing applications

**Recommendation:**
After `createUserWithEmailAndPassword` succeeds, call `sendEmailVerification(credential.user)`. Then:
1. Show a "check your email" screen after sign-up
2. Prevent access to protected features until email is verified (check `user.emailVerified`)
3. Add a "resend verification email" option

---

### 4. No Password Confirmation Field

**Severity:** 🔴 Critical (UX/Support)  
**Files:** `src/app/sign-in/page.tsx`

The sign-up form has a single password field with no confirmation/confirm-password field. Users who mistype their password will create accounts they cannot sign into.

**Impact:**
- Increased support burden from locked-out users
- Poor UX — users expect a confirmation field
- No way to visually confirm the password was typed correctly

**Recommendation:**
Add a `confirmPassword` field and validate that `password === confirmPassword` before submission. Show an inline validation error if they don't match.

---

### 5. Sign-Out Does Not Redirect — Causes Flash of Protected Content

**Severity:** 🔴 Critical (UX)  
**Files:** `src/components/Navbar.tsx`, `src/context/AuthContext.tsx`, `src/components/AuthGuard.tsx`

When a user clicks "Sign Out" from a protected page (e.g., `/dashboard` or `/builder`), the sign-out function only calls `firebaseSignOut(auth)` **without redirecting**. This triggers the following buggy sequence:

1. `signOut()` fires → Firebase Auth state changes to `null`
2. `onAuthStateChanged` sets `user = null`
3. The current page (e.g., `/dashboard`) briefly re-renders with `user = null`
4. `AuthGuard` renders `null` (blank white flash) while the `useEffect` redirect triggers
5. Eventually `router.replace("/sign-in")` fires

**Impact:**
- Visible flash of blank/white content on sign-out
- May cause React errors if the protected page tries to access user-dependent data before the redirect completes

**Recommendation:**
Either:
1. Make `signOut()` accept an optional redirect path and call `router.push("/")` or `router.push("/sign-in")` after sign-out
2. Or handle the redirect in the Navbar component's sign-out handler
3. Keep the current page rendered until the redirect completes (don't render `null` in AuthGuard)

---

## Moderate Issues

### 6. Error Messages Leak Account Existence Information

**Severity:** 🟡 Moderate (Security/Privacy)  
**Files:** `src/app/sign-in/page.tsx`

The error handling on the sign-in page reveals whether an email address is registered:

| Error Code | Message Displayed | Information Leaked |
|---|---|---|
| `auth/email-already-in-use` | "An account with this email already exists." | ✅ Email is registered |
| `auth/invalid-credential` | "Incorrect email or password." | ❌ (Correctly generic) |
| `auth/wrong-password` | "Incorrect email or password." | ❌ (Correctly generic) |
| `auth/user-not-found` | "Incorrect email or password." | ❌ (Correctly generic) |

**Impact:**
- The sign-up flow confirms whether an email is already registered (enumeration attack vector)
- Malicious actors can test email lists to find registered users

**Recommendation:**
On sign-up, instead of the distinct "already in use" message, show a generic message like: "If this email is available, a verification message will be sent." Or at minimum use a less specific message like "Unable to create account. Please try again."

Note: Firebase's sign-in errors (`invalid-credential`, `wrong-password`, `user-not-found`) are already properly merged into a single generic message — this is good.

---

### 7. No Client-Side Input Validation

**Severity:** 🟡 Moderate  
**Files:** `src/app/sign-in/page.tsx`

The form submits directly to Firebase with **no client-side validation** beyond the HTML `required` attribute:

- **Email format** is not validated (e.g., `"not-an-email"` passes the `required` check)
- **Name** is only `.trim()`'d but not checked for minimum length or content
- **Password** has no strength requirements client-side (Firebase default: 6+ chars)
- **No max length validation** on any field (potential for abuse with extremely long inputs)

**Impact:**
- Users submit invalid data and only discover issues from Firebase error responses
- Poor UX — preventable errors could be caught before submission
- Potential for abuse with oversized input values

**Recommendation:**
Add client-side validation before calling Firebase:
- Email: validate format with a regex or `input[type="email"]` checkValidity
- Name: minimum 2 characters, trim whitespace
- Password: minimum 8 characters, at least one number and one letter
- Show inline validation errors below each field

---

### 8. No Rate Limiting on Sign-In / Sign-Up Endpoints

**Severity:** 🟡 Moderate (Security)  
**Files:** `src/lib/rateLimit.ts`, `src/app/sign-in/page.tsx`

The project has an in-memory rate limiter (`src/lib/rateLimit.ts`) but it is **not applied to authentication routes**. Firebase has built-in rate limiting (`auth/too-many-requests`), but there's no application-level protection against:

- Credential stuffing attacks
- Account enumeration via sign-up errors
- Denial-of-service via rapid sign-up attempts

**Impact:**
- Vulnerability to brute-force and enumeration attacks
- Reliance solely on Firebase's built-in throttling (which has generous limits)

**Issues with existing rate limiter:**
1. **In-memory storage** — All rate limit data is lost on server restart
2. **Single-instance only** — Won't work with multiple server instances (Vercel serverless)
3. **No persistence** — Each cold start resets all counters

**Recommendation:**
1. Add client-side throttling: disable the submit button for N seconds after each failed attempt
2. For server-side, use an external store (e.g., Upstash Redis) or a database-backed rate limiter
3. Log failed sign-in attempts for monitoring

---

### 9. `getRedirectResult` Called But Result Discarded

**Severity:** 🟡 Moderate  
**Files:** `src/context/AuthContext.tsx`

```typescript
useEffect(() => {
  getRedirectResult(auth).catch(() => null);  // Result ignored!
  // ...
}, []);
```

The `getRedirectResult` promise is not `await`ed and its result is discarded. While `onAuthStateChanged` will fire with the user object regardless, `getRedirectResult` also provides:
- The `UserCredential` object with additional user info (e.g., whether it was a new user)
- The `OAuthCredential` with access tokens
- Confirmation that the redirect flow completed successfully

**Impact:**
- Cannot distinguish between new Google sign-ups and returning users (needed for creating the initial Firestore user document)
- If Firebase's internal redirect state isn't consumed properly, it may cause issues on subsequent sign-in attempts (rare but documented in Firebase issues)

**Recommendation:**
```typescript
useEffect(() => {
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        // First-time Google sign-in — create Firestore user doc
        // Access result.user, result.additionalUserInfo.isNewUser
      }
    })
    .catch((err) => {
      // Handle redirect errors (e.g., account-exists-with-different-credential)
    });
  // ...
}, []);
```

---

### 10. Dead `loading` State in AuthContext

**Severity:** 🟡 Moderate (Code Quality)  
**Files:** `src/context/AuthContext.tsx`

The `AuthContextValue` interface exports both `loading` and `authReady`, but they are set to `false`/`true` simultaneously and `loading` is **never consumed** by any component. Only `authReady` is used.

```typescript
const [loading, setLoading] = useState(true);    // Never read by consumers
const [authReady, setAuthReady] = useState(false);
```

**Recommendation:**
Remove `loading` from the interface and internal state, or repurpose it for a distinct use case (e.g., `loading` = initial auth check, `authReady` = redirect result processed).

---

## Minor Issues

### 11. AuthGuard Renders Blank Content During Redirect

**Severity:** 🟢 Minor (UX)  
**Files:** `src/components/AuthGuard.tsx`

```typescript
if (!user) {
  return null;  // Blank flash while useEffect redirects
}
```

When `authReady` is true but `user` is null, `AuthGuard` renders `null` **before** the `useEffect` runs and calls `router.replace`. This causes a brief white flash.

**Recommendation:**
Show a loading spinner instead of `null`, or render the spinner until the redirect completes:

```typescript
if (!user) {
  return <LoadingSpinner />;  // Keep showing loading until redirect fires
}
```

---

### 12. Sign-In Page Is Fully Client-Rendered

**Severity:** 🟢 Minor (SEO/Performance)  
**Files:** `src/app/sign-in/page.tsx`

The entire page is a `"use client"` component with no server-side rendering. The sign-in page doesn't need SSR for SEO, but:
- Initial load is slower (must download and execute JS before rendering)
- No static generation or ISR possible
- Inconsistent with Next.js best practices

**Recommendation:**
Split the page into server and client components. The static shell (layout, headings, placeholder buttons) can be server-rendered, with the interactive form as a client component.

---

### 13. "Terms of Service" Text Has No Link

**Severity:** 🟢 Minor (Legal/Compliance)  
**Files:** `src/app/sign-in/page.tsx`

The sign-in page includes the text "By continuing you agree to our terms of service." but the text is not a hyperlink and there is no actual terms of service page.

**Recommendation:**
Either add a link to a `/terms` page or remove the misleading text.

---

### 14. No `authStateReady` / Blocking Auth Check at App Level

**Severity:** 🟢 Minor  
**Files:** `src/context/AuthContext.tsx`, `src/app/layout.tsx`

The `AuthProvider` renders children immediately while `authReady` is `false`. This means every page mount shows a loading spinner while Firebase initializes. Services like `getRedirectResult` are also called after children mount.

**Recommendation:**
Consider conditionally rendering children only when auth is ready at the layout level to avoid per-page loading states.

---

### 15. No Account Deletion Functionality

**Severity:** 🟢 Minor (Feature Gap)  
**Files:** `src/context/AuthContext.tsx`

There is no way for users to delete their account. This is increasingly required by app store policies and privacy regulations (GDPR "right to erasure").

**Recommendation:**
Add a `deleteAccount` function that:
1. Deletes the user's Firestore documents (resumes, user profile)
2. Deletes the Firebase Auth account (`user.delete()`)
3. Signs the user out

---

## Summary Table

| # | Issue | Severity | Category |
|---|-------|----------|----------|
| 1 | No Firestore user document on sign-up | 🔴 Critical | Data Architecture |
| 2 | Google sign-in uses redirect instead of popup | 🔴 Critical | UX |
| 3 | No email verification | 🔴 Critical | Security |
| 4 | No password confirmation field | 🔴 Critical | UX |
| 5 | Sign-out doesn't redirect (flash of content) | 🔴 Critical | UX |
| 6 | Error messages leak account existence | 🟡 Moderate | Security |
| 7 | No client-side input validation | 🟡 Moderate | UX / Security |
| 8 | No rate limiting on auth endpoints | 🟡 Moderate | Security |
| 9 | `getRedirectResult` result discarded | 🟡 Moderate | Code Quality |
| 10 | Dead `loading` state in AuthContext | 🟡 Moderate | Code Quality |
| 11 | AuthGuard renders null during redirect | 🟢 Minor | UX |
| 12 | Sign-in page is fully client-rendered | 🟢 Minor | Performance |
| 13 | "Terms of Service" has no link | 🟢 Minor | Compliance |
| 14 | No `authStateReady` blocking at layout level | 🟢 Minor | Architecture |
| 15 | No account deletion functionality | 🟢 Minor | Feature Gap |

---

## What's Done Well

- **Error mapping** for Firebase auth errors is centralized and well-organized
- **Generic sign-in error messages** (`invalid-credential`, `wrong-password`, `user-not-found`) all map to the same text — preventing user enumeration in the sign-in flow
- **Pending states** prevent double-submission of forms
- **Loading spinner** shown during Firebase initialization (`authReady` check)
- **AuthGuard** correctly protects routes from unauthenticated access
- **Firestore security rules** are well-written with proper ownership checks and prevent userId modification on update
- **Mode switching** (sign-in ↔ sign-up) cleanly resets form state and errors
- **`noValidate`** on the form allows custom validation handling instead of browser defaults
- **Proper `autoComplete` attributes** on form fields (`name`, `email`, `current-password`, `new-password`)
- **ARIA labels** and accessible markup (hidden SVG icons, labeled buttons)

---

## Recommended Fix Priority

1. **Add Firestore user document creation** on sign-up (Issue #1)
2. **Add password confirmation field** to sign-up form (Issue #4)
3. **Fix sign-out redirect** to prevent blank flash (Issue #5)
4. **Switch to `signInWithPopup`** for desktop Google sign-in (Issue #2)
5. **Add email verification** after sign-up (Issue #3)
6. **Consume `getRedirectResult`** to detect new users (Issue #9)
7. **Add client-side input validation** (Issue #7)
8. **Apply rate limiting** to auth endpoints (Issue #8)
9. **Fix remaining minor issues** (Issues #10–15)