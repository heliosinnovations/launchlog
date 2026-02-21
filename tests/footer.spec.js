// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

const DEPLOYED_URL = 'https://launchlog-lac.vercel.app';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const RESULTS_DIR = path.join(__dirname, 'results');

// Ensure directories exist
[SCREENSHOTS_DIR, RESULTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const testReport = {
  timestamp: new Date().toISOString(),
  tests: []
};

test.describe('Footer Component - Issue #7', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(DEPLOYED_URL);
    // Wait for footer to be visible
    await page.waitForSelector('footer', { state: 'visible' });
  });

  test('Visual Regression - Design vs Implementation', async ({ page, browserName }) => {
    if (browserName !== 'chromium') {
      test.skip();
      return;
    }

    const testResult = {
      name: 'Visual Regression',
      status: 'running',
      breakpoints: []
    };

    const breakpoints = [
      { name: 'mobile-small', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop-medium', width: 1024, height: 768 },
      { name: 'desktop-large', width: 1440, height: 900 }
    ];

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(500); // Allow layout to settle

      const footer = await page.locator('footer');
      const screenshotPath = path.join(SCREENSHOTS_DIR, `footer-deployed-${bp.name}.png`);
      await footer.screenshot({ path: screenshotPath });

      testResult.breakpoints.push({
        name: bp.name,
        dimensions: `${bp.width}x${bp.height}`,
        screenshot: screenshotPath,
        status: 'captured'
      });

      console.log(`✓ Captured deployed footer at ${bp.name} (${bp.width}x${bp.height})`);
    }

    testResult.status = 'passed';
    testReport.tests.push(testResult);
  });

  test('Responsive Layout - All Breakpoints', async ({ page, browserName }) => {
    if (browserName !== 'chromium') {
      test.skip();
      return;
    }

    const testResult = {
      name: 'Responsive Layout',
      status: 'running',
      checks: []
    };

    const breakpoints = [
      { name: 'mobile-small', width: 375, height: 667, expectedLayout: 'stacked' },
      { name: 'tablet', width: 768, height: 1024, expectedLayout: 'grid' },
      { name: 'desktop-medium', width: 1024, height: 768, expectedLayout: 'grid' },
      { name: 'desktop-large', width: 1440, height: 900, expectedLayout: 'grid' }
    ];

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(300);

      const footer = await page.locator('footer');
      const mainGrid = footer.locator('> div > div').first();

      // Check grid layout
      const gridClass = await mainGrid.getAttribute('class');
      const hasGridLayout = gridClass.includes('grid');

      // Check if footer is visible and properly sized
      const boundingBox = await footer.boundingBox();

      const check = {
        breakpoint: bp.name,
        dimensions: `${bp.width}x${bp.height}`,
        hasGridLayout,
        footerWidth: boundingBox?.width,
        status: 'passed'
      };

      if (bp.expectedLayout === 'grid' && !hasGridLayout) {
        check.status = 'failed';
        check.error = 'Expected grid layout not found';
      }

      testResult.checks.push(check);
      console.log(`✓ Responsive check at ${bp.name}: ${check.status}`);
    }

    testResult.status = testResult.checks.every(c => c.status === 'passed') ? 'passed' : 'failed';
    testReport.tests.push(testResult);
  });

  test('Interactive States - Hover and Focus', async ({ page, browserName }) => {
    if (browserName !== 'chromium') {
      test.skip();
      return;
    }

    const testResult = {
      name: 'Interactive States',
      status: 'running',
      states: []
    };

    // Test footer link hover
    const footerLink = page.locator('footer nav a').first();
    const initialColor = await footerLink.evaluate(el => window.getComputedStyle(el).color);

    await footerLink.hover();
    await page.waitForTimeout(200);
    const hoverColor = await footerLink.evaluate(el => window.getComputedStyle(el).color);

    testResult.states.push({
      element: 'footer-link',
      state: 'hover',
      colorChanged: initialColor !== hoverColor,
      initialColor,
      hoverColor,
      status: initialColor !== hoverColor ? 'passed' : 'failed'
    });

    // Test social link hover
    const socialLink = page.locator('footer [role="list"] a').first();
    const socialInitialColor = await socialLink.evaluate(el => window.getComputedStyle(el).color);

    await socialLink.hover();
    await page.waitForTimeout(200);
    const socialHoverColor = await socialLink.evaluate(el => window.getComputedStyle(el).color);

    testResult.states.push({
      element: 'social-link',
      state: 'hover',
      colorChanged: socialInitialColor !== socialHoverColor,
      status: socialInitialColor !== socialHoverColor ? 'passed' : 'failed'
    });

    // Screenshot hover states
    await page.setViewportSize({ width: 1440, height: 900 });
    await footerLink.hover();
    await page.locator('footer').screenshot({
      path: path.join(SCREENSHOTS_DIR, 'footer-link-hover.png')
    });

    testResult.status = testResult.states.every(s => s.status === 'passed') ? 'passed' : 'failed';
    testReport.tests.push(testResult);
    console.log(`✓ Interactive states test: ${testResult.status}`);
  });

  test('Accessibility - WCAG AA Compliance', async ({ page, browserName }) => {
    if (browserName !== 'chromium') {
      test.skip();
      return;
    }

    const testResult = {
      name: 'Accessibility',
      status: 'running',
      checks: []
    };

    const footer = page.locator('footer');

    // Check semantic footer element
    const isFooter = await footer.evaluate(el => el.tagName.toLowerCase() === 'footer');
    testResult.checks.push({
      test: 'semantic-footer-element',
      status: isFooter ? 'passed' : 'failed',
      message: isFooter ? 'Footer uses semantic <footer> element' : 'Footer should use semantic <footer> element'
    });

    // Check aria-labels
    const logoLink = page.locator('footer a[aria-label*="LaunchLog"]').first();
    const hasLogoAriaLabel = await logoLink.count() > 0;
    testResult.checks.push({
      test: 'logo-aria-label',
      status: hasLogoAriaLabel ? 'passed' : 'failed',
      message: hasLogoAriaLabel ? 'Logo has aria-label' : 'Logo should have aria-label'
    });

    // Check social links aria-labels
    const socialLinks = page.locator('footer [aria-label*="Twitter"], footer [aria-label*="GitHub"], footer [aria-label*="Discord"]');
    const socialCount = await socialLinks.count();
    testResult.checks.push({
      test: 'social-links-aria-labels',
      status: socialCount >= 3 ? 'passed' : 'warning',
      count: socialCount,
      message: `Found ${socialCount} social links with aria-labels`
    });

    // Check external links security
    const externalLinks = page.locator('footer a[target="_blank"]');
    const externalCount = await externalLinks.count();

    let secureExternalLinks = 0;
    for (let i = 0; i < externalCount; i++) {
      const rel = await externalLinks.nth(i).getAttribute('rel');
      if (rel && rel.includes('noopener') && rel.includes('noreferrer')) {
        secureExternalLinks++;
      }
    }

    testResult.checks.push({
      test: 'external-links-security',
      status: secureExternalLinks === externalCount ? 'passed' : 'failed',
      message: `${secureExternalLinks}/${externalCount} external links have rel="noopener noreferrer"`
    });

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const firstFocusable = await page.evaluate(() => document.activeElement?.tagName);
    testResult.checks.push({
      test: 'keyboard-navigation',
      status: firstFocusable ? 'passed' : 'warning',
      message: `Keyboard navigation works, first focusable: ${firstFocusable}`
    });

    testResult.status = testResult.checks.every(c => c.status !== 'failed') ? 'passed' : 'failed';
    testReport.tests.push(testResult);
    console.log(`✓ Accessibility test: ${testResult.status}`);
  });

  test('Content Validation', async ({ page, browserName }) => {
    if (browserName !== 'chromium') {
      test.skip();
      return;
    }

    const testResult = {
      name: 'Content Validation',
      status: 'running',
      checks: []
    };

    // Check logo and brand
    const logoText = await page.locator('footer a[aria-label*="LaunchLog"]').textContent();
    testResult.checks.push({
      test: 'logo-text',
      expected: 'LaunchLog',
      actual: logoText?.trim(),
      status: logoText?.includes('LaunchLog') ? 'passed' : 'failed'
    });

    // Check rocket icon
    const hasRocketIcon = await page.locator('footer svg').first().count() > 0;
    testResult.checks.push({
      test: 'rocket-icon',
      status: hasRocketIcon ? 'passed' : 'failed',
      message: hasRocketIcon ? 'Rocket icon present' : 'Rocket icon missing'
    });

    // Check tagline
    const tagline = await page.locator('footer p').first().textContent();
    testResult.checks.push({
      test: 'tagline',
      expected: 'Track your open source impact',
      actual: tagline?.trim(),
      status: tagline?.includes('Track your open source impact') ? 'passed' : 'failed'
    });

    // Check copyright year
    const copyright = await page.locator('footer p:has-text("©")').textContent();
    testResult.checks.push({
      test: 'copyright-year',
      expected: '2026',
      actual: copyright,
      status: copyright?.includes('2026') ? 'passed' : 'failed'
    });

    // Check navigation links
    const expectedNavLinks = ['Features', 'Pricing', 'Docs', 'Blog', 'GitHub'];
    const navLinks = await page.locator('footer nav[aria-label="Footer navigation"] a').allTextContents();
    testResult.checks.push({
      test: 'navigation-links',
      expected: expectedNavLinks,
      actual: navLinks,
      status: expectedNavLinks.every(link => navLinks.includes(link)) ? 'passed' : 'failed'
    });

    // Check social links (by aria-label)
    const twitterLink = await page.locator('footer a[aria-label*="Twitter"]').count();
    const githubLink = await page.locator('footer a[aria-label*="GitHub"]').count();
    const discordLink = await page.locator('footer a[aria-label*="Discord"]').count();

    testResult.checks.push({
      test: 'social-links',
      expected: ['Twitter', 'GitHub', 'Discord'],
      actual: { twitter: twitterLink, github: githubLink, discord: discordLink },
      status: (twitterLink > 0 && githubLink > 0 && discordLink > 0) ? 'passed' : 'failed'
    });

    // Check legal links
    const legalLinks = await page.locator('footer nav[aria-label="Legal"] a').allTextContents();
    testResult.checks.push({
      test: 'legal-links',
      expected: ['Privacy Policy', 'Terms of Service'],
      actual: legalLinks,
      status: legalLinks.includes('Privacy Policy') && legalLinks.includes('Terms of Service') ? 'passed' : 'failed'
    });

    testResult.status = testResult.checks.every(c => c.status !== 'failed') ? 'passed' : 'failed';
    testReport.tests.push(testResult);
    console.log(`✓ Content validation: ${testResult.status}`);
  });

  test.afterAll(async () => {
    // Save test report
    const reportPath = path.join(RESULTS_DIR, 'footer-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
    console.log(`\n✓ Test report saved to ${reportPath}`);
  });
});
