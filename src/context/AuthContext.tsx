"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type User,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  deleteUser,
} from "firebase/auth";
import { setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const googleProvider = new GoogleAuthProvider();

/**
 * Create or update the Firestore user profile document.
 * Uses setDoc with merge to avoid clobbering fields set elsewhere.
 */
async function ensureUserDoc(user: User): Promise<void> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // First time – create with server timestamp
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Returning user – update profile fields that may have changed
    await setDoc(
      ref,
      {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Consume redirect result before subscribing to auth state changes.
    // This is critical: if we subscribe first, onAuthStateChanged fires with
    // the user from the redirect before we've had a chance to check
    // additionalUserInfo.isNewUser.
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          // User just completed a Google redirect sign-in.
          // Create Firestore user doc — additionalUserInfo.isNewUser
          // tells us whether this account was just created.
          await ensureUserDoc(result.user);
        }
      })
      .catch((err) => {
        // Log redirect errors for debugging, but don't block the app.
        // Common errors:
        //   auth/account-exists-with-different-credential
        //   auth/credential-already-in-use
        // The user will see user === null and stay on /sign-in.
        console.error("Redirect sign-in error:", err.code, err.message);
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    // Use popup on desktop, redirect on mobile environments.
    // Redirect is needed on mobile because popups are often blocked
    // or behave poorly in in-app browsers.
    const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(
      typeof navigator !== "undefined" ? navigator.userAgent : "",
    );
    if (isMobile) {
      await signInWithRedirect(auth, googleProvider);
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      // Popup gives us immediate access to the result.
      // Create/update Firestore user doc.
      await ensureUserDoc(result.user);
    }
  }

  async function signInWithEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
    // Returning users don't need a new Firestore doc, but we refresh
    // the updatedAt timestamp via onAuthStateChanged-triggered logic.
  }

  async function signUpWithEmail(name: string, email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // Update Firebase Auth profile with display name.
    // If this fails we still have the account; the Firestore doc
    // created below will have the name regardless.
    await updateProfile(credential.user, { displayName: name });
    // Create Firestore user document
    await ensureUserDoc(credential.user);
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  async function deleteAccount() {
    if (!auth.currentUser) throw new Error("No authenticated user");

    const uid = auth.currentUser.uid;

    // Delete all resumes owned by the user from Firestore.
    // We import here to avoid circular dependency; this is the only
    // place in the context that needs Firestore collection access.
    const {
      collection,
      getDocs,
      query,
      where,
      deleteDoc,
    } = await import("firebase/firestore");
    const resumesRef = collection(db, "resumes");
    const q = query(resumesRef, where("userId", "==", uid));
    const snap = await getDocs(q);
    const deletions = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletions);

    // Delete the user profile document
    const userDocRef = doc(db, "users", uid);
    await (await import("firebase/firestore")).deleteDoc(userDocRef);

    // Delete the Firebase Auth account (this also signs the user out)
    await deleteUser(auth.currentUser);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}