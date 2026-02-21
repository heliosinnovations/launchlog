import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Header Component - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for navigation header to load
    await page.waitForSelector('nav[aria-label="Main navigation"]');
  });

  test.describe('Visual Elements', () => {
    test('should display logo with gradient icon and LaunchLog text', async ({ page }) => {
      const logo = page.locator('a[aria-label="LaunchLog home"]');
      await expect(logo).toBeVisible();
      await expect(logo).toContainText('LaunchLog');

      // Check gradient icon with Rocket
      const gradientIcon = logo.locator('div').first();
      await expect(gradientIcon).toBeVisible();

      const classes = await gradientIcon.getAttribute('class');
      expect(classes).toContain('bg-gradient');

      const rocketIcon = gradientIcon.locator('svg');
      await expect(rocketIcon).toBeVisible();
    });

    test('should display all navigation links on desktop', async ({ page }) => {
      const desktopNav = page.locator('div.hidden.md\\:flex');
      await expect(desktopNav).toBeVisible();

      const navLinks = ['Features', 'How It Works', 'Pricing', 'Login'];
      for (const linkText of navLinks) {
        const link = desktopNav.getByText(linkText, { exact: true });
        await expect(link).toBeVisible();
      }
    });

    test('should display CTA button with GitHub icon and gradient', async ({ page }) => {
      const ctaButton = page.locator('a[href="/auth/github"]').first();
      await expect(ctaButton).toBeVisible();
      await expect(ctaButton).toContainText('Get Started Free');

      const githubIcon = ctaButton.locator('svg');
      await expect(githubIcon).toBeVisible();

      const classes = await ctaButton.getAttribute('class');
      expect(classes).toContain('bg-gradient');
    });

    test('navigation header should be sticky with backdrop blur', async ({ page }) => {
      const navHeader = page.locator('header').first();
      await expect(navHeader).toBeVisible();

      const classes = await navHeader.getAttribute('class');
      expect(classes).toContain('sticky');
      expect(classes).toContain('backdrop-blur');
      expect(classes).toContain('border-b');
    });
  });

  test.describe('Interactive States', () => {
    test('navigation links should have hover effect', async ({ page }) => {
      const link = page.locator('div.hidden.md\\:flex a[href="#features"]');
      await expect(link).toBeVisible();

      const initialColor = await link.evaluate(el =>
        window.getComputedStyle(el).color
      );

      await link.hover();
      await page.waitForTimeout(200);

      const hoverColor = await link.evaluate(el =>
        window.getComputedStyle(el).color
      );

      // Color should change on hover
      expect(initialColor).not.toBe(hoverColor);
    });

    test('CTA button should have visible hover effects', async ({ page }) => {
      const ctaButton = page.locator('a[href="/auth/github"]').first();
      await expect(ctaButton).toBeVisible();

      // Hover on button
      await ctaButton.hover();
      await page.waitForTimeout(300);

      // Button should have shadow classes
      const classes = await ctaButton.getAttribute('class');
      expect(classes).toContain('hover:shadow');
    });

    test('CTA button should have focus ring', async ({ page }) => {
      const ctaButton = page.locator('a[href="/auth/github"]').first();
      await ctaButton.focus();

      const classes = await ctaButton.getAttribute('class');
      expect(classes).toContain('focus:ring');
    });
  });

  test.describe('Mobile Responsive', () => {
    test('should show hamburger menu on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const desktopNav = page.locator('div.hidden.md\\:flex');
      await expect(desktopNav).not.toBeVisible();

      const mobileMenuButton = page.locator('button[aria-controls="mobile-menu"]');
      await expect(mobileMenuButton).toBeVisible();
    });

    test('mobile menu should toggle open and closed', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const mobileMenuButton = page.locator('button[aria-controls="mobile-menu"]');
      const mobileMenu = page.locator('#mobile-menu');

      // Check initial state (closed)
      let expanded = await mobileMenuButton.getAttribute('aria-expanded');
      expect(expanded).toBe('false');

      // Open menu
      await mobileMenuButton.click();
      await page.waitForTimeout(300);

      expanded = await mobileMenuButton.getAttribute('aria-expanded');
      expect(expanded).toBe('true');

      const classes = await mobileMenu.getAttribute('class');
      expect(classes).toContain('opacity-100');

      // Close menu
      await mobileMenuButton.click();
      await page.waitForTimeout(300);

      expanded = await mobileMenuButton.getAttribute('aria-expanded');
      expect(expanded).toBe('false');
    });

    test('mobile menu links should close menu when clicked', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const mobileMenuButton = page.locator('button[aria-controls="mobile-menu"]');
      const mobileMenu = page.locator('#mobile-menu');

      // Open menu
      await mobileMenuButton.click();
      await page.waitForTimeout(300);

      // Click a link
      const link = mobileMenu.locator('a').first();
      await link.click();
      await page.waitForTimeout(300);

      // Menu should be closed
      const expanded = await mobileMenuButton.getAttribute('aria-expanded');
      expect(expanded).toBe('false');
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Desktop nav visible at md breakpoint
      const desktopNav = page.locator('div.hidden.md\\:flex');
      await expect(desktopNav).toBeVisible();

      // Mobile menu button hidden
      const mobileMenuButton = page.locator('button[aria-controls="mobile-menu"]');
      await expect(mobileMenuButton).not.toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and attributes', async ({ page }) => {
      // Navigation
      const nav = page.locator('nav[aria-label="Main navigation"]');
      await expect(nav).toBeVisible();

      // Logo
      const logo = page.locator('a[aria-label="LaunchLog home"]');
      await expect(logo).toBeVisible();

      // CTA button
      const ctaButton = page.locator('a[aria-label="Sign in with GitHub"]').first();
      await expect(ctaButton).toBeVisible();

      // Mobile menu button
      await page.setViewportSize({ width: 375, height: 667 });
      const mobileButton = page.locator('button[aria-controls="mobile-menu"]');
      await expect(mobileButton).toHaveAttribute('aria-label');
      await expect(mobileButton).toHaveAttribute('aria-expanded');
      await expect(mobileButton).toHaveAttribute('aria-controls', 'mobile-menu');
    });

    test('should mark decorative icons as aria-hidden', async ({ page }) => {
      const decorativeIcons = page.locator('svg[aria-hidden="true"]');
      const count = await decorativeIcons.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should support keyboard navigation through all links', async ({ page }) => {
      // Tab to logo
      await page.keyboard.press('Tab');
      let focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBe('A');

      // Tab through navigation links
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }

      // Should eventually reach CTA button
      const ctaButton = page.locator('a[href="/auth/github"]').first();
      const isFocused = await ctaButton.evaluate(el => el === document.activeElement);
      expect(isFocused).toBe(true);
    });

    test('should pass automated accessibility checks', async ({ page }) => {
      await injectAxe(page);

      // Check entire page accessibility
      await checkA11y(page, undefined, {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
      });
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should render correctly in current browser', async ({ page, browserName }) => {
      const nav = page.locator('nav[aria-label="Main navigation"]');
      await expect(nav).toBeVisible();

      const logo = page.locator('a[aria-label="LaunchLog home"]');
      await expect(logo).toBeVisible();

      const gradientIcon = logo.locator('div').first();
      await expect(gradientIcon).toBeVisible();

      const ctaButton = page.locator('a[href="/auth/github"]').first();
      await expect(ctaButton).toBeVisible();

      console.log(`✓ Header renders correctly in ${browserName}`);
    });
  });

  test.describe('Layout and Spacing', () => {
    test('should have correct padding on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });

      const nav = page.locator('nav');
      const padding = await nav.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          paddingTop: styles.paddingTop,
          paddingBottom: styles.paddingBottom,
          paddingLeft: styles.paddingLeft,
          paddingRight: styles.paddingRight,
        };
      });

      // py-5 = 20px, px-12 = 48px on desktop (md:px-12)
      expect(padding.paddingTop).toBe('20px');
      expect(padding.paddingBottom).toBe('20px');
      expect(padding.paddingLeft).toBe('48px');
      expect(padding.paddingRight).toBe('48px');
    });

    test('should have correct padding on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const nav = page.locator('nav');
      const padding = await nav.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          paddingLeft: styles.paddingLeft,
          paddingRight: styles.paddingRight,
        };
      });

      // px-5 = 20px on mobile
      expect(padding.paddingLeft).toBe('20px');
      expect(padding.paddingRight).toBe('20px');
    });

    test('should have max-width constraint', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      const nav = page.locator('nav');
      const maxWidth = await nav.evaluate(el =>
        window.getComputedStyle(el).maxWidth
      );

      expect(maxWidth).toBe('1280px');
    });
  });

  test.describe('Visual Regression', () => {
    test('header should render consistently on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });

      const navHeader = page.locator('header').first();
      await expect(navHeader).toBeVisible();

      // Take screenshot
      await expect(navHeader).toHaveScreenshot('header-desktop.png', {
        maxDiffPixels: 100,
      });
    });

    test('header should render consistently on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const navHeader = page.locator('header').first();
      await expect(navHeader).toBeVisible();

      await expect(navHeader).toHaveScreenshot('header-mobile.png', {
        maxDiffPixels: 100,
      });
    });

    test('mobile menu should render consistently when open', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const mobileMenuButton = page.locator('button[aria-controls="mobile-menu"]');
      await mobileMenuButton.click();
      await page.waitForTimeout(300);

      const navHeader = page.locator('header').first();
      await expect(navHeader).toHaveScreenshot('header-mobile-menu-open.png', {
        maxDiffPixels: 100,
      });
    });
  });

  test.describe('Performance', () => {
    test('header should load quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');

      const nav = page.locator('nav[aria-label="Main navigation"]');
      await expect(nav).toBeVisible();

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 seconds max
    });

    test('should track console errors (non-blocking)', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForTimeout(1000);

      // Report errors but don't fail the test
      if (consoleErrors.length > 0) {
        console.log(`⚠️  Console errors detected: ${consoleErrors.length}`);
        consoleErrors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error}`);
        });
      } else {
        console.log('✓ No console errors detected');
      }
    });
  });
});
