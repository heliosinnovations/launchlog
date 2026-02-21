/**
 * Visual Regression Testing for Hero Section
 * Compares deployed implementation against approved design
 */

const fs = require('fs');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const { chromium } = require('playwright');

const DEPLOYED_URL = 'https://launchlog-gamma.vercel.app';
const DESIGN_FILE_URL = 'https://raw.githubusercontent.com/heliosinnovations/launchlog/main/approved-designs/landing-hybrid.html';

async function runVisualRegression() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1024 } });

  console.log('📸 Taking screenshots for visual regression testing...\n');

  // Screenshot the deployed implementation
  console.log('1. Capturing deployed implementation...');
  await page.goto(DEPLOYED_URL, { waitUntil: 'networkidle' });

  // Wait for hero section to be fully rendered
  await page.waitForSelector('h1');
  await page.waitForTimeout(2000); // Wait for any animations/transitions

  const implementationPath = '/workspace/launchlog/tests/screenshots/implementation.png';
  await page.screenshot({ path: implementationPath, fullPage: false });
  console.log(`   ✓ Saved: ${implementationPath}\n`);

  // Screenshot the approved design
  console.log('2. Capturing approved design...');
  const designPage = await browser.newPage({ viewport: { width: 1280, height: 1024 } });
  await designPage.goto(`file:///workspace/launchlog/approved-designs/landing-hybrid.html`, { waitUntil: 'networkidle' });
  await designPage.waitForSelector('h1');
  await designPage.waitForTimeout(2000);

  const designPath = '/workspace/launchlog/tests/screenshots/design-reference.png';
  await designPage.screenshot({ path: designPath, fullPage: false });
  console.log(`   ✓ Saved: ${designPath}\n`);

  await browser.close();

  // Compare images
  console.log('3. Comparing images pixel-by-pixel...\n');

  const img1 = PNG.sync.read(fs.readFileSync(designPath));
  const img2 = PNG.sync.read(fs.readFileSync(implementationPath));
  const { width, height } = img1;
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
  const totalPixels = width * height;
  const matchPercent = ((totalPixels - numDiffPixels) / totalPixels * 100).toFixed(2);

  const diffPath = '/workspace/launchlog/tests/screenshots/diff.png';
  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  console.log(`   Match: ${matchPercent}%`);
  console.log(`   Diff pixels: ${numDiffPixels} / ${totalPixels}`);
  console.log(`   Diff image: ${diffPath}\n`);

  const passed = matchPercent >= 95; // Allow 5% difference for fonts, rendering variations
  console.log(passed ? '✅ PASS: Visual regression test passed' : '❌ FAIL: Visual regression test failed');
  console.log(`   Threshold: 95% match required\n`);

  return {
    passed,
    matchPercent: parseFloat(matchPercent),
    numDiffPixels,
    totalPixels,
    diffPath,
    implementationPath,
    designPath
  };
}

// Export for use in other scripts
if (require.main === module) {
  runVisualRegression()
    .then(result => {
      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = runVisualRegression;
