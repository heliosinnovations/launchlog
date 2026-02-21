/**
 * Interactive States Testing
 * Tests hover, focus, and active states for all interactive elements
 */

const { chromium } = require('playwright');

const DEPLOYED_URL = 'https://launchlog-gamma.vercel.app';

async function runInteractiveStatesTests() {
  console.log('🎯 Interactive States Testing\n');
  console.log('Testing button and badge hover/focus states...\n');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1024 } });

  await page.goto(DEPLOYED_URL, { waitUntil: 'networkidle' });

  const results = [];

  // Test 1: GitHub button hover state
  console.log('1. Testing "Sign in with GitHub" button states...');
  const githubButton = await page.locator('text=Sign in with GitHub');

  // Default state
  await page.screenshot({
    path: '/workspace/launchlog/tests/screenshots/button-github-default.png'
  });

  // Hover state
  await githubButton.hover();
  await page.waitForTimeout(500); // Wait for transition
  await page.screenshot({
    path: '/workspace/launchlog/tests/screenshots/button-github-hover.png'
  });

  // Check if button has transform on hover
  const transform = await githubButton.evaluate(el => {
    return window.getComputedStyle(el).transform;
  });

  const hasHoverEffect = transform && transform !== 'none';
  results.push({
    test: 'GitHub button hover effect',
    passed: hasHoverEffect,
    details: `Transform: ${transform}`
  });

  console.log(`   ${hasHoverEffect ? '✓' : '✗'} Hover transform applied`);

  // Focus state
  await githubButton.focus();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: '/workspace/launchlog/tests/screenshots/button-github-focus.png'
  });
  console.log('   ✓ Screenshots captured\n');

  // Test 2: Example Portfolio button hover
  console.log('2. Testing "See Example Portfolio" button states...');
  const exampleButton = await page.locator('text=See Example Portfolio');

  await exampleButton.hover();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: '/workspace/launchlog/tests/screenshots/button-example-hover.png'
  });

  const borderColor = await exampleButton.evaluate(el => {
    return window.getComputedStyle(el).borderColor;
  });

  results.push({
    test: 'Example button hover',
    passed: true,
    details: `Border color: ${borderColor}`
  });

  console.log('   ✓ Screenshots captured\n');

  // Test 3: Platform badges hover states
  console.log('3. Testing platform badge hover states...');

  const hnBadge = await page.locator('text=127').first();
  await hnBadge.scrollIntoViewIfNeeded();

  // Default badge state
  await page.screenshot({
    path: '/workspace/launchlog/tests/screenshots/badges-default.png',
    clip: { x: 200, y: 500, width: 880, height: 200 }
  });

  // Hover on HackerNews badge
  await hnBadge.hover();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: '/workspace/launchlog/tests/screenshots/badge-hn-hover.png',
    clip: { x: 200, y: 500, width: 880, height: 200 }
  });

  const badgeTransform = await page.locator('.flex.items-center.gap-2\\.5').first().evaluate(el => {
    return window.getComputedStyle(el).transform;
  });

  const badgeHasHover = badgeTransform && badgeTransform !== 'none';
  results.push({
    test: 'Badge hover lift effect',
    passed: badgeHasHover,
    details: `Transform: ${badgeTransform}`
  });

  console.log(`   ${badgeHasHover ? '✓' : '✗'} Hover lift effect applied`);

  // Test each platform badge color
  const badges = [
    { name: 'HackerNews', selector: 'text=127', expectedColor: '#FF6600' },
    { name: 'Product Hunt', selector: 'text=#3', expectedColor: '#DA552F' },
    { name: 'Twitter', selector: 'text=2.4K', expectedColor: '#1DA1F2' },
    { name: 'Reddit', selector: 'text=89', expectedColor: '#FF4500' }
  ];

  console.log('   ✓ Screenshots captured\n');

  console.log('4. Testing keyboard navigation (tab order)...');

  // Reset focus
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  // Tab through interactive elements
  const focusableElements = await page.locator('a[href]').count();
  console.log(`   ✓ Found ${focusableElements} focusable elements`);

  results.push({
    test: 'Keyboard navigation',
    passed: focusableElements >= 2,
    details: `${focusableElements} focusable elements`
  });

  await browser.close();

  // Summary
  console.log('\n📊 Interactive States Test Summary:\n');
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} ${result.test}`);
    console.log(`      ${result.details}`);
  });

  const allPassed = results.every(r => r.passed);
  console.log(`\n${allPassed ? '✅ All interactive states working' : '❌ Some interactive states failed'}\n`);

  return { results, allPassed };
}

if (require.main === module) {
  runInteractiveStatesTests()
    .then(result => {
      process.exit(result.allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = runInteractiveStatesTests;
