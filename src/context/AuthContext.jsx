import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext(null);

// Lightweight offline user — lets the app run fully without Firebase
const OFFLINE_USER = {
  uid: "__local__",
  email: null,
  displayName: "Local Mode",
  isOffline: true,
};

export function AuthProvider({ children }) {
  // undefined  = still resolving
  // null       = not signed in
  // object     = signed-in user (or OFFLINE_USER)
  // If Firebase isn't configured, initialize directly to OFFLINE_USER
  const [user, setUser] = useState(() => (!auth ? OFFLINE_USER : undefined));

  useEffect(() => {
    // If Firebase isn't configured (no env vars), go straight to offline mode
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => setUser(u ?? null));
  }, []);

  const login = async (email, password, remember = true) => {
    await setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence,
    );
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email, password) => {
    await setPersistence(auth, browserLocalPersistence);
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const continueOffline = () => setUser(OFFLINE_USER);

  const logout = () => {
    if (user?.isOffline) {
      setUser(null);
      return;
    }
    return signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, signup, resetPassword, continueOffline, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
