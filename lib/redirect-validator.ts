/**
 * Redirect URL validation to prevent open redirect attacks.
 * Only allows same-origin redirects, whitelisted paths, and dynamic user profile routes.
 */

/** Allowed redirect paths (whitelist) */
export const ALLOWED_REDIRECT_PATHS = ['/', '/dashboard', '/projects/new', '/login'];

/**
 * Validates redirect URL to prevent open redirect attacks.
 * @param url - The URL to validate (can be relative or absolute)
 * @param baseUrl - The base URL of the application
 * @returns true if the URL is safe to redirect to
 */
export function isValidRedirectUrl(url: string, baseUrl: string): boolean {
  // Allow relative paths starting with / (but not protocol-relative //)
  if (url.startsWith('/') && !url.startsWith('//')) {
    const path = url.split('?')[0].split('#')[0];
    // Allow whitelisted paths or dynamic user profile paths (single segment like /username)
    return ALLOWED_REDIRECT_PATHS.includes(path) || /^\/[a-zA-Z0-9_-]+$/.test(path);
  }

  // For absolute URLs, verify same origin
  try {
    const redirectUrl = new URL(url);
    const base = new URL(baseUrl);
    return redirectUrl.origin === base.origin;
  } catch {
    return false;
  }
}

/**
 * Sanitizes redirect URL, returning baseUrl if invalid.
 * @param url - The URL to sanitize
 * @param baseUrl - The fallback URL
 * @returns The original URL if valid, otherwise baseUrl
 */
export function sanitizeRedirectUrl(url: string, baseUrl: string): string {
  return isValidRedirectUrl(url, baseUrl) ? url : baseUrl;
}
