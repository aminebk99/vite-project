// src/context/AuthContext.jsx
// Centralized auth state using useReducer.
// Tokens are NEVER stored in JS — the server sets an HttpOnly cookie.

import { createContext, useContext, useReducer, useCallback, useEffect } from "react";

// ── Context ──────────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

// ── Initial state ─────────────────────────────────────────────────────────────
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,   // stays true until the first checkAuth() resolves
  error: null,
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case "CHECK_AUTH_START":
      return { ...state, isLoading: true, error: null };
    case "AUTH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
      };
    case "LOGIN_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "LOGOUT":
      return { ...state, isAuthenticated: false, user: null, isLoading: false };
    default:
      return state;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Reads the CSRF token injected by the server into <meta name="csrf-token">
  function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content ?? "";
  }

  // ── Verify existing session on mount ──────────────────────────────────────
  const checkAuth = useCallback(async () => {
    dispatch({ type: "CHECK_AUTH_START" });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        credentials: "include", // sends the HttpOnly cookie automatically
      });
      if (!res.ok) throw new Error("unauthenticated");
      const user = await res.json();
      dispatch({ type: "AUTH_SUCCESS", payload: user });
    } catch {
      dispatch({ type: "AUTH_FAILURE" });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    dispatch({ type: "CHECK_AUTH_START" });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const { message } = await res.json().catch(() => ({}));
        dispatch({ type: "LOGIN_ERROR", payload: message || "Invalid credentials" });
        return false;
      }

      const user = await res.json();
      dispatch({ type: "AUTH_SUCCESS", payload: user });
      return true;
    } catch (err) {
      const msg =
        err instanceof TypeError
          ? "Network error — please try again."
          : "Login failed.";
      dispatch({ type: "LOGIN_ERROR", payload: msg });
      return false;
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": getCsrfToken() },
    });
    dispatch({ type: "LOGOUT" });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}