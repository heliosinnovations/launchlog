/**
 * Master Test Runner
 * Executes all test suites and generates comprehensive report
 */

const fs = require('fs');
const path = require('path');

// Import test modules
const runVisualRegression = require('./visual-regression.test.js');
const runCrossBrowserTests = require('./cross-browser.test.js');
const runInteractiveStatesTests = require('./interactive-states.test.js');
const runResponsiveTests = require('./responsive.test.js');
const runAccessibilityTests = require('./accessibility.test.js');
const runPerformanceTests = require('./performance.test.js');

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  LaunchLog Hero Section - Comprehensive Test Suite');
  console.log('  Issue #2: Hero Section Deployment Testing');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const startTime = Date.now();
  const testResults = {
    timestamp: new Date().toISOString(),
    issue: '#2',
    component: 'Hero Section',
    deployedUrl: 'https://launchlog-gamma.vercel.app',
    designReference: 'approved-designs/landing-hybrid.html',
    tests: {}
  };

  try {
    // 1. Visual Regression Testing
    console.log('\n═══ 1/6: VISUAL REGRESSION TESTING ═══\n');
    try {
      const visualResult = await runVisualRegression();
      testResults.tests.visualRegression = {
        passed: visualResult.passed,
        matchPercent: visualResult.matchPercent,
        diffPixels: visualResult.numDiffPixels,
        totalPixels: visualResult.totalPixels
      };
    } catch (error) {
      console.error('Visual regression test failed:', error.message);
      testResults.tests.visualRegression = { passed: false, error: error.message };
    }

    // 2. Cross-Browser Testing
    console.log('\n═══ 2/6: CROSS-BROWSER TESTING ═══\n');
    try {
      const browserResult = await runCrossBrowserTests();
      testResults.tests.crossBrowser = {
        passed: browserResult.allPassed,
        results: browserResult.results
      };
    } catch (error) {
      console.error('Cross-browser test failed:', error.message);
      testResults.tests.crossBrowser = { passed: false, error: error.message };
    }

    // 3. Interactive States Testing
    console.log('\n═══ 3/6: INTERACTIVE STATES TESTING ═══\n');
    try {
      const interactiveResult = await runInteractiveStatesTests();
      testResults.tests.interactiveStates = {
        passed: interactiveResult.allPassed,
        results: interactiveResult.results
      };
    } catch (error) {
      console.error('Interactive states test failed:', error.message);
      testResults.tests.interactiveStates = { passed: false, error: error.message };
    }

    // 4. Responsive Design Testing
    console.log('\n═══ 4/6: RESPONSIVE DESIGN TESTING ═══\n');
    try {
      const responsiveResult = await runResponsiveTests();
      testResults.tests.responsive = {
        passed: responsiveResult.allPassed,
        results: responsiveResult.results
      };
    } catch (error) {
      console.error('Responsive test failed:', error.message);
      testResults.tests.responsive = { passed: false, error: error.message };
    }

    // 5. Accessibility Testing
    console.log('\n═══ 5/6: ACCESSIBILITY TESTING ═══\n');
    try {
      const a11yResult = await runAccessibilityTests();
      testResults.tests.accessibility = {
        passed: a11yResult.allPassed,
        passedCount: a11yResult.passedCount,
        totalCount: a11yResult.totalCount,
        results: a11yResult.results
      };
    } catch (error) {
      console.error('Accessibility test failed:', error.message);
      testResults.tests.accessibility = { passed: false, error: error.message };
    }

    // 6. Performance Testing
    console.log('\n═══ 6/6: PERFORMANCE TESTING ═══\n');
    try {
      const perfResult = await runPerformanceTests();
      testResults.tests.performance = {
        passed: perfResult.allPassed,
        passedCount: perfResult.passedCount,
        totalCount: perfResult.totalCount,
        metrics: perfResult.metrics,
        results: perfResult.results
      };
    } catch (error) {
      console.error('Performance test failed:', error.message);
      testResults.tests.performance = { passed: false, error: error.message };
    }

  } catch (error) {
    console.error('\n❌ Fatal error during test execution:', error);
    testResults.fatalError = error.message;
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Generate summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  FINAL TEST REPORT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const categories = Object.entries(testResults.tests);
  const passedCategories = categories.filter(([_, result]) => result.passed);
  const failedCategories = categories.filter(([_, result]) => !result.passed);

  console.log(`Test Duration: ${duration}s\n`);

  console.log('Test Results by Category:\n');
  categories.forEach(([category, result]) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const categoryName = category.replace(/([A-Z])/g, ' $1').trim();
    console.log(`  ${status} ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}`);

    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  console.log(`\n${passedCategories.length}/${categories.length} test categories passed`);

  // Overall result
  const allPassed = failedCategories.length === 0;

  console.log('\n═══════════════════════════════════════════════════════════════');
  if (allPassed) {
    console.log('  ✅ ALL TESTS PASSED - READY FOR PRODUCTION');
  } else {
    console.log('  ❌ SOME TESTS FAILED - BUGS FOUND');
    console.log('\nFailed Categories:');
    failedCategories.forEach(([category, result]) => {
      console.log(`  - ${category}`);
      if (result.results && Array.isArray(result.results)) {
        result.results.forEach(r => {
          if (r.issues && r.issues.length > 0) {
            r.issues.forEach(issue => console.log(`    • ${issue}`));
          }
        });
      }
    });
  }
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Save results to JSON
  const resultsPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`📄 Full test results saved to: ${resultsPath}\n`);

  return {
    allPassed,
    passedCount: passedCategories.length,
    totalCount: categories.length,
    duration,
    testResults
  };
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(result => {
      process.exit(result.allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = runAllTests;
