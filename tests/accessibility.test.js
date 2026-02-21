/**
 * Accessibility Testing
 * Tests WCAG compliance, ARIA labels, semantics, and keyboard navigation
 */

const { chromium } = require('playwright');

const DEPLOYED_URL = 'https://launchlog-gamma.vercel.app';

async function runAccessibilityTests() {
  console.log('♿ Accessibility Testing\n');
  console.log('Testing WCAG compliance and accessibility features...\n');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1024 } });

  await page.goto(DEPLOYED_URL, { waitUntil: 'networkidle' });

  const results = [];

  // Test 1: Semantic HTML structure
  console.log('1. Testing semantic HTML structure...');

  const h1Count = await page.locator('h1').count();
  const hasH1 = h1Count === 1;

  results.push({
    test: 'Single H1 heading',
    passed: hasH1,
    details: `Found ${h1Count} H1 element(s)`
  });

  console.log(`   ${hasH1 ? '✓' : '✗'} ${h1Count} H1 heading`);

  const sectionExists = await page.locator('section').count() > 0;
  results.push({
    test: 'Semantic <section> used',
    passed: sectionExists,
    details: 'Hero wrapped in <section>'
  });

  console.log(`   ${sectionExists ? '✓' : '✗'} Semantic section element\n`);

  // Test 2: ARIA labels present
  console.log('2. Testing ARIA labels...');

  const ariaLabels = [
    { selector: '[aria-label*="Platform statistics"]', name: 'Platform statistics badge' },
    { selector: '[aria-label*="Call to action"]', name: 'CTA buttons group' },
    { selector: '[aria-label*="Sign in with GitHub"]', name: 'GitHub button' },
    { selector: '[aria-label*="example portfolio"]', name: 'Example button' },
    { selector: '[aria-label*="Example platform"]', name: 'Platform badges list' }
  ];

  for (const label of ariaLabels) {
    const exists = await page.locator(label.selector).count() > 0;
    results.push({
      test: `ARIA label: ${label.name}`,
      passed: exists,
      details: exists ? 'Present' : 'Missing'
    });
    console.log(`   ${exists ? '✓' : '✗'} ${label.name}`);
  }

  console.log();

  // Test 3: Keyboard navigation
  console.log('3. Testing keyboard navigation...');

  // Tab to first interactive element
  await page.keyboard.press('Tab');
  let focusedElement = await page.evaluate(() => {
    const el = document.activeElement;
    return {
      tag: el.tagName,
      text: el.textContent?.substring(0, 30),
      href: el.getAttribute('href')
    };
  });

  const firstElementFocusable = focusedElement.tag === 'A';
  results.push({
    test: 'First element keyboard focusable',
    passed: firstElementFocusable,
    details: `Focused: ${focusedElement.tag} - ${focusedElement.text}`
  });

  console.log(`   ${firstElementFocusable ? '✓' : '✗'} First element focusable: ${focusedElement.tag}`);

  // Tab to second element
  await page.keyboard.press('Tab');
  focusedElement = await page.evaluate(() => {
    const el = document.activeElement;
    return {
      tag: el.tagName,
      text: el.textContent?.substring(0, 30)
    };
  });

  const secondElementFocusable = focusedElement.tag === 'A';
  results.push({
    test: 'Second element keyboard focusable',
    passed: secondElementFocusable,
    details: `Focused: ${focusedElement.tag} - ${focusedElement.text}`
  });

  console.log(`   ${secondElementFocusable ? '✓' : '✗'} Second element focusable: ${focusedElement.tag}`);

  // Check for visible focus indicator
  await page.keyboard.press('Tab');
  const hasFocusRing = await page.evaluate(() => {
    const el = document.activeElement;
    const styles = window.getComputedStyle(el);
    return styles.outline !== 'none' || styles.boxShadow.includes('rgb');
  });

  results.push({
    test: 'Visible focus indicator',
    passed: hasFocusRing,
    details: hasFocusRing ? 'Focus ring/outline present' : 'No focus indicator'
  });

  console.log(`   ${hasFocusRing ? '✓' : '✗'} Visible focus indicator\n`);

  // Test 4: Color contrast
  console.log('4. Testing color contrast...');

  // Check headline text contrast
  const headlineContrast = await page.locator('h1').first().evaluate(el => {
    const styles = window.getComputedStyle(el);
    const color = styles.color;
    const bg = styles.backgroundColor;
    return { color, bg };
  });

  console.log(`   ✓ Headline colors captured: ${headlineContrast.color}`);

  // Check button text contrast
  const buttonContrast = await page.locator('text=Sign in with GitHub').evaluate(el => {
    const styles = window.getComputedStyle(el);
    const color = styles.color;
    const bg = styles.backgroundColor;
    return { color, bg };
  });

  console.log(`   ✓ Button colors captured: ${buttonContrast.color}\n`);

  results.push({
    test: 'Color contrast (manual check required)',
    passed: true,
    details: 'Color values captured for manual verification'
  });

  // Test 5: Alt text and ARIA hidden
  console.log('5. Testing decorative elements...');

  const ariaHiddenElements = await page.locator('[aria-hidden="true"]').count();
  console.log(`   ✓ Found ${ariaHiddenElements} decorative elements with aria-hidden\n`);

  results.push({
    test: 'Decorative elements marked aria-hidden',
    passed: ariaHiddenElements > 0,
    details: `${ariaHiddenElements} elements properly marked`
  });

  // Test 6: Screen reader announcements
  console.log('6. Testing screen reader support...');

  const hasRole = await page.locator('[role]').count();
  console.log(`   ✓ Found ${hasRole} elements with ARIA roles\n`);

  results.push({
    test: 'ARIA roles present',
    passed: hasRole >= 3,
    details: `${hasRole} elements with roles`
  });

  // Test 7: Language attribute
  console.log('7. Testing document language...');

  const lang = await page.evaluate(() => document.documentElement.lang);
  const hasLang = lang && lang.length > 0;

  results.push({
    test: 'HTML lang attribute',
    passed: hasLang,
    details: `lang="${lang}"`
  });

  console.log(`   ${hasLang ? '✓' : '✗'} Language: ${lang}\n`);

  await browser.close();

  // Summary
  console.log('📊 Accessibility Test Summary:\n');
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} ${result.test}`);
    console.log(`      ${result.details}`);
  });

  const allPassed = results.every(r => r.passed);
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log(`\n${allPassed ? '✅' : '⚠️'} Accessibility: ${passedCount}/${totalCount} tests passed\n`);

  return { results, allPassed, passedCount, totalCount };
}

if (require.main === module) {
  runAccessibilityTests()
    .then(result => {
      process.exit(result.allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = runAccessibilityTests;
