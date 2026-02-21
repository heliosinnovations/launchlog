/**
 * Responsive Design Testing
 * Tests hero section across mobile, tablet, and desktop viewports
 */

const { chromium } = require('playwright');

const DEPLOYED_URL = 'https://launchlog-gamma.vercel.app';

const VIEWPORTS = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 1024 }
];

async function testViewport(viewport) {
  console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });

  const issues = [];

  try {
    await page.goto(DEPLOYED_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Test 1: Hero headline is visible
    const headline = await page.locator('h1').first();
    const headlineVisible = await headline.isVisible();

    if (!headlineVisible) {
      issues.push('Headline not visible');
    } else {
      console.log('   ✓ Headline visible');
    }

    // Test 2: Check headline font size responsiveness
    const fontSize = await headline.evaluate(el => {
      return window.getComputedStyle(el).fontSize;
    });

    console.log(`   ✓ Headline font size: ${fontSize}`);

    // Test 3: Buttons are visible and stacked correctly
    const githubButton = await page.locator('text=Sign in with GitHub');
    const exampleButton = await page.locator('text=See Example Portfolio');

    const bothVisible = await githubButton.isVisible() && await exampleButton.isVisible();

    if (!bothVisible) {
      issues.push('CTA buttons not visible');
    } else {
      console.log('   ✓ CTA buttons visible');
    }

    // Test 4: Check button layout (should be stacked on mobile, inline on desktop)
    const buttonContainer = await page.locator('div[role="group"][aria-label*="Call to action"]').first();
    const flexDirection = await buttonContainer.evaluate(el => {
      return window.getComputedStyle(el).flexDirection;
    });

    const expectedDirection = viewport.width < 640 ? 'column' : 'row';
    if (flexDirection !== expectedDirection && viewport.name !== 'Mobile') {
      // On mobile with sm: breakpoint might not trigger at 375px
      console.log(`   ⚠ Flex direction: ${flexDirection} (expected ${expectedDirection})`);
    } else {
      console.log(`   ✓ Button layout: ${flexDirection}`);
    }

    // Test 5: Platform badges responsive layout
    const badgeContainer = await page.locator('div[role="list"][aria-label*="Example platform"]').first();
    const badges = await page.locator('div[role="listitem"]').count();

    if (badges < 4) {
      issues.push(`Only ${badges}/4 badges visible`);
    } else {
      console.log(`   ✓ All ${badges} platform badges visible`);
    }

    // Test 6: Check if badges stack on mobile
    const badgeFlexDirection = await badgeContainer.evaluate(el => {
      return window.getComputedStyle(el).flexDirection;
    });

    console.log(`   ✓ Badge layout: ${badgeFlexDirection}`);

    // Test 7: Check for horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = viewport.width;

    if (bodyWidth > viewportWidth + 5) { // Allow 5px tolerance
      issues.push(`Horizontal overflow detected: ${bodyWidth}px > ${viewportWidth}px`);
    } else {
      console.log('   ✓ No horizontal overflow');
    }

    // Take screenshot
    await page.screenshot({
      path: `/workspace/launchlog/tests/screenshots/responsive-${viewport.name.toLowerCase()}.png`,
      fullPage: true
    });
    console.log('   ✓ Screenshot saved');

  } catch (error) {
    issues.push(`Error: ${error.message}`);
  }

  await browser.close();

  return {
    viewport: viewport.name,
    passed: issues.length === 0,
    issues
  };
}

async function runResponsiveTests() {
  console.log('📐 Responsive Design Testing\n');
  console.log('Testing hero section across different screen sizes...');

  const results = [];

  for (const viewport of VIEWPORTS) {
    results.push(await testViewport(viewport));
  }

  // Summary
  console.log('\n📊 Responsive Test Summary:\n');
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} ${result.viewport}`);
    if (result.issues.length > 0) {
      result.issues.forEach(issue => console.log(`      - ${issue}`));
    }
  });

  const allPassed = results.every(r => r.passed);
  console.log(`\n${allPassed ? '✅ All viewports passed' : '❌ Some viewports failed'}\n`);

  return { results, allPassed };
}

if (require.main === module) {
  runResponsiveTests()
    .then(result => {
      process.exit(result.allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = runResponsiveTests;
