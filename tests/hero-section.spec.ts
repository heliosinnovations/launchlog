import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Hero Section - Issue #2', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for hero section to be visible
    await page.waitForSelector('h1', { state: 'visible' });
  });

  test.describe('Visual Regression & Typography', () => {
    test('should display headline with correct text', async ({ page }) => {
      const headline = page.locator('h1');
      await expect(headline).toBeVisible();

      // Check headline text content
      const headlineText = await headline.textContent();
      expect(headlineText).toContain('Show the world your');
      expect(headlineText).toContain("code's real impact");
    });

    test('should display gradient text on headline', async ({ page }) => {
      const gradientText = page.locator('h1 span.bg-gradient-to-r');
      await expect(gradientText).toBeVisible();

      // Verify the gradient text content
      const gradientContent = await gradientText.textContent();
      expect(gradientContent?.trim()).toBe("code's real impact");

      // Verify gradient CSS classes are applied
      await expect(gradientText).toHaveClass(/bg-gradient-to-r/);
      await expect(gradientText).toHaveClass(/from-indigo-500/);
      await expect(gradientText).toHaveClass(/via-purple-500/);
      await expect(gradientText).toHaveClass(/to-fuchsia-500/);
      await expect(gradientText).toHaveClass(/bg-clip-text/);
      await expect(gradientText).toHaveClass(/text-transparent/);
    });

    test('should display subheadline with correct text', async ({ page }) => {
      const subheadline = page.locator('p.text-base, p.md\\:text-xl').first();
      await expect(subheadline).toBeVisible();

      const subheadlineText = await subheadline.textContent();
      expect(subheadlineText).toContain('Like Google Scholar citations, but for developers');
    });

    test('should use Space Grotesk font for headline', async ({ page }) => {
      const headline = page.locator('h1');

      // Check that Space Grotesk font variable is applied
      await expect(headline).toHaveClass(/font-\[family-name:var\(--font-space-grotesk\)\]/);
    });
  });

  test.describe('CTA Buttons', () => {
    test('should display primary CTA button with GitHub icon', async ({ page }) => {
      const primaryCta = page.locator('a[href="/auth/github"]');
      await expect(primaryCta).toBeVisible();

      // Check button text
      const buttonText = await primaryCta.textContent();
      expect(buttonText?.trim()).toBe('Sign in with GitHub');

      // Check GitHub icon is present (lucide-react Github component)
      const githubIcon = primaryCta.locator('svg');
      await expect(githubIcon).toBeVisible();

      // Verify gradient background classes
      await expect(primaryCta).toHaveClass(/bg-gradient-to-r/);
      await expect(primaryCta).toHaveClass(/from-indigo-500/);
    });

    test('should display secondary CTA button', async ({ page }) => {
      const secondaryCta = page.locator('a[href="#example"]');
      await expect(secondaryCta).toBeVisible();

      const buttonText = await secondaryCta.textContent();
      expect(buttonText?.trim()).toBe('See Example Portfolio');
    });
  });

  test.describe('Platform Badges', () => {
    test('should display all 4 platform badges', async ({ page }) => {
      // Wait for badges container
      const badgesContainer = page.locator('[role="list"][aria-label*="platform mention badges"]');
      await expect(badgesContainer).toBeVisible();

      // Check all 4 badges are present
      const badges = page.locator('[role="listitem"]');
      await expect(badges).toHaveCount(4);
    });

    test('should display HackerNews badge with correct data', async ({ page }) => {
      const hnBadge = page.locator('[aria-label*="HackerNews"]');
      await expect(hnBadge).toBeVisible();

      const badgeText = await hnBadge.textContent();
      expect(badgeText).toContain('127');
      expect(badgeText).toContain('points');
    });

    test('should display Product Hunt badge with correct data', async ({ page }) => {
      const phBadge = page.locator('[aria-label*="Product Hunt"]');
      await expect(phBadge).toBeVisible();

      const badgeText = await phBadge.textContent();
      expect(badgeText).toContain('#3');
      expect(badgeText).toContain('Product');
    });

    test('should display Twitter badge with correct data', async ({ page }) => {
      const twitterBadge = page.locator('[aria-label*="Twitter"]');
      await expect(twitterBadge).toBeVisible();

      const badgeText = await twitterBadge.textContent();
      expect(badgeText).toContain('2.4K');
      expect(badgeText).toContain('mentions');
    });

    test('should display Reddit badge with correct data', async ({ page }) => {
      const redditBadge = page.locator('[aria-label*="Reddit"]');
      await expect(redditBadge).toBeVisible();

      const badgeText = await redditBadge.textContent();
      expect(badgeText).toContain('89');
      expect(badgeText).toContain('upvotes');
    });

    test('should display caption below badges', async ({ page }) => {
      const caption = page.locator('text=Example badges that appear on your projects — updated automatically');
      await expect(caption).toBeVisible();
    });
  });

  test.describe('Interactive States - Hover Effects', () => {
    test('primary CTA should have hover effect', async ({ page, browserName }) => {
      // Skip on mobile browsers that don't support hover
      test.skip(browserName === 'webkit' && page.viewportSize()?.width! < 768, 'Mobile Safari does not support hover states');

      const primaryCta = page.locator('a[href="/auth/github"]');

      // Take screenshot before hover
      await primaryCta.scrollIntoViewIfNeeded();
      const beforeHover = await primaryCta.screenshot();

      // Hover over button
      await primaryCta.hover();
      await page.waitForTimeout(500); // Wait for transition

      // Take screenshot after hover
      const afterHover = await primaryCta.screenshot();

      // Screenshots should be different (hover effect applied)
      expect(beforeHover.equals(afterHover)).toBe(false);

      // Verify transform class is applied
      await expect(primaryCta).toHaveClass(/hover:-translate-y-0.5/);
    });

    test('platform badges should have hover effect', async ({ page, browserName }) => {
      test.skip(browserName === 'webkit' && page.viewportSize()?.width! < 768, 'Mobile Safari does not support hover states');

      const hnBadge = page.locator('[aria-label*="HackerNews"]');

      // Hover over badge
      await hnBadge.scrollIntoViewIfNeeded();
      await hnBadge.hover();
      await page.waitForTimeout(500); // Wait for transition

      // Verify hover classes are applied
      await expect(hnBadge).toHaveClass(/hover:-translate-y-1/);
      await expect(hnBadge).toHaveClass(/hover:shadow-lg/);
    });
  });

  test.describe('Responsive Design', () => {
    test('mobile viewport (375px) - should display correctly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Headline should be smaller on mobile
      const headline = page.locator('h1');
      await expect(headline).toBeVisible();
      await expect(headline).toHaveClass(/text-\[32px\]/);

      // CTA buttons should stack vertically
      const ctaContainer = page.locator('[role="group"][aria-label*="Call to action"]');
      await expect(ctaContainer).toHaveClass(/flex-col/);

      // Badges should be full width on mobile
      const badges = page.locator('[role="listitem"]').first();
      await expect(badges).toHaveClass(/w-full/);
    });

    test('tablet viewport (768px) - should display correctly', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      // Headline should be medium size
      const headline = page.locator('h1');
      await expect(headline).toBeVisible();
      await expect(headline).toHaveClass(/md:text-\[44px\]/);

      // Elements should be visible
      await expect(page.locator('a[href="/auth/github"]')).toBeVisible();
      await expect(page.locator('[role="listitem"]').first()).toBeVisible();
    });

    test('desktop viewport (1280px) - should display correctly', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');

      // Headline should be largest on desktop
      const headline = page.locator('h1');
      await expect(headline).toBeVisible();
      await expect(headline).toHaveClass(/lg:text-\[64px\]/);

      // CTA buttons should be horizontal
      const ctaContainer = page.locator('[role="group"][aria-label*="Call to action"]');
      await expect(ctaContainer).toHaveClass(/sm:flex-row/);

      // All elements should be visible
      await expect(page.locator('a[href="/auth/github"]')).toBeVisible();
      await expect(page.locator('a[href="#example"]')).toBeVisible();
      const badges = page.locator('[role="listitem"]');
      await expect(badges).toHaveCount(4);
    });

    test('text should wrap properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Check that headline wraps and is readable
      const headline = page.locator('h1');
      const box = await headline.boundingBox();

      // Headline should not overflow viewport
      expect(box?.width).toBeLessThanOrEqual(375);
    });
  });

  test.describe('Accessibility - WCAG AA', () => {
    test('should pass automated accessibility tests', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper ARIA labels on interactive elements', async ({ page }) => {
      // Check primary CTA aria-label
      const primaryCta = page.locator('a[href="/auth/github"]');
      await expect(primaryCta).toHaveAttribute('aria-label', 'Sign in with GitHub to connect your account');

      // Check secondary CTA aria-label
      const secondaryCta = page.locator('a[href="#example"]');
      await expect(secondaryCta).toHaveAttribute('aria-label', 'View an example portfolio');

      // Check badges container has proper role and label
      const badgesContainer = page.locator('[role="list"]');
      await expect(badgesContainer).toHaveAttribute('aria-label', 'Example platform mention badges');
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');

      // First tab should focus primary CTA
      let focusedElement = await page.evaluateHandle(() => document.activeElement);
      let href = await focusedElement.evaluate(el => el.getAttribute('href'));
      expect(href).toBe('/auth/github');

      // Second tab should focus secondary CTA
      await page.keyboard.press('Tab');
      focusedElement = await page.evaluateHandle(() => document.activeElement);
      href = await focusedElement.evaluate(el => el.getAttribute('href'));
      expect(href).toBe('#example');
    });

    test('should have focus indicators on interactive elements', async ({ page }) => {
      const primaryCta = page.locator('a[href="/auth/github"]');

      // Focus the button
      await primaryCta.focus();

      // Verify focus ring classes are present
      await expect(primaryCta).toHaveClass(/focus:outline-none/);
      await expect(primaryCta).toHaveClass(/focus:ring-2/);
      await expect(primaryCta).toHaveClass(/focus:ring-indigo-500/);
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // Run contrast-specific accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .include('h1')
        .include('p')
        .include('a')
        .analyze();

      const contrastViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'color-contrast'
      );

      expect(contrastViolations).toHaveLength(0);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      // Check that h1 exists and is unique
      const h1Elements = page.locator('h1');
      await expect(h1Elements).toHaveCount(1);

      // Verify h1 has meaningful text
      const h1Text = await h1Elements.textContent();
      expect(h1Text?.length).toBeGreaterThan(10);
    });
  });

  test.describe('Console Errors', () => {
    test('should not have console errors', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Filter out known third-party errors
      const relevantErrors = errors.filter(err =>
        !err.includes('favicon') &&
        !err.includes('chrome-extension')
      );

      expect(relevantErrors).toHaveLength(0);
    });
  });

  test.describe('Visual Snapshot', () => {
    test('hero section visual regression', async ({ page, browserName }) => {
      // Take full hero section screenshot for visual regression
      const heroSection = page.locator('section').first();

      await expect(heroSection).toHaveScreenshot(`hero-section-${browserName}.png`, {
        maxDiffPixels: 100, // Allow small differences for font rendering
      });
    });
  });
});
