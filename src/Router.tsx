// src/router.jsx
// Route configuration using createBrowserRouter (React Router v6.4+).
//
// Route groups:
//   1. Public     — /login, /unauthorized
//   2. Protected  — /profile  (auth required)
//   3. Admin-only — /admin    (role "admin" required)
//   4. Catch-all  — * → /login
//
// Protected pages are lazy-loaded with React.lazy + Suspense so their
// JS bundles are never downloaded by unauthenticated users.

import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage }      from "./LoginPage";
import { styles }         from "./styles";

// Lazy-loaded protected pages
// In a real project these would be separate files:
//   const ProfilePage = lazy(() => import("./pages/ProfilePage"));
import { ProfilePage } from "./ProfilePage";
const LazyProfilePage = lazy(() =>
  Promise.resolve({ default: ProfilePage })
);

// Reusable Suspense fallback
function PageLoader() {
  return (
    <div style={styles.loadingWrapper}>
      <span style={styles.spinner} aria-label="Loading page…" />
    </div>
  );
}

// Simple 403 page (extract to its own file if it grows)
function UnauthorizedPage() {
  return (
    <div style={styles.pageCenter}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ ...styles.h1, fontSize: 48, margin: "0 0 8px" }}>403</h2>
        <p style={styles.muted}>You don't have permission to access this page.</p>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([

  // ── Public routes ──────────────────────────────────────────────────────────
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },

  // ── Protected routes (authentication required) ─────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/profile",
        element: (
          <Suspense fallback={<PageLoader />}>
            <LazyProfilePage />
          </Suspense>
        ),
      },
    ],
  },

  // ── Admin-only routes (role "admin" required) ──────────────────────────────
  {
    element: <ProtectedRoute requiredRoles={["admin"]} />,
    children: [
      {
        path: "/admin",
        element: (
          <div style={styles.pageCenter}>
            <h2 style={styles.h1}>Admin panel</h2>
          </div>
        ),
      },
    ],
  },

  // ── Catch-all → login ──────────────────────────────────────────────────────
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);