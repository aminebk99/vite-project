# ⚛️ Secure Auth Frontend

React 18 single-page application with secure routing, JWT-over-cookie authentication, role-based access control, and CSRF protection.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 |
| Routing | React Router v6.4+ (`createBrowserRouter`) |
| Auth state | Context API + `useReducer` |
| HTTP | Native `fetch` with `credentials: include` |
| Build tool | Vite |

---

## Project Structure

```
src/
├── App.jsx                     # Root: AuthProvider + RouterProvider
├── router.jsx                  # createBrowserRouter route config
├── styles.js                   # Shared inline styles
├── context/
│   └── AuthContext.jsx         # Auth reducer, provider, useAuth hook
├── components/
│   └── ProtectedRoute.jsx      # Route guard: auth + role + permission checks
├── pages/
│   ├── LoginPage.jsx           # Secure login form
│   └── ProfilePage.jsx         # Protected profile page
└── utils/
    └── isSafeRedirect.js       # URL validator (blocks open-redirect attacks)
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- The [Express backend](../backend/README.md) running on port `5000`

### 1. Install dependencies

```bash
npm install
npm install react-router-dom
```

### 2. Configure environment

Create a `.env` file at the root of the project:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=SecureAuth
VITE_APP_VERSION=1.0.0
```

> All Vite environment variables must be prefixed with `VITE_` to be accessible in the browser.

### 3. Start the dev server

```bash
npm run dev
```

Open **http://localhost:5173**

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL of the Express backend | `http://localhost:5000` |
| `VITE_APP_NAME` | App display name | `SecureAuth` |
| `VITE_APP_VERSION` | App version | `1.0.0` |

---

## Demo Accounts

These are seeded by the backend automatically on first start.

| Email | Password | Roles |
|-------|----------|-------|
| `alice@example.com` | `Password123!` | user |
| `bob@example.com` | `Password123!` | user, admin |

---

## How Authentication Works

```
1. User submits login form
       ↓
2. POST /api/auth/login (email + password)
       ↓
3. Server sets two HttpOnly cookies:
     access_token  — JWT, 15 min lifetime
     refresh_token — opaque token, 7 day lifetime
   Server returns csrfToken in JSON body
       ↓
4. React stores csrfToken in memory (AuthContext state)
   → Never in localStorage or sessionStorage
       ↓
5. Every mutating request (POST/PUT/DELETE) sends:
     Cookie: access_token=...    ← automatic (HttpOnly)
     X-CSRF-Token: <csrfToken>   ← added manually by AuthContext
       ↓
6. GET /api/auth/me on every page load
   → verifies session is still valid
   → returns user + roles + permissions
```

---

## Route Structure

| Path | Guard | Description |
|------|-------|-------------|
| `/login` | Public | Login page (redirects away if already authenticated) |
| `/unauthorized` | Public | 403 error page |
| `/profile` | Auth required | User profile page |
| `/admin` | Role: `admin` | Admin panel |
| `*` | — | Redirects to `/login` |

### Adding a new protected route

In `router.jsx`, add a child to the appropriate guard block:

```jsx
// Auth only
{
  element: <ProtectedRoute />,
  children: [
    { path: "/dashboard", element: <DashboardPage /> },
  ],
}

// Role-based
{
  element: <ProtectedRoute requiredRoles={["editor"]} />,
  children: [
    { path: "/editor", element: <EditorPage /> },
  ],
}

// Permission-based
{
  element: <ProtectedRoute requiredPermissions={["billing:read"]} />,
  children: [
    { path: "/billing", element: <BillingPage /> },
  ],
}
```

---

## Key Files Explained

### `AuthContext.jsx`

Central auth state using `useReducer`. Exposes:

| Value | Type | Description |
|-------|------|-------------|
| `user` | object \| null | Current user with roles + permissions |
| `isAuthenticated` | boolean | True if session is valid |
| `isLoading` | boolean | True until first `checkAuth()` resolves |
| `error` | string \| null | Last login error message |
| `login(email, password)` | function | Returns `true` on success |
| `logout()` | function | Clears session server-side + cookies |
| `checkAuth()` | function | Verifies session with `GET /api/auth/me` |

Usage in any component:

```jsx
import { useAuth } from "../context/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  // ...
}
```

### `ProtectedRoute.jsx`

Layout-route wrapper using `<Outlet>`. Checks in order:

1. `isLoading === true` → renders a spinner (prevents flash of unauthenticated content)
2. `isAuthenticated === false` → redirects to `/login` (saves current URL in `location.state.from`)
3. Role check fails → redirects to `/unauthorized`
4. Permission check fails → redirects to `/unauthorized`
5. All pass → renders `<Outlet />`

### `isSafeRedirect.js`

Validates redirect URLs before navigation to prevent open-redirect attacks. Only allows same-origin paths. Blocks `javascript:`, `data:` URIs, and external domains.

---

## Connecting to the API

All `fetch` calls in `AuthContext.jsx` use `credentials: "include"` to send cookies automatically and `VITE_API_URL` as the base:

```js
const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrfToken,   // on mutating requests
  },
});
```

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Serve it with any static file server (Nginx, Vercel, Netlify, etc.).

For the API URL in production, update `.env`:

```env
VITE_API_URL=https://api.yourdomain.com
```

---

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "MyPass123!"
}

## Security Features

- **No tokens in browser storage** — JWT lives exclusively in an HttpOnly cookie set by the server; React never sees it
- **CSRF protection** — `csrfToken` returned at login is kept in React state (memory only) and sent as `X-CSRF-Token` on every mutating request
- **No flash of unauthenticated content** — `ProtectedRoute` renders a spinner until `checkAuth()` resolves, so protected pages never flicker before redirecting
- **Safe redirect-back** — after login, the user is sent back to where they were trying to go, but only if the URL passes `isSafeRedirect()` (same-origin check)
- **Lazy loading** — protected pages are loaded with `React.lazy` + `Suspense`, so their JS bundles are never downloaded by unauthenticated users
- **Role + permission guards** — `ProtectedRoute` supports `requiredRoles` and `requiredPermissions` props; these are UX guards only — the server re-validates on every API call