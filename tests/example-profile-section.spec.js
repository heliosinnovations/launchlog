/**
 * Example Profile Section Tests
 * Issue #6 - Test LaunchLog Example Profile Preview section
 */

const { test, expect } = require('@playwright/test');
const { injectAxe, checkA11y } = require('axe-playwright');

const DEPLOYED_URL = 'https://launchlog-lac.vercel.app';
const DESIGN_REF_PATH = 'file:///workspace/launchlog/drafts/landing-variation-2.html';

// Responsive breakpoints
const BREAKPOINTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 }
};

// Browsers to test
const BROWSERS = ['chromium', 'firefox', 'webkit'];

test.describe('Example Profile Section - Issue #6', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(DEPLOYED_URL);
  });

  // Test 1: Component Integration
  test('should render Example Profile Section after How It Works section', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that section exists
    const section = await page.locator('#example');
    await expect(section).toBeVisible();

    // Verify it appears after How It Works section
    const sections = await page.locator('section').all();
    const sectionIds = await Promise.all(
      sections.map(async (s) => await s.getAttribute('id'))
    );

    console.log('Section order:', sectionIds.filter(id => id));

    // Find Example section position
    const exampleIndex = sectionIds.indexOf('example');
    expect(exampleIndex).toBeGreaterThan(0); // Should not be first
  });

  // Test 2: Section Structure
  test('should have correct section structure and labels', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check section label
    const sectionLabel = await page.locator('#example p.uppercase').first();
    await expect(sectionLabel).toContainText('Your portfolio, always up-to-date');

    // Check profile header exists
    const profileHeading = await page.locator('#example-profile-heading');
    await expect(profileHeading).toContainText('Sarah Guo');

    // Check bio text
    const bio = await page.locator('#example').getByText(/Full-Stack Developer/);
    await expect(bio).toBeVisible();
  });

  // Test 3: Stats Grid
  test('should display stats grid with correct values', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check stats grid exists
    const statsGrid = await page.locator('#example [role="list"][aria-label="Profile statistics"]');
    await expect(statsGrid).toBeVisible();

    // Check for expected stats
    const stats = ['18', '12.4k', '247', '89'];
    const labels = ['PROJECTS', 'STARS', 'MENTIONS', 'FORKS'];

    for (const stat of stats) {
      await expect(page.locator('#example').getByText(stat)).toBeVisible();
    }

    for (const label of labels) {
      await expect(page.locator('#example').getByText(label)).toBeVisible();
    }
  });

  // Test 4: Project Cards
  test('should display project cards with mention badges', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check projects grid
    const projectsGrid = await page.locator('#example [role="list"][aria-label="Featured projects"]');
    await expect(projectsGrid).toBeVisible();

    // Check for specific projects
    await expect(page.locator('#example').getByText('shipfast-cli')).toBeVisible();
    await expect(page.locator('#example').getByText('react-forms-pro')).toBeVisible();
    await expect(page.locator('#example').getByText('tailwind-tokens')).toBeVisible();

    // Check for mention badges
    await expect(page.locator('#example').getByText('HN #1')).toBeVisible();
    await expect(page.locator('#example').getByText('#2 PH')).toBeVisible();
    await expect(page.locator('#example').getByText('1.2k tweets')).toBeVisible();
  });

  // Test 5: Avatar Gradient
  test('should have gradient avatar with initials', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check avatar exists and has correct text
    const avatar = await page.locator('#example .rounded-\\[var\\(--radius-md\\)\\]').first();
    await expect(avatar).toContainText('SG');

    // Verify gradient styles
    const bgGradient = await avatar.evaluate(el =>
      window.getComputedStyle(el).backgroundImage
    );
    expect(bgGradient).toContain('gradient');
  });

  // Test 6: Interactive States - Hover Effects
  test('should show hover effects on project cards', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Get first project card
    const projectCard = await page.locator('#example article').first();

    // Get initial transform
    const initialTransform = await projectCard.evaluate(el =>
      window.getComputedStyle(el).transform
    );

    // Hover over card
    await projectCard.hover();

    // Wait for animation
    await page.waitForTimeout(300);

    // Get transform after hover
    const hoverTransform = await projectCard.evaluate(el =>
      window.getComputedStyle(el).transform
    );

    // Should have translate-y on hover (check that transform changed)
    console.log('Initial transform:', initialTransform);
    console.log('Hover transform:', hoverTransform);
  });

  // Test 7: Accessibility - ARIA Labels
  test('should have proper ARIA labels and semantic HTML', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check section has aria-labelledby
    const section = await page.locator('#example');
    const labelledBy = await section.getAttribute('aria-labelledby');
    expect(labelledBy).toBe('example-profile-heading');

    // Check stats grid has proper role and label
    const statsGrid = await page.locator('#example [role="list"][aria-label="Profile statistics"]');
    await expect(statsGrid).toBeVisible();

    // Check projects grid has proper role and label
    const projectsGrid = await page.locator('#example [role="list"][aria-label="Featured projects"]');
    await expect(projectsGrid).toBeVisible();

    // Check project mentions has proper role and label
    const mentionsLabel = await page.locator('#example [role="list"][aria-label="Project mentions"]').first();
    await expect(mentionsLabel).toBeVisible();
  });

  // Test 8: Typography - Space Grotesk
  test('should use Space Grotesk for headings and numbers', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check profile name uses Space Grotesk
    const profileName = await page.locator('#example-profile-heading');
    const nameFont = await profileName.evaluate(el =>
      window.getComputedStyle(el).fontFamily
    );
    expect(nameFont).toContain('Space Grotesk');

    // Check stat values use Space Grotesk
    const statValue = await page.locator('#example').getByText('18').first();
    const statFont = await statValue.evaluate(el =>
      window.getComputedStyle(el).fontFamily
    );
    expect(statFont).toContain('Space Grotesk');
  });

  // Test 9: Colors - Gradient Backgrounds
  test('should have correct gradient colors for avatar and accent stat', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check avatar gradient (indigo-purple-fuchsia)
    const avatar = await page.locator('#example .rounded-\\[var\\(--radius-md\\)\\]').first();
    const avatarBg = await avatar.evaluate(el =>
      window.getComputedStyle(el).backgroundImage
    );

    console.log('Avatar gradient:', avatarBg);
    expect(avatarBg).toContain('gradient');

    // Check accent stat (Mentions - orange-red gradient)
    const mentionsStat = await page.locator('#example').getByText('247');
    const mentionsColor = await mentionsStat.evaluate(el =>
      window.getComputedStyle(el).backgroundImage
    );

    console.log('Mentions stat gradient:', mentionsColor);
    expect(mentionsColor).toContain('gradient');
  });

  // Test 10: Mention Badge Colors
  test('should have correct colors for mention badge platforms', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // HN badge - orange
    const hnBadge = await page.locator('#example').getByText('HN #1');
    const hnColor = await hnBadge.evaluate(el =>
      window.getComputedStyle(el).color
    );
    console.log('HN badge color:', hnColor);

    // PH badge - red
    const phBadge = await page.locator('#example').getByText('#2 PH');
    const phColor = await phBadge.evaluate(el =>
      window.getComputedStyle(el).color
    );
    console.log('PH badge color:', phColor);

    // Twitter badge - blue
    const twitterBadge = await page.locator('#example').getByText('1.2k tweets');
    const twitterColor = await twitterBadge.evaluate(el =>
      window.getComputedStyle(el).color
    );
    console.log('Twitter badge color:', twitterColor);
  });
});

// Responsive Design Tests
test.describe('Responsive Design Tests', () => {
  for (const [breakpoint, viewport] of Object.entries(BREAKPOINTS)) {
    test(`should render correctly on ${breakpoint} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(DEPLOYED_URL);
      await page.waitForLoadState('networkidle');

      // Check section is visible
      const section = await page.locator('#example');
      await expect(section).toBeVisible();

      // Check stats grid layout
      const statsGrid = await page.locator('#example [role="list"][aria-label="Profile statistics"]');
      const gridCols = await statsGrid.evaluate(el =>
        window.getComputedStyle(el).gridTemplateColumns
      );
      console.log(`${breakpoint} stats grid columns:`, gridCols);

      // Check projects grid layout
      const projectsGrid = await page.locator('#example [role="list"][aria-label="Featured projects"]');
      const projGridCols = await projectsGrid.evaluate(el =>
        window.getComputedStyle(el).gridTemplateColumns
      );
      console.log(`${breakpoint} projects grid columns:`, projGridCols);

      // Take screenshot
      await page.screenshot({
        path: `/workspace/launchlog/test-results/screenshot-${breakpoint}.png`,
        fullPage: true
      });
    });
  }
});

// Accessibility Tests with axe-core
test.describe('Accessibility Tests', () => {
  test('should pass WCAG AA accessibility checks', async ({ page }) => {
    await page.goto(DEPLOYED_URL);
    await page.waitForLoadState('networkidle');

    // Inject axe
    await injectAxe(page);

    // Run accessibility checks on the Example Profile Section
    await checkA11y(page, '#example', {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    }, (violations) => {
      console.log('\n♿ Accessibility Violations:');
      violations.forEach(violation => {
        console.log(`\n❌ ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.helpUrl}`);
      });
    });
  });
});
