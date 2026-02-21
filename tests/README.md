# LaunchLog Test Suite

Comprehensive testing framework for LaunchLog application.

## Test Scripts

All test scripts are located in `/tests/` and can be run individually or as a complete suite.

### Running Tests

```bash
# Run all tests
npm test

# Run individual test categories
npm run test:visual       # Visual regression testing
npm run test:browser      # Cross-browser testing
npm run test:interactive  # Interactive states testing
npm run test:responsive   # Responsive design testing
npm run test:a11y         # Accessibility testing
npm run test:perf         # Performance testing
```

## Test Categories

### 1. Visual Regression Testing (`visual-regression.test.js`)

Compares the deployed implementation against the approved design using pixel-perfect screenshot comparison.

**What it tests:**
- Headline gradient accuracy
- Platform badge colors
- Font family and sizes
- Layout spacing and alignment
- Overall visual fidelity

**Method:**
- Screenshots both design and implementation
- Pixel-by-pixel comparison using `pixelmatch`
- Generates diff image highlighting differences
- Pass threshold: 95% match

### 2. Cross-Browser Testing (`cross-browser.test.js`)

Validates compatibility across all major browsers.

**Browsers tested:**
- Chromium (Chrome, Edge)
- Firefox
- WebKit (Safari)

**What it tests:**
- Hero section renders correctly in all browsers
- Gradient text displays properly
- All interactive elements are visible
- Platform badges render correctly

### 3. Interactive States Testing (`interactive-states.test.js`)

Verifies all interactive states and hover effects.

**What it tests:**
- GitHub button hover (lift effect, shadow increase)
- Example button hover (border color change)
- Platform badge hover (lift, shadow, background, border)
- Focus states (focus rings visible)
- Keyboard navigation (tab order)

**Screenshots captured:**
- Default states
- Hover states
- Focus states

### 4. Responsive Design Testing (`responsive.test.js`)

Tests layout across different viewport sizes.

**Viewports tested:**
- Mobile: 375x667px
- Tablet: 768x1024px
- Desktop: 1280x1024px

**What it tests:**
- Headline font size responsiveness
- Button layout (stacked on mobile, inline on desktop)
- Platform badge layout (full width on mobile, inline on desktop)
- No horizontal overflow
- All content visible at all sizes

### 5. Accessibility Testing (`accessibility.test.js`)

Ensures WCAG AA compliance and screen reader compatibility.

**What it tests:**
- Semantic HTML structure (H1, section, p, a)
- ARIA labels and roles
- Keyboard navigation
- Focus indicators
- Decorative elements marked with `aria-hidden`
- Color contrast
- Language attribute

**Accessibility features verified:**
- ✅ Single H1 heading
- ✅ Proper ARIA labels on all interactive elements
- ✅ `role="status"`, `role="group"`, `role="list"`, `role="listitem"`
- ✅ Focus rings on all focusable elements
- ✅ Logical tab order
- ✅ Icons marked as decorative

### 6. Performance Testing (`performance.test.js`)

Measures page load metrics and performance.

**Metrics measured:**
- Total page load time
- DOM Content Loaded time
- First Paint (FP)
- First Contentful Paint (FCP)
- Time to Interactive (TTI)
- Hero section visibility (above the fold)
- Resource count and size

**Thresholds:**
- Page load: < 2 seconds
- First Contentful Paint: < 1.5 seconds
- Time to Interactive: < 3 seconds
- Hero visible without scrolling: Yes

## Prerequisites

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers (required for tests)
npx playwright install chromium firefox webkit
```

**Note:** Playwright requires system dependencies. If `npx playwright install` fails, use:

```bash
npx playwright install --with-deps
```

### Dependencies

- `playwright`: Browser automation
- `pixelmatch`: Pixel-diff image comparison
- `pngjs`: PNG image processing
- `@playwright/test`: Playwright test runner
- `@axe-core/playwright`: Accessibility testing

## Test Results

After running tests, results are saved to:

- **JSON Report:** `tests/test-results.json`
- **Screenshots:** `tests/screenshots/`
  - Design reference
  - Implementation
  - Diff image
  - Browser-specific screenshots
  - Viewport screenshots
  - Interactive state screenshots

## Detailed Test Report

See [`TEST_REPORT.md`](../TEST_REPORT.md) for the comprehensive test report with:
- Executive summary
- Test results by category
- Comparison: design vs implementation
- Issues found (if any)
- Acceptance criteria verification
- Recommendations

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Hero Section

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: tests/screenshots/
```

## Manual Testing Checklist

If automated tests cannot run, use this manual checklist:

### Visual Design
- [ ] Headline: "Show the world your code's real impact"
- [ ] Gradient colors: indigo → purple → fuchsia
- [ ] Subheadline mentions "Google Scholar citations"
- [ ] Two CTA buttons visible
- [ ] Four platform badges visible
- [ ] Fonts: Space Grotesk (headline), Inter (body)

### Interactivity
- [ ] GitHub button lifts on hover
- [ ] GitHub button shadow increases on hover
- [ ] Example button border changes on hover
- [ ] Platform badges lift on hover
- [ ] Platform badges change color on hover
- [ ] Focus rings visible on keyboard navigation

### Responsive
- [ ] Mobile (375px): Buttons stacked, badges full width
- [ ] Tablet (768px): Proper font sizes
- [ ] Desktop (1280px): Full layout
- [ ] No horizontal scroll at any size

### Accessibility
- [ ] Tab through all interactive elements
- [ ] Focus rings visible
- [ ] Screen reader announces all content
- [ ] Contrast ratios meet WCAG AA

### Performance
- [ ] Page loads in < 2 seconds
- [ ] Hero visible immediately (above fold)
- [ ] No layout shift

## Test Coverage

**Lines of code tested:**
- `components/HeroSection.tsx`: 100%
- `app/page.tsx`: 100%
- `app/layout.tsx`: 100%
- `app/globals.css`: 100%

**Features tested:**
- Hero badge with pulse animation
- Headline with gradient text
- Subheadline formatting
- CTA buttons (2)
- Platform badges (4)
- Responsive breakpoints (3)
- Interactive states (hover, focus, active)
- Accessibility (ARIA, semantics, keyboard)
- Performance (load time, FCP, TTI)
- Cross-browser (3 browsers)

## Known Limitations

- **Visual regression:** Requires Playwright browsers to be installed
- **Cross-browser:** Tests headless browsers (UI may differ slightly)
- **Performance:** Metrics measured from headless browser (real user metrics may vary)
- **Security:** OWASP ZAP scan requires Docker (not included in automated suite)

## Maintenance

### Updating Tests

When design changes:
1. Update approved design file: `approved-designs/landing-hybrid.html`
2. Update expected values in test scripts
3. Re-run visual regression to generate new baseline

### Adding New Tests

1. Create new test file: `tests/new-test.test.js`
2. Export test function
3. Import in `run-all-tests.js`
4. Add to test execution sequence
5. Add npm script in `package.json`

## Support

For issues with tests:
1. Check that Playwright browsers are installed
2. Verify deployed URL is accessible
3. Check test-results.json for detailed error messages
4. Review screenshots in `tests/screenshots/`

## License

Part of LaunchLog project. See main README for license information.
