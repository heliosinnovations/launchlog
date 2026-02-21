/**
 * Performance Testing
 * Tests page load time, First Contentful Paint, and hero visibility
 */

const { chromium } = require('playwright');

const DEPLOYED_URL = 'https://launchlog-gamma.vercel.app';

async function runPerformanceTests() {
  console.log('⚡ Performance Testing\n');
  console.log('Measuring page load metrics...\n');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1024 } });

  const results = [];

  // Enable performance tracking
  await page.goto(DEPLOYED_URL, { waitUntil: 'networkidle' });

  // Measure page load performance
  const performanceMetrics = await page.evaluate(() => {
    const perfData = window.performance.timing;
    const paintEntries = performance.getEntriesByType('paint');

    const loadTime = perfData.loadEventEnd - perfData.navigationStart;
    const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.navigationStart;
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');

    return {
      loadTime,
      domContentLoaded,
      firstPaint: firstPaint ? firstPaint.startTime : null,
      firstContentfulPaint: firstContentfulPaint ? firstContentfulPaint.startTime : null,
      navigationStart: perfData.navigationStart,
      loadEventEnd: perfData.loadEventEnd
    };
  });

  console.log('1. Page Load Metrics:');
  console.log(`   Total Load Time: ${performanceMetrics.loadTime}ms`);
  console.log(`   DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
  console.log(`   First Paint: ${performanceMetrics.firstPaint}ms`);
  console.log(`   First Contentful Paint: ${performanceMetrics.firstContentfulPaint}ms\n`);

  // Test 1: Page load time < 2 seconds
  const loadTimeSeconds = performanceMetrics.loadTime / 1000;
  const loadTimePassed = loadTimeSeconds < 2;

  results.push({
    test: 'Page load time < 2s',
    passed: loadTimePassed,
    details: `${loadTimeSeconds.toFixed(2)}s`,
    threshold: '2s',
    actual: loadTimeSeconds.toFixed(2) + 's'
  });

  console.log(`2. Load Time Test:`);
  console.log(`   ${loadTimePassed ? '✅ PASS' : '❌ FAIL'} Load time: ${loadTimeSeconds.toFixed(2)}s (threshold: <2s)\n`);

  // Test 2: First Contentful Paint < 1.5 seconds
  const fcpSeconds = performanceMetrics.firstContentfulPaint / 1000;
  const fcpPassed = fcpSeconds < 1.5;

  results.push({
    test: 'First Contentful Paint < 1.5s',
    passed: fcpPassed,
    details: `${fcpSeconds.toFixed(2)}s`,
    threshold: '1.5s',
    actual: fcpSeconds.toFixed(2) + 's'
  });

  console.log(`3. First Contentful Paint:`);
  console.log(`   ${fcpPassed ? '✅ PASS' : '❌ FAIL'} FCP: ${fcpSeconds.toFixed(2)}s (threshold: <1.5s)\n`);

  // Test 3: Hero section visible above the fold
  const heroVisible = await page.locator('h1').first().isVisible();
  const heroInViewport = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    if (!h1) return false;

    const rect = h1.getBoundingClientRect();
    return rect.top >= 0 && rect.top < window.innerHeight;
  });

  results.push({
    test: 'Hero section above the fold',
    passed: heroInViewport,
    details: heroInViewport ? 'Visible without scrolling' : 'Requires scrolling'
  });

  console.log(`4. Hero Section Visibility:`);
  console.log(`   ${heroInViewport ? '✅ PASS' : '❌ FAIL'} Hero ${heroInViewport ? 'visible' : 'not visible'} above the fold\n`);

  // Test 4: Resource count and size
  const resources = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource');
    const totalSize = entries.reduce((acc, entry) => acc + (entry.transferSize || 0), 0);

    const byType = entries.reduce((acc, entry) => {
      const type = entry.initiatorType || 'other';
      if (!acc[type]) acc[type] = { count: 0, size: 0 };
      acc[type].count++;
      acc[type].size += entry.transferSize || 0;
      return acc;
    }, {});

    return {
      totalCount: entries.length,
      totalSize,
      byType
    };
  });

  console.log(`5. Resource Analysis:`);
  console.log(`   Total resources: ${resources.totalCount}`);
  console.log(`   Total size: ${(resources.totalSize / 1024).toFixed(2)} KB`);
  Object.entries(resources.byType).forEach(([type, data]) => {
    console.log(`   - ${type}: ${data.count} files (${(data.size / 1024).toFixed(2)} KB)`);
  });
  console.log();

  results.push({
    test: 'Resource efficiency',
    passed: resources.totalSize < 500000, // 500 KB
    details: `${(resources.totalSize / 1024).toFixed(2)} KB total`
  });

  // Test 5: Measure time to interactive (TTI)
  const timeToInteractive = await page.evaluate(() => {
    const navTiming = performance.timing;
    return navTiming.loadEventEnd - navTiming.navigationStart;
  });

  const ttiSeconds = timeToInteractive / 1000;

  console.log(`6. Time to Interactive:`);
  console.log(`   ${ttiSeconds.toFixed(2)}s\n`);

  results.push({
    test: 'Time to Interactive',
    passed: ttiSeconds < 3,
    details: `${ttiSeconds.toFixed(2)}s`,
    threshold: '<3s'
  });

  await browser.close();

  // Summary
  console.log('📊 Performance Test Summary:\n');
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const threshold = result.threshold ? ` (threshold: ${result.threshold})` : '';
    console.log(`   ${status} ${result.test}`);
    console.log(`      ${result.details}${threshold}`);
  });

  const allPassed = results.every(r => r.passed);
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log(`\n${allPassed ? '✅' : '⚠️'} Performance: ${passedCount}/${totalCount} tests passed\n`);

  return { results, allPassed, passedCount, totalCount, metrics: performanceMetrics };
}

if (require.main === module) {
  runPerformanceTests()
    .then(result => {
      process.exit(result.allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = runPerformanceTests;
