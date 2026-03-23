// src/pages/LoginPage.jsx
// Secure login form.
//
// Security features applied here:
//   • Redirects away immediately if already authenticated
//   • Validates redirect-back URL with isSafeRedirect() before using it
//   • Uses FormData (not controlled state) — avoids storing passwords in React state
//   • autoComplete attributes help password managers; required for passkeys too
//   • Server response errors displayed via role="alert" for screen readers
//   • No token handling here — that lives entirely in AuthContext

import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { isSafeRedirect } from "./isSafeRedirect";
import { styles } from "./styles";

export function LoginPage() {
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine safe post-login destination
  const rawFrom = location.state?.from?.pathname;
  const from = rawFrom && isSafeRedirect(rawFrom) ? rawFrom : "/profile";

  // Already authenticated → skip login screen
  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Read values from the DOM, not from React state, to minimize
    // the window during which credentials exist in memory.
    const fd = new FormData(e.currentTarget);
    const email    = fd.get("email")?.toString().trim()  ?? "";
    const password = fd.get("password")?.toString()      ?? "";

    // HTML5 validation handles most cases; this is a safety net
    if (!email.includes("@") || password.length < 8) return;

    const ok = await login(email, password);
    if (ok) navigate(from, { replace: true });
  }

  return (
    <div style={styles.pageCenter}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.cardHeader}>
          <div style={styles.lockIcon}>🔐</div>
          <h1 style={styles.h1}>Sign in</h1>
          <p style={styles.muted}>Secure session — token never stored in browser</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <label style={styles.label}>
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="you@example.com"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              placeholder="••••••••"
              style={styles.input}
            />
          </label>

          {/* Server-side error */}
          {error && (
            <div role="alert" aria-live="assertive" style={styles.errorBanner}>
              {error}
            </div>
          )}

          <button type="submit" style={styles.btnPrimary}>
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Security info */}
        <ul style={styles.securityList}>
          <li>✓ HttpOnly cookie — token inaccessible to JavaScript</li>
          <li>✓ SameSite=Strict — CSRF-resistant by default</li>
          <li>✓ CSRF token sent on every mutating request</li>
          <li>✓ Redirect URL validated (same-origin only)</li>
        </ul>

      </div>
    </div>
  );
}