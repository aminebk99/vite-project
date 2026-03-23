// src/components/ProtectedRoute.jsx
// Layout-route guard — wraps any set of child routes.
//
// Usage examples:
//   <ProtectedRoute />                              → auth only
//   <ProtectedRoute requiredRoles={["admin"]} />    → admin role required
//   <ProtectedRoute requiredPermissions={["billing:read"]} />
//
// Security notes:
//   • Keeps isLoading=true until checkAuth() resolves → no flash of
//     unauthenticated content before the session check finishes.
//   • Saves the attempted URL in location.state.from so LoginPage can
//     redirect the user back after a successful login.
//   • All checks here are UX-only. The server MUST re-validate on
//     every API call.

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { styles } from "./styles.js";

/**
 * @param {string[]} [requiredRoles]        e.g. ["admin", "editor"]
 * @param {string[]} [requiredPermissions]  e.g. ["billing:read"]
 * @param {string}   [redirectTo]           defaults to "/login"
 */
export function ProtectedRoute({
  requiredRoles = [],
  requiredPermissions = [],
  redirectTo = "/login",
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // 1. Wait for session check — prevents redirect flicker
  if (isLoading) {
    return (
      <div style={styles.loadingWrapper}>
        <span style={styles.spinner} aria-label="Loading…" />
      </div>
    );
  }

  // 2. Not logged in → send to login, remembering where they were headed
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  // 3. Role check — at least one required role must match
  if (requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((r) => user?.roles?.includes(r));
    if (!hasRole) return <Navigate to="/unauthorized" replace />;
  }

  // 4. Permission check — all required permissions must be present
  if (requiredPermissions.length > 0) {
    const hasPerm = requiredPermissions.every((p) =>
      user?.permissions?.includes(p)
    );
    if (!hasPerm) return <Navigate to="/unauthorized" replace />;
  }

  // 5. All checks passed — render child routes
  return <Outlet />;
}