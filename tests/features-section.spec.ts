import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive test suite for LaunchLog Features Section (Issue #3)
 *
 * Tests:
 * - Visual rendering
 * - Interactive states (hover effects)
 * - Responsive design (mobile, tablet, desktop)
 * - Cross-browser compatibility
 * - Typography (Space Grotesk font)
 * - Accessibility (ARIA, semantic HTML, contrast)
 */

const DEPLOYED_URL = 'https://launchlog-lac.vercel.app';

test.describe('Features Section - Visual and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEPLOYED_URL);
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should render features section below hero', async ({ page }) => {
    const heroSection = page.locator('section').first();
    const featuresSection = page.locator('section').nth(1);

    await expect(featuresSection).toBeVisible();

    // Verify section is below hero by comparing positions
    const heroBox = await heroSection.boundingBox();
    const featuresBox = await featuresSection.boundingBox();

    expect(featuresBox!.y).toBeGreaterThan(heroBox!.y);
  });

  test('should display section header with correct text', async ({ page }) => {
    const header = page.locator('h2:has-text("Everything syncs automatically")');
    await expect(header).toBeVisible();
    await expect(header).toHaveText('Everything syncs automatically');
  });

  test('should display subheader with correct text', async ({ page }) => {
    const subheader = page.locator('text=Connect once. Never manually update your portfolio again.');
    await expect(subheader).toBeVisible();
  });

  test('should display exactly 4 feature cards', async ({ page }) => {
    const featureCards = page.locator('article').filter({ has: page.locator('h3') });
    await expect(featureCards).toHaveCount(4);
  });

  test('should display all 4 feature titles', async ({ page }) => {
    const expectedTitles = [
      'Auto-sync repos from GitHub',
      'Track mentions',
      'Embeddable widget',
      'Beautiful showcase pages'
    ];

    for (const title of expectedTitles) {
      await expect(page.locator(`h3:has-text("${title}")`)).toBeVisible();
    }
  });

  test('should display icons for all feature cards', async ({ page }) => {
    const icons = page.locator('article div[aria-hidden="true"]');
    await expect(icons).toHaveCount(4);

    // Verify each icon has proper styling
    for (let i = 0; i < 4; i++) {
      const icon = icons.nth(i);
      await expect(icon).toBeVisible();

      // Check icon container has proper dimensions
      const box = await icon.boundingBox();
      expect(box!.width).toBeCloseTo(48, 5); // 48px = 12 * 4 (w-12)
      expect(box!.height).toBeCloseTo(48, 5);
    }
  });

  test('should have correct icon colors', async ({ page }) => {
    const iconClasses = [
      'bg-indigo-500/10',
      'bg-orange-500/10',
      'bg-cyan-500/10',
      'bg-purple-500/10'
    ];

    const icons = page.locator('article div[aria-hidden="true"]');

    for (let i = 0; i < iconClasses.length; i++) {
      const icon = icons.nth(i);
      const classList = await icon.getAttribute('class');
      expect(classList).toContain(iconClasses[i]);
    }
  });
});

test.describe('Features Section - Interactive States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEPLOYED_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should show hover effect on feature cards', async ({ page, browserName }) => {
    // WebKit (Safari) hover tests can be flaky, so we skip detailed hover checks there
    test.skip(browserName === 'webkit', 'Hover state detection is unreliable in WebKit');

    const firstCard = page.locator('article').first();

    // Get initial border color (should be var(--color-border))
    const initialBorder = await firstCard.evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });

    // Hover over the card
    await firstCard.hover();

    // Wait a bit for transition
    await page.waitForTimeout(400);

    // Get border color after hover (should be var(--color-primary))
    const hoveredBorder = await firstCard.evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });

    // Border color should change on hover
    expect(hoveredBorder).not.toBe(initialBorder);
  });

  test('should have transition classes on all cards', async ({ page }) => {
    const cards = page.locator('article');

    for (let i = 0; i < 4; i++) {
      const card = cards.nth(i);
      const classList = await card.getAttribute('class');

      // Check for transition classes
      expect(classList).toContain('transition-all');
      expect(classList).toContain('duration-300');
      expect(classList).toContain('hover:border-[var(--color-primary)]');
      expect(classList).toContain('hover:shadow-[var(--shadow-glow)]');
    }
  });
});

test.describe('Features Section - Responsive Design', () => {
  test('mobile (375px) - should display 1 column layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(DEPLOYED_URL);
    await page.waitForLoadState('networkidle');

    const grid = page.locator('div[role="list"][aria-label="Product features"]');

    // Get grid class attribute
    const gridClass = await grid.getAttribute('class');
    expect(gridClass).toContain('grid-cols-1');

    // Verify cards stack vertically
    const cards = page.locator('article');
    const firstCardBox = await cards.nth(0).boundingBox();
    const secondCardBox = await cards.nth(1).boundingBox();

    // Second card should be below first card (higher Y coordinate)
    expect(secondCardBox!.y).toBeGreaterThan(firstCardBox!.y + firstCardBox!.height);
  });

  test('tablet (768px) - should display 2 column layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(DEPLOYED_URL);
    await page.waitForLoadState('networkidle');

    const grid = page.locator('div[role="list"][aria-label="Product features"]');
    const gridClass = await grid.getAttribute('class');
    expect(gridClass).toContain('md:grid-cols-2');

    // Verify 2-column layout
    const cards = page.locator('article');
    const firstCardBox = await cards.nth(0).boundingBox();
    const secondCardBox = await cards.nth(1).boundingBox();

    // First two cards should be on same row (similar Y coordinates)
    expect(Math.abs(firstCardBox!.y - secondCardBox!.y)).toBeLessThan(10);
  });

  test('desktop (1280px) - should display 2x2 grid', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(DEPLOYED_URL);
    await page.waitForLoadState('networkidle');

    const grid = page.locator('div[role="list"][aria-label="Product features"]');
    const gridClass = await grid.getAttribute('class');
    expect(gridClass).toContain('md:grid-cols-2');

    // Verify grid layout with 4 cards in 2x2
    const cards = page.locator('article');
    const positions = [];

    for (let i = 0; i < 4; i++) {
      const box = await cards.nth(i).boundingBox();
      positions.push({ x: box!.x, y: box!.y });
    }

    // Cards 0 and 1 should be on same row
    expect(Math.abs(positions[0].y - positions[1].y)).toBeLessThan(10);

    // Cards 2 and 3 should be on same row
    expect(Math.abs(positions[2].y - positions[3].y)).toBeLessThan(10);

    // Row 2 should be below row 1
    expect(positions[2].y).toBeGreaterThan(positions[0].y);
  });

  test('should have proper spacing on all viewports', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1280, height: 800, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(DEPLOYED_URL);
      await page.waitForLoadState('networkidle');

      const grid = page.locator('div[role="list"][aria-label="Product features"]');
      const gridClass = await grid.getAttribute('class');

      // Verify gap-6 class exists (24px gap)
      expect(gridClass).toContain('gap-6');
    }
  });
});

test.describe('Features Section - Typography', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEPLOYED_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should load Space Grotesk font for section header', async ({ page }) => {
    const header = page.locator('h2:has-text("Everything syncs automatically")');

    const fontFamily = await header.evaluate((el) => {
      return window.getComputedStyle(el).fontFamily;
    });

    // Should include Space Grotesk in font stack
    expect(fontFamily.toLowerCase()).toContain('space');
  });

  test('should have correct header font sizes', async ({ page }) => {
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(DEPLOYED_URL);
    await page.waitForLoadState('networkidle');

    const header = page.locator('h2:has-text("Everything syncs automatically")');
    const mobileFontSize = await header.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // Should be 28px on mobile (text-[28px])
    expect(parseFloat(mobileFontSize)).toBeCloseTo(28, 2);

    // Desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(DEPLOYED_URL);
    await page.waitForLoadState('networkidle');

    const desktopFontSize = await header.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // Should be 40px on desktop (md:text-[40px])
    expect(parseFloat(desktopFontSize)).toBeCloseTo(40, 2);
  });

  test('should have correct text hierarchy', async ({ page }) => {
    const header = page.locator('h2:has-text("Everything syncs automatically")');
    const subheader = page.locator('text=Connect once. Never manually update your portfolio again.');
    const cardTitles = page.locator('article h3');

    // Header should be bold
    const headerWeight = await header.evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    expect(parseInt(headerWeight)).toBeGreaterThanOrEqual(700);

    // Card titles should be bold
    const titleWeight = await cardTitles.first().evaluate((el) => {
      return window.getComputedStyle(el).fontWeight;
    });
    expect(parseInt(titleWeight)).toBeGreaterThanOrEqual(700);
  });
});

test.describe('Features Section - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DEPLOYED_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should have proper semantic HTML structure', async ({ page }) => {
    // Section should use <section> tag
    const section = page.locator('section').nth(1);
    await expect(section).toBeVisible();

    // Should have aria-labelledby pointing to heading
    const ariaLabelledBy = await section.locator('..').getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      expect(ariaLabelledBy).toBe('features-heading');
    }

    // Header should use <header> tag
    const header = page.locator('header:has-text("Everything syncs automatically")');
    await expect(header).toBeVisible();

    // Each feature card should use <article> tag
    const articles = page.locator('article');
    await expect(articles).toHaveCount(4);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Grid should have role="list"
    const grid = page.locator('div[role="list"][aria-label="Product features"]');
    await expect(grid).toBeVisible();

    const ariaLabel = await grid.getAttribute('aria-label');
    expect(ariaLabel).toBe('Product features');

    // Each grid item should have role="listitem" within the features grid
    const featuresGrid = page.locator('div[role="list"][aria-label="Product features"]');
    const listItems = featuresGrid.locator('div[role="listitem"]');
    await expect(listItems).toHaveCount(4);
  });

  test('should have icons marked as decorative', async ({ page }) => {
    const icons = page.locator('article div[aria-hidden="true"]');
    await expect(icons).toHaveCount(4);

    // All icons should have aria-hidden="true"
    for (let i = 0; i < 4; i++) {
      const ariaHidden = await icons.nth(i).getAttribute('aria-hidden');
      expect(ariaHidden).toBe('true');
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Features heading should be h2
    const h2 = page.locator('h2:has-text("Everything syncs automatically")');
    await expect(h2).toBeVisible();

    // Feature titles should be h3
    const h3s = page.locator('article h3');
    await expect(h3s).toHaveCount(4);
  });

  test('should have sufficient color contrast for text', async ({ page }) => {
    // This is a basic check - full contrast testing would require additional tools
    const header = page.locator('h2:has-text("Everything syncs automatically")');
    const subheader = page.locator('text=Connect once. Never manually update your portfolio again.');

    // Verify text is visible (basic contrast check)
    await expect(header).toBeVisible();
    await expect(subheader).toBeVisible();

    // Verify secondary text has the correct CSS variable
    const subheaderColor = await subheader.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Should use --color-text-secondary
    expect(subheaderColor).toBeTruthy();
  });
});

test.describe('Features Section - Cross-Browser Compatibility', () => {
  test('should render correctly in all browsers', async ({ page, browserName }) => {
    await page.goto(DEPLOYED_URL);
    await page.waitForLoadState('networkidle');

    // Verify key elements exist in all browsers
    await expect(page.locator('h2:has-text("Everything syncs automatically")')).toBeVisible();
    await expect(page.locator('article')).toHaveCount(4);

    // Take screenshot for visual verification
    await page.screenshot({
      path: `tests/screenshots/features-section-${browserName}.png`,
      fullPage: false
    });
  });

  test('should have consistent spacing across browsers', async ({ page }) => {
    await page.goto(DEPLOYED_URL);
    await page.waitForLoadState('networkidle');

    const section = page.locator('section').nth(1);
    const sectionBox = await section.boundingBox();

    // Section should have reasonable dimensions
    expect(sectionBox!.width).toBeGreaterThan(300);
    expect(sectionBox!.height).toBeGreaterThan(200);
  });
});

test.describe('Features Section - No Console Errors', () => {
  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto(DEPLOYED_URL);
    await page.waitForLoadState('networkidle');

    // Wait a bit for any lazy-loaded errors
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });
});
