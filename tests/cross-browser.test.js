/**
 * Cross-Browser Testing for Hero Section
 * Tests compatibility across Chromium, Firefox, and WebKit (Safari)
 */

const { chromium, firefox, webkit } = require('playwright');

const DEPLOYED_URL = 'https://launchlog-gamma.vercel.app';

async function testBrowser(browserType, browserName) {
  console.log(`\n🌐 Testing ${browserName}...`);
  const browser = await browserType.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1024 } });

  const issues = [];

  try {
    // Navigate to deployed URL
    await page.goto(DEPLOYED_URL, { waitUntil: 'networkidle' });

    // Test 1: Hero headline renders correctly
    const headline = await page.locator('h1').first();
    const headlineText = await headline.textContent();

    if (!headlineText.includes('Show the world your')) {
      issues.push('Hero headline text incorrect');
    } else {
      console.log('   ✓ Hero headline renders');
    }

    // Test 2: Gradient text exists
    const gradientText = await page.locator('.bg-gradient-to-r').first();
    const gradientVisible = await gradientText.isVisible();

    if (!gradientVisible) {
      issues.push('Gradient text not visible');
    } else {
      console.log('   ✓ Gradient text visible');
    }

    // Test 3: CTA buttons exist and are clickable
    const githubButton = await page.locator('text=Sign in with GitHub');
    const buttonVisible = await githubButton.isVisible();

    if (!buttonVisible) {
      issues.push('GitHub button not visible');
    } else {
      console.log('   ✓ GitHub button visible');
    }

    // Test 4: Platform badges render
    const hnBadge = await page.locator('text=127').first();
    const badgeVisible = await hnBadge.isVisible();

    if (!badgeVisible) {
      issues.push('Platform badges not rendering');
    } else {
      console.log('   ✓ Platform badges render');
    }

    // Take screenshot
    await page.screenshot({
      path: `/workspace/launchlog/tests/screenshots/${browserName.toLowerCase()}.png`
    });
    console.log(`   ✓ Screenshot saved`);

  } catch (error) {
    issues.push(`Error: ${error.message}`);
  }

  await browser.close();

  return {
    browser: browserName,
    passed: issues.length === 0,
    issues
  };
}

async function runCrossBrowserTests() {
  console.log('🧪 Cross-Browser Testing\n');
  console.log('Testing hero section across multiple browsers...');

  const results = [];

  // Test Chromium (Chrome)
  results.push(await testBrowser(chromium, 'Chromium'));

  // Test Firefox
  results.push(await testBrowser(firefox, 'Firefox'));

  // Test WebKit (Safari)
  results.push(await testBrowser(webkit, 'WebKit'));

  // Summary
  console.log('\n📊 Cross-Browser Test Summary:\n');
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} ${result.browser}`);
    if (result.issues.length > 0) {
      result.issues.forEach(issue => console.log(`      - ${issue}`));
    }
  });

  const allPassed = results.every(r => r.passed);
  console.log(`\n${allPassed ? '✅ All browsers passed' : '❌ Some browsers failed'}\n`);

  return { results, allPassed };
}

if (require.main === module) {
  runCrossBrowserTests()
    .then(result => {
      process.exit(result.allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = runCrossBrowserTests;
