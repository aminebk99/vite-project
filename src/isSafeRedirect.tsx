// src/utils/isSafeRedirect.js
// Validates a redirect URL before using it as a navigation target.
//
// Blocks:
//   • javascript: URIs  → XSS vector
//   • data: URIs        → XSS vector
//   • External origins  → open-redirect attacks
//   • Malformed URLs    → surprises
//
// Only allows same-origin relative paths (e.g. "/profile", "/dashboard").

/**
 * @param {string} url - The candidate redirect path/URL.
 * @returns {boolean} true only if the URL is safe to redirect to.
 */
export function isSafeRedirect(url) {
  if (!url || typeof url !== "string") return false;

  // Reject obviously dangerous schemes before URL parsing
  const lower = url.toLowerCase().trimStart();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) {
    return false;
  }

  try {
    // Resolve against current origin — relative paths become absolute
    const parsed = new URL(url, window.location.origin);

    // Must stay on the same origin
    return parsed.origin === window.location.origin;
  } catch {
    // Malformed URL
    return false;
  }
}