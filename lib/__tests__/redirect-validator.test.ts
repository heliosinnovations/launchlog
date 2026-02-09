import { describe, it, expect } from 'vitest';
import { isValidRedirectUrl, sanitizeRedirectUrl, ALLOWED_REDIRECT_PATHS } from '../redirect-validator';

const BASE_URL = 'https://launchlog.app';

describe('isValidRedirectUrl', () => {
  describe('whitelisted paths', () => {
    it.each(ALLOWED_REDIRECT_PATHS)('allows whitelisted path: %s', (path) => {
      expect(isValidRedirectUrl(path, BASE_URL)).toBe(true);
    });
  });

  describe('valid relative paths', () => {
    it('allows user profile paths like /username', () => {
      expect(isValidRedirectUrl('/johndoe', BASE_URL)).toBe(true);
      expect(isValidRedirectUrl('/user_123', BASE_URL)).toBe(true);
      expect(isValidRedirectUrl('/user-name', BASE_URL)).toBe(true);
    });

    it('allows paths with query strings for whitelisted routes', () => {
      expect(isValidRedirectUrl('/dashboard?tab=settings', BASE_URL)).toBe(true);
    });

    it('allows paths with hash fragments for whitelisted routes', () => {
      expect(isValidRedirectUrl('/dashboard#profile', BASE_URL)).toBe(true);
    });
  });

  describe('same-origin absolute URLs', () => {
    it('allows same-origin URLs', () => {
      expect(isValidRedirectUrl('https://launchlog.app/dashboard', BASE_URL)).toBe(true);
      expect(isValidRedirectUrl('https://launchlog.app/', BASE_URL)).toBe(true);
    });

    it('allows same-origin URLs with paths and query strings', () => {
      expect(isValidRedirectUrl('https://launchlog.app/dashboard?view=all', BASE_URL)).toBe(true);
    });
  });

  describe('blocks malicious redirects', () => {
    it('blocks external domains', () => {
      expect(isValidRedirectUrl('https://evil.com/steal-token', BASE_URL)).toBe(false);
      expect(isValidRedirectUrl('https://evil-launchlog.com', BASE_URL)).toBe(false);
      expect(isValidRedirectUrl('https://launchlog.evil.com', BASE_URL)).toBe(false);
    });

    it('blocks protocol-relative URLs (//)', () => {
      expect(isValidRedirectUrl('//evil.com', BASE_URL)).toBe(false);
      expect(isValidRedirectUrl('//evil.com/path', BASE_URL)).toBe(false);
    });

    it('blocks javascript: protocol', () => {
      expect(isValidRedirectUrl('javascript:alert(1)', BASE_URL)).toBe(false);
    });

    it('blocks data: protocol', () => {
      expect(isValidRedirectUrl('data:text/html,<script>alert(1)</script>', BASE_URL)).toBe(false);
    });

    it('blocks nested paths (potential traversal attempts)', () => {
      expect(isValidRedirectUrl('/foo/bar/baz', BASE_URL)).toBe(false);
      expect(isValidRedirectUrl('/dashboard/../../etc/passwd', BASE_URL)).toBe(false);
    });

    it('blocks similar-looking domains', () => {
      expect(isValidRedirectUrl('https://launchlog.app.evil.com', BASE_URL)).toBe(false);
      expect(isValidRedirectUrl('https://launchlogapp.com', BASE_URL)).toBe(false);
    });

    it('blocks URLs with credentials', () => {
      expect(isValidRedirectUrl('https://user:pass@evil.com', BASE_URL)).toBe(false);
    });

    it('blocks empty or malformed URLs', () => {
      expect(isValidRedirectUrl('', BASE_URL)).toBe(false);
      expect(isValidRedirectUrl('not-a-url', BASE_URL)).toBe(false);
    });
  });
});

describe('sanitizeRedirectUrl', () => {
  it('returns URL when valid', () => {
    expect(sanitizeRedirectUrl('/dashboard', BASE_URL)).toBe('/dashboard');
    expect(sanitizeRedirectUrl('https://launchlog.app/profile', BASE_URL)).toBe('https://launchlog.app/profile');
  });

  it('returns baseUrl when invalid', () => {
    expect(sanitizeRedirectUrl('https://evil.com', BASE_URL)).toBe(BASE_URL);
    expect(sanitizeRedirectUrl('//evil.com', BASE_URL)).toBe(BASE_URL);
    expect(sanitizeRedirectUrl('javascript:alert(1)', BASE_URL)).toBe(BASE_URL);
  });
});
