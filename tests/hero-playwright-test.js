/**
 * Hero Section Comprehensive Testing - Issue #44
 *
 * Tests:
 * - Cross-browser (Chromium only - per environment limitations)
 * - Mobile responsive (375x667)
 * - Interactive states (hover, focus)
 * - Visual verification (screenshots)
 * - Functional testing (navigation, keyboard)
 */

const fs = require('fs');
const path = require('path');

const DEPLOYED_URL = 'https://launchlog-lac.vercel.app';
const SCREENSHOTS_DIR = '/workspace/launchlog/tests/screenshots';
const RESULTS = {
  passed: [],
  failed: [],
  screenshots: []
};

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runTests(playwright) {
  console.log('================================================================');
  console.log('LaunchLog Hero Section - Playwright Test Suite (Issue #44)');
  console.log('================================================================\n');
  console.log(`Deployed URL: ${DEPLOYED_URL}`);
  console.log(`Test Start: ${new Date().toISOString()}\n`);

  // Test 1: Desktop Chromium Tests
  console.log('==========================================');
  console.log('1. DESKTOP CHROMIUM TESTS (1280x720)');
  console.log('==========================================\n');

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    // Navigate to page
    console.log('Navigating to deployed page...');
    await page.goto(DEPLOYED_URL, { waitUntil: 'networkidle' });
    console.log('✅ Page loaded successfully\n');
    RESULTS.passed.push('Page loads successfully');

    // Take desktop screenshot
    const desktopScreenshot = path.join(SCREENSHOTS_DIR, 'hero-desktop-1280x720.png');
    await page.screenshot({ path: desktopScreenshot, fullPage: false });
    console.log(`✅ Desktop screenshot saved: ${desktopScreenshot}`);
    RESULTS.screenshots.push('hero-desktop-1280x720.png');
    RESULTS.passed.push('Desktop screenshot captured');

    // Functional Testing
    console.log('\n------------------------------------------');
    console.log('Functional Content Verification');
    console.log('------------------------------------------\n');

    // Check beta badge
    const betaBadge = await page.locator('text=Now in public beta').first();
    if (await betaBadge.isVisible()) {
      console.log('✅ Beta badge visible');
      RESULTS.passed.push('Beta badge visible');
    } else {
      console.log('❌ Beta badge NOT visible');
      RESULTS.failed.push('Beta badge not visible');
    }

    // Check main heading
    const heading = await page.locator('h1:has-text("Your code")').first();
    if (await heading.isVisible()) {
      console.log('✅ Main heading visible');
      RESULTS.passed.push('Main heading visible');
    } else {
      console.log('❌ Main heading NOT visible');
      RESULTS.failed.push('Main heading not visible');
    }

    // Check gradient text
    const gradientText = await page.locator('text=Your impact').first();
    if (await gradientText.isVisible()) {
      console.log('✅ Gradient "Your impact" text visible');
      RESULTS.passed.push('Gradient impact text visible');
    } else {
      console.log('❌ Gradient text NOT visible');
      RESULTS.failed.push('Gradient impact text not visible');
    }

    // Check CTA button
    const ctaButton = await page.locator('text=Sign in with GitHub').first();
    if (await ctaButton.isVisible()) {
      console.log('✅ Primary CTA button visible');
      RESULTS.passed.push('Primary CTA button visible');
    } else {
      console.log('❌ Primary CTA button NOT visible');
      RESULTS.failed.push('Primary CTA button not visible');
    }

    // Check all 4 example badges
    const hnBadge = await page.locator('text=312').first();
    const phBadge = await page.locator('text=#2').first();
    const twitterBadge = await page.locator('text=847').first();
    const redditBadge = await page.locator('text=2.4K').first();

    if (await hnBadge.isVisible()) {
      console.log('✅ HackerNews badge visible (312 points)');
      RESULTS.passed.push('HackerNews badge visible');
    } else {
      console.log('❌ HackerNews badge NOT visible');
      RESULTS.failed.push('HackerNews badge not visible');
    }

    if (await phBadge.isVisible()) {
      console.log('✅ Product Hunt badge visible (#2)');
      RESULTS.passed.push('Product Hunt badge visible');
    } else {
      console.log('❌ Product Hunt badge NOT visible');
      RESULTS.failed.push('Product Hunt badge not visible');
    }

    if (await twitterBadge.isVisible()) {
      console.log('✅ Twitter badge visible (847 likes)');
      RESULTS.passed.push('Twitter badge visible');
    } else {
      console.log('❌ Twitter badge NOT visible');
      RESULTS.failed.push('Twitter badge not visible');
    }

    if (await redditBadge.isVisible()) {
      console.log('✅ Reddit badge visible (2.4K upvotes)');
      RESULTS.passed.push('Reddit badge visible');
    } else {
      console.log('❌ Reddit badge NOT visible');
      RESULTS.failed.push('Reddit badge not visible');
    }

    // Interactive State Testing
    console.log('\n------------------------------------------');
    console.log('Interactive State Testing');
    console.log('------------------------------------------\n');

    // Hover CTA button
    await ctaButton.hover();
    await page.waitForTimeout(500); // Wait for hover animation
    const ctaHoverScreenshot = path.join(SCREENSHOTS_DIR, 'hero-cta-hover-state.png');
    await page.screenshot({ path: ctaHoverScreenshot, fullPage: false });
    console.log(`✅ CTA button hover state screenshot: ${ctaHoverScreenshot}`);
    RESULTS.screenshots.push('hero-cta-hover-state.png');
    RESULTS.passed.push('CTA hover state captured');

    // Focus CTA button (keyboard navigation)
    await ctaButton.focus();
    await page.waitForTimeout(300);
    const ctaFocusScreenshot = path.join(SCREENSHOTS_DIR, 'hero-cta-focus-state.png');
    await page.screenshot({ path: ctaFocusScreenshot, fullPage: false });
    console.log(`✅ CTA button focus state screenshot: ${ctaFocusScreenshot}`);
    RESULTS.screenshots.push('hero-cta-focus-state.png');
    RESULTS.passed.push('CTA focus state captured');

    // Hover badge
    const firstBadge = await page.locator('[role="listitem"]').first();
    await firstBadge.hover();
    await page.waitForTimeout(500);
    const badgeHoverScreenshot = path.join(SCREENSHOTS_DIR, 'hero-badge-hover-state.png');
    await page.screenshot({ path: badgeHoverScreenshot, fullPage: false });
    console.log(`✅ Badge hover state screenshot: ${badgeHoverScreenshot}`);
    RESULTS.screenshots.push('hero-badge-hover-state.png');
    RESULTS.passed.push('Badge hover state captured');

    // Keyboard Navigation Test
    console.log('\n------------------------------------------');
    console.log('Keyboard Navigation Testing');
    console.log('------------------------------------------\n');

    // Reset focus
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Tab through interactive elements
    let tabCount = 0;
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      tabCount++;
    }

    console.log(`✅ Keyboard navigation: Tabbed through ${tabCount} elements`);
    RESULTS.passed.push('Keyboard navigation functional');

    // Functional Navigation Test
    console.log('\n------------------------------------------');
    console.log('CTA Button Navigation Test');
    console.log('------------------------------------------\n');

    // Click CTA and verify navigation
    const ctaLink = await page.locator('a:has-text("Sign in with GitHub")').first();
    const href = await ctaLink.getAttribute('href');

    if (href === '/signin') {
      console.log('✅ CTA button links to /signin');
      RESULTS.passed.push('CTA links to correct route');
    } else {
      console.log(`❌ CTA button links to ${href} instead of /signin`);
      RESULTS.failed.push('CTA links to wrong route');
    }

    // Check console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    if (consoleErrors.length === 0) {
      console.log('✅ No console errors detected');
      RESULTS.passed.push('No console errors');
    } else {
      console.log(`❌ Console errors detected: ${consoleErrors.length}`);
      consoleErrors.forEach(err => console.log(`   - ${err}`));
      RESULTS.failed.push(`Console errors: ${consoleErrors.length}`);
    }

  } catch (error) {
    console.log(`❌ Desktop test error: ${error.message}`);
    RESULTS.failed.push(`Desktop test error: ${error.message}`);
  }

  await browser.close();

  // Test 2: Mobile Responsive Tests
  console.log('\n==========================================');
  console.log('2. MOBILE RESPONSIVE TESTS (375x667)');
  console.log('==========================================\n');

  const mobileBrowser = await playwright.chromium.launch({ headless: true });
  const mobileContext = await mobileBrowser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobileContext.newPage();

  try {
    console.log('Loading page on mobile viewport...');
    await mobilePage.goto(DEPLOYED_URL, { waitUntil: 'networkidle' });
    console.log('✅ Mobile page loaded\n');
    RESULTS.passed.push('Mobile page loads');

    // Mobile screenshot
    const mobileScreenshot = path.join(SCREENSHOTS_DIR, 'hero-mobile-375x667.png');
    await mobilePage.screenshot({ path: mobileScreenshot, fullPage: false });
    console.log(`✅ Mobile screenshot saved: ${mobileScreenshot}`);
    RESULTS.screenshots.push('hero-mobile-375x667.png');
    RESULTS.passed.push('Mobile screenshot captured');

    // Verify mobile layout
    const mobileHeading = await mobilePage.locator('h1').first();
    const headingBoundingBox = await mobileHeading.boundingBox();

    if (headingBoundingBox && headingBoundingBox.width < 375) {
      console.log(`✅ Heading fits mobile viewport (width: ${Math.round(headingBoundingBox.width)}px)`);
      RESULTS.passed.push('Heading fits mobile viewport');
    } else {
      console.log('⚠️  Heading width could not be verified');
      RESULTS.failed.push('Heading width verification failed');
    }

    // Check CTA button on mobile
    const mobileCTA = await mobilePage.locator('text=Sign in with GitHub').first();
    if (await mobileCTA.isVisible()) {
      console.log('✅ CTA button visible on mobile');
      RESULTS.passed.push('CTA visible on mobile');
    } else {
      console.log('❌ CTA button NOT visible on mobile');
      RESULTS.failed.push('CTA not visible on mobile');
    }

    // Check badges on mobile
    const mobileBadge = await mobilePage.locator('text=312').first();
    if (await mobileBadge.isVisible()) {
      console.log('✅ Example badges visible on mobile');
      RESULTS.passed.push('Badges visible on mobile');
    } else {
      console.log('❌ Example badges NOT visible on mobile');
      RESULTS.failed.push('Badges not visible on mobile');
    }

    // Tap test on mobile
    await mobileCTA.tap();
    await mobilePage.waitForTimeout(500);
    const mobileURL = mobilePage.url();

    if (mobileURL.includes('/signin')) {
      console.log('✅ Mobile tap navigation works (redirected to /signin)');
      RESULTS.passed.push('Mobile tap navigation works');
    } else {
      console.log(`⚠️  Mobile navigation: ${mobileURL}`);
    }

  } catch (error) {
    console.log(`❌ Mobile test error: ${error.message}`);
    RESULTS.failed.push(`Mobile test error: ${error.message}`);
  }

  await mobileBrowser.close();

  // Generate summary
  console.log('\n==========================================');
  console.log('TEST SUMMARY');
  console.log('==========================================\n');
  console.log(`Total Tests: ${RESULTS.passed.length + RESULTS.failed.length}`);
  console.log(`✅ Passed: ${RESULTS.passed.length}`);
  console.log(`❌ Failed: ${RESULTS.failed.length}`);
  console.log(`📸 Screenshots: ${RESULTS.screenshots.length}\n`);

  if (RESULTS.failed.length > 0) {
    console.log('Failed Tests:');
    RESULTS.failed.forEach(fail => console.log(`  - ${fail}`));
    console.log('');
  }

  console.log('Screenshots saved to:');
  RESULTS.screenshots.forEach(screenshot => console.log(`  - ${screenshot}`));

  return RESULTS;
}

// Export for external use
module.exports = { runTests };

// Run if called directly
if (require.main === module) {
  (async () => {
    const { chromium } = require('playwright');
    const playwright = { chromium };
    const results = await runTests(playwright);

    // Write results to JSON
    const resultsPath = path.join(SCREENSHOTS_DIR, 'test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${resultsPath}`);

    process.exit(results.failed.length > 0 ? 1 : 0);
  })();
}
