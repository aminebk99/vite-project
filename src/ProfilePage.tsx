// src/pages/ProfilePage.jsx
// Protected user profile page.
// Only reachable after passing through <ProtectedRoute />.
//
// This page itself does not re-check auth — that is ProtectedRoute's job.
// It does, however, read user data from AuthContext which was validated
// server-side when the session was established.

import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { styles } from "./styles";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();                          // invalidates session server-side
    navigate("/login", { replace: true });   // clear history entry
  }

  const initials = user?.name?.[0]?.toUpperCase() ?? "U";

  return (
    <div style={styles.pageCenter}>
      <div style={styles.card}>

        {/* Avatar + name */}
        <div style={styles.profileHeader}>
          <div style={styles.avatar} aria-hidden="true">{initials}</div>
          <div>
            <h1 style={styles.h1}>{user?.name ?? "User"}</h1>
            <p style={styles.muted}>{user?.email}</p>
          </div>
        </div>

        <div style={styles.divider} />

        {/* User details table */}
        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={styles.tdLabel}>User ID</td>
              <td style={styles.tdValue}>{user?.id}</td>
            </tr>
            <tr>
              <td style={styles.tdLabel}>Roles</td>
              <td style={styles.tdValue}>
                {(user?.roles ?? []).map((role) => (
                  <span key={role} style={styles.badge}>{role}</span>
                ))}
                {(!user?.roles || user.roles.length === 0) && (
                  <span style={{ color: "#94a3b8" }}>none</span>
                )}
              </td>
            </tr>
            <tr>
              <td style={styles.tdLabel}>Session</td>
              <td style={{ ...styles.tdValue, color: "#16a34a" }}>
                Active · HttpOnly cookie
              </td>
            </tr>
          </tbody>
        </table>

        <div style={styles.divider} />

        {/* Security status panel */}
        <div style={styles.securityPanel}>
          <p style={{ ...styles.muted, fontWeight: 500, marginBottom: 8 }}>
            Security status
          </p>
          <ul style={styles.securityList}>
            <li>✓ Session verified server-side on every API call</li>
            <li>✓ Role-based route guard active (ProtectedRoute)</li>
            <li>✓ No sensitive data in localStorage or sessionStorage</li>
            <li>✓ Post-login redirect URL was same-origin validated</li>
          </ul>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} style={styles.btnDanger}>
          Sign out
        </button>

      </div>
    </div>
  );
}