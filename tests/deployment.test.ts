/**
 * Deployment and Integration Tests for LaunchLog
 * Issue #1 - Project Setup
 */

import { describe, it, expect } from '@jest/globals';

const DEPLOYED_URL = 'https://launchlog-lac.vercel.app';

describe('LaunchLog Deployment Tests', () => {
  describe('HTTP Status and Availability', () => {
    it('should return HTTP 200 on deployed URL', async () => {
      const response = await fetch(DEPLOYED_URL);
      expect(response.status).toBe(200);
    });

    it('should load page in under 2 seconds', async () => {
      const startTime = Date.now();
      await fetch(DEPLOYED_URL);
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000);
    });

    it('should return HTML content-type', async () => {
      const response = await fetch(DEPLOYED_URL);
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('text/html');
    });
  });

  describe('Content Verification', () => {
    let htmlContent: string;

    beforeAll(async () => {
      const response = await fetch(DEPLOYED_URL);
      htmlContent = await response.text();
    });

    it('should contain LaunchLog title', () => {
      expect(htmlContent).toContain('LaunchLog');
    });

    it('should contain Coming Soon text', () => {
      expect(htmlContent).toContain('Coming Soon');
    });

    it('should contain Building in public badge', () => {
      expect(htmlContent).toContain('Building in public');
    });

    it('should have Space Grotesk font reference', () => {
      expect(htmlContent).toContain('font-space-grotesk');
    });

    it('should have animate-pulse class for badge', () => {
      expect(htmlContent).toContain('animate-pulse');
    });

    it('should include proper meta tags', () => {
      expect(htmlContent).toContain('name="viewport"');
      expect(htmlContent).toContain('name="description"');
    });

    it('should have correct page title', () => {
      expect(htmlContent).toContain("LaunchLog - Show the World Your Code's Impact");
    });
  });

  describe('Font Loading', () => {
    it('should preload Space Grotesk font files', async () => {
      const response = await fetch(DEPLOYED_URL);
      const html = await response.text();

      // Check for woff2 font preload
      expect(html).toMatch(/\.woff2.*font/);
    });

    it('should load font files successfully', async () => {
      // Get the HTML first
      const response = await fetch(DEPLOYED_URL);
      const html = await response.text();

      // Extract font URLs
      const fontMatches = html.match(/href="([^"]*\.woff2)"/g);
      expect(fontMatches).toBeTruthy();
      expect(fontMatches!.length).toBeGreaterThan(0);

      // Test first font file loads
      const fontUrl = fontMatches![0].match(/href="([^"]*)"/)?.[1];
      if (fontUrl) {
        const fullUrl = new URL(fontUrl, DEPLOYED_URL).href;
        const fontResponse = await fetch(fullUrl);
        expect(fontResponse.status).toBe(200);
        expect(fontResponse.headers.get('content-type')).toContain('font');
      }
    });
  });

  describe('Dark Mode Support', () => {
    it('should include dark mode CSS', async () => {
      const response = await fetch(DEPLOYED_URL);
      const html = await response.text();

      // Extract CSS file URL
      const cssMatch = html.match(/href="([^"]*\.css)"/);
      expect(cssMatch).toBeTruthy();

      const cssUrl = new URL(cssMatch![1], DEPLOYED_URL).href;
      const cssResponse = await fetch(cssUrl);
      const cssContent = await cssResponse.text();

      // Check for dark mode media query
      expect(cssContent).toContain('prefers-color-scheme:dark');

      // Check for dark mode color variables
      expect(cssContent).toContain('--color-bg:#0f0f14');
      expect(cssContent).toContain('--color-surface:#1a1a24');
    });
  });

  describe('Security', () => {
    it('should use HTTPS', () => {
      expect(DEPLOYED_URL).toMatch(/^https:/);
    });

    it('should not have obvious XSS vulnerabilities', async () => {
      const response = await fetch(DEPLOYED_URL);
      const html = await response.text();

      // Check no inline event handlers
      expect(html).not.toMatch(/on(click|load|error|mouseover)=/i);

      // All scripts should be from Next.js static assets
      const scriptMatches = html.match(/<script[^>]*src="([^"]*)"/g);
      if (scriptMatches) {
        scriptMatches.forEach(script => {
          const src = script.match(/src="([^"]*)"/)?.[1];
          expect(src).toMatch(/^\/_next\/static/);
        });
      }
    });

    it('should have proper charset declaration', async () => {
      const response = await fetch(DEPLOYED_URL);
      const html = await response.text();
      // React uses charSet (camelCase) in JSX
      expect(html).toContain('charSet="utf-8"');
    });
  });

  describe('Bundle Size', () => {
    it('should have reasonable HTML size', async () => {
      const response = await fetch(DEPLOYED_URL);
      const html = await response.text();
      const sizeKB = html.length / 1024;

      // HTML should be under 50KB for a simple landing page
      expect(sizeKB).toBeLessThan(50);
    });
  });
});
