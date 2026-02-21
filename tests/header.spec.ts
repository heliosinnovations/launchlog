import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Header Component - Visual and Functional Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Visual Elements', () => {
    test('should display logo with gradient icon and text', async ({ page }) => {
      const logo = page.locator('a[href="/"]').first();
      await expect(logo).toBeVisible();

      // Check logo text
      await expect(logo).toContainText('LaunchLog');

      // Check gradient icon exists
      const gradientIcon = logo.locator('div').first();
      await expect(gradientIcon).toBeVisible();

      // Verify icon has gradient classes
      const gradientClasses = await gradientIcon.getAttribute('class');
      expect(gradientClasses).toContain('bg-gradient');

      // Check Rocket icon is present
      const rocketIcon = gradientIcon.locator('svg');
      await expect(rocketIcon).toBeVisible();
    });

    test('should display navigation links on desktop', async ({ page }) => {
      // Check desktop navigation is visible on desktop viewport
      const desktopNav = page.locator('div.hidden.md\\:flex');
      await expect(desktopNav).toBeVisible();

      // Verify all navigation links
      const navLinks = ['Features', 'How It Works', 'Pricing', 'Login'];
      for (const linkText of navLinks) {
        const link = desktopNav.getByText(linkText, { exact: true });
        await expect(link).toBeVisible();
      }
    });

    test('should display CTA button with GitHub icon', async ({ page }) => {
      const ctaButton = page.locator('a[href="/auth/github"]').first();
      await expect(ctaButton).toBeVisible();
      await expect(ctaButton).toContainText('Get Started Free');

      // Check GitHub icon
      const githubIcon = ctaButton.locator('svg');
      await expect(githubIcon).toBeVisible();

      // Verify gradient background
      const buttonClasses = await ctaButton.getAttribute('class');
      expect(buttonClasses).toContain('bg-gradient');
    });

    test('should have sticky header with backdrop blur', async ({ page }) => {
      const header = page.locator('header');
      await expect(header).toBeVisible();

      const headerClasses = await header.getAttribute('class');
      expect(headerClasses).toContain('sticky');
      expect(headerClasses).toContain('backdrop-blur');
      expect(headerClasses).toContain('border-b');
    });
  });

  test.describe('Interactive States', () => {
    test('navigation links should change color on hover', async ({ page }) => {
      const link = page.locator('div.hidden.md\\:flex a').first();

      // Get initial color
      const initialColor = await link.evaluate(el =>
        window.getComputedStyle(el).color
      );

      // Hover and check color changes
      await link.hover();
      await page.waitForTimeout(300); // Wait for transition

      const hoverColor = await link.evaluate(el =>
        window.getComputedStyle(el).color
      );

      // Colors should be different (secondary -> text)
      expect(initialColor).not.toBe(hoverColor);
    });

    test('CTA button should have lift effect on hover', async ({ page }) => {
      const ctaButton = page.locator('a[href="/auth/github"]').first();

      // Get initial transform
      const initialTransform = await ctaButton.evaluate(el =>
        window.getComputedStyle(el).transform
      );

      // Hover
      await ctaButton.hover();
      await page.waitForTimeout(300); // Wait for transition

      const hoverTransform = await ctaButton.evaluate(el =>
        window.getComputedStyle(el).transform
      );

      // Transform should change (lift effect)
      expect(initialTransform).not.toBe(hoverTransform);
    });

    test('CTA button should have focus ring when focused', async ({ page }) => {
      const ctaButton = page.locator('a[href="/auth/github"]').first();

      // Focus using keyboard
      await ctaButton.focus();

      // Check for focus styles (ring)
      const buttonClasses = await ctaButton.getAttribute('class');
      expect(buttonClasses).toContain('focus:ring');
    });
  });

  test.describe('Mobile Responsive', () => {
    test('should show hamburger menu on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone size

      // Desktop nav should be hidden
      const desktopNav = page.locator('div.hidden.md\\:flex');
      await expect(desktopNav).not.toBeVisible();

      // Mobile menu button should be visible
      const mobileMenuButton = page.locator('button[aria-controls="mobile-menu"]');
      await expect(mobileMenuButton).toBeVisible();

      // Should show Menu icon initially
      const menuIcon = mobileMenuButton.locator('svg').first();
      await expect(menuIcon).toBeVisible();
    });

    test('mobile menu should toggle open and closed', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const mobileMenuButton = page.locator('button[aria-controls="mobile-menu"]');
      const mobileMenu = page.locator('#mobile-menu');

      // Initially closed (opacity-0)
      const initialClasses = await mobileMenu.getAttribute('class');
      expect(initialClasses).toContain('opacity-0');

      // Click to open
      await mobileMenuButton.click();
      await page.waitForTimeout(300); // Wait for animation

      const openClasses = await mobileMenu.getAttribute('class');
      expect(openClasses).toContain('opacity-100');

      // Verify aria-expanded is true
      const expanded = await mobileMenuButton.getAttribute('aria-expanded');
      expect(expanded).toBe('true');

      // Check X icon is now showing
      const closeIcon = mobileMenuButton.locator('svg').first();
      await expect(closeIcon).toBeVisible();

      // Click to close
      await mobileMenuButton.click();
      await page.waitForTimeout(300);

      const closedClasses = await mobileMenu.getAttribute('class');
      expect(closedClasses).toContain('opacity-0');
    });

    test('mobile menu links should close menu when clicked', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const mobileMenuButton = page.locator('button[aria-controls="mobile-menu"]');
      const mobileMenu = page.locator('#mobile-menu');

      // Open menu
      await mobileMenuButton.click();
      await page.waitForTimeout(300);

      // Click a navigation link
      const link = mobileMenu.locator('a').first();
      await link.click();
      await page.waitForTimeout(300);

      // Menu should close
      const classes = await mobileMenu.getAttribute('class');
      expect(classes).toContain('opacity-0');
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad size

      // Desktop nav should be visible at 768px (md breakpoint)
      const desktopNav = page.locator('div.hidden.md\\:flex');
      await expect(desktopNav).toBeVisible();

      // Mobile menu button should be hidden
      const mobileMenuButton = page.locator('button[aria-controls="mobile-menu"]');
      await expect(mobileMenuButton).not.toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Logo should have aria-label
      const logo = page.locator('a[aria-label="LaunchLog home"]');
      await expect(logo).toBeVisible();

      // Nav should have aria-label
      const nav = page.locator('nav[aria-label="Main navigation"]');
      await expect(nav).toBeVisible();

      // CTA button should have aria-label
      const ctaButton = page.locator('a[aria-label="Sign in with GitHub"]').first();
      await expect(ctaButton).toBeVisible();

      // Mobile menu button should have proper aria attributes
      await page.setViewportSize({ width: 375, height: 667 });
      const mobileButton = page.locator('button[aria-controls="mobile-menu"]');
      await expect(mobileButton).toHaveAttribute('aria-label');
      await expect(mobileButton).toHaveAttribute('aria-expanded');
    });

    test('should have decorative icons marked as aria-hidden', async ({ page }) => {
      // Icons in buttons/links should be aria-hidden
      const decorativeIcons = page.locator('svg[aria-hidden="true"]');
      const count = await decorativeIcons.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through navigation
      await page.keyboard.press('Tab'); // Logo
      await page.keyboard.press('Tab'); // Features
      await page.keyboard.press('Tab'); // How It Works
      await page.keyboard.press('Tab'); // Pricing
      await page.keyboard.press('Tab'); // Login
      await page.keyboard.press('Tab'); // CTA button

      // Verify CTA button is focused
      const ctaButton = page.locator('a[href="/auth/github"]').first();
      await expect(ctaButton).toBeFocused();

      // Should be activatable with Enter
      await page.keyboard.press('Enter');
      // Would navigate to /auth/github
    });

    test('should pass automated accessibility checks', async ({ page }) => {
      await injectAxe(page);
      await checkA11y(page, 'header', {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
      });
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should render correctly in all browsers', async ({ page, browserName }) => {
      // This test runs on all browsers defined in playwright.config
      const header = page.locator('header');
      await expect(header).toBeVisible();

      // Verify gradient renders
      const gradientIcon = page.locator('a[href="/"]').first().locator('div').first();
      await expect(gradientIcon).toBeVisible();

      // Verify all navigation elements present
      const logo = page.locator('a[href="/"]').first();
      await expect(logo).toBeVisible();

      const ctaButton = page.locator('a[href="/auth/github"]').first();
      await expect(ctaButton).toBeVisible();

      console.log(`✓ Header renders correctly in ${browserName}`);
    });
  });

  test.describe('Visual Regression', () => {
    test('header should match approved design - desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });

      const header = page.locator('header');
      await expect(header).toBeVisible();

      // Take screenshot for visual comparison
      await expect(header).toHaveScreenshot('header-desktop.png', {
        maxDiffPixels: 100, // Allow minor rendering differences
      });
    });

    test('header should match approved design - mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const header = page.locator('header');
      await expect(header).toBeVisible();

      await expect(header).toHaveScreenshot('header-mobile.png', {
        maxDiffPixels: 100,
      });
    });

    test('mobile menu should render correctly when open', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const mobileMenuButton = page.locator('button[aria-controls="mobile-menu"]');
      await mobileMenuButton.click();
      await page.waitForTimeout(300); // Wait for animation

      const header = page.locator('header');
      await expect(header).toHaveScreenshot('header-mobile-menu-open.png', {
        maxDiffPixels: 100,
      });
    });
  });

  test.describe('Spacing and Layout', () => {
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

      // py-5 = 1.25rem = 20px, px-12 = 3rem = 48px
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

      // px-5 = 1.25rem = 20px on mobile
      expect(padding.paddingLeft).toBe('20px');
      expect(padding.paddingRight).toBe('20px');
    });

    test('should have max-width constraint', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      const nav = page.locator('nav');
      const maxWidth = await nav.evaluate(el =>
        window.getComputedStyle(el).maxWidth
      );

      // max-w-[1280px]
      expect(maxWidth).toBe('1280px');
    });
  });

  test.describe('Performance', () => {
    test('should load header quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const header = page.locator('header');
      await expect(header).toBeVisible();
      const loadTime = Date.now() - startTime;

      // Header should be visible within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    test('should not have console errors', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForTimeout(1000); // Wait for any async errors

      expect(consoleErrors).toHaveLength(0);
    });
  });
});
